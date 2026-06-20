import asyncio
import json
import uuid
import psutil
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Request
from starlette.responses import StreamingResponse

from app.schemas.analysis import ScanRequest
from app.core.security import validate_target
from app.core.scanner import scan_target
from app.core.resolver import resolve_process_details
from app.core.risk_engine import analyze_port
from app.core.remediator import get_remediation_for_finding
from app.core.report_merger import merge_reports
from app.core import state
from app.core.rate_limiter import rate_limit_scan

logger = logging.getLogger("vulnsentry.api.scan")

router = APIRouter()

def find_process_for_port(port: int) -> Optional[int]:
    """
    Scans active connections to find the PID listening on a given port.
    """
    try:
        for conn in psutil.net_connections(kind="inet"):
            if conn.laddr and conn.laddr.port == port and conn.pid:
                return conn.pid
    except Exception:
        pass
    return None

async def run_scan_task(scan_id: str, target: str):
    """
    Background worker that runs the port scan, calculates risk scores, 
    maps owning processes, generates report summaries, and invokes Gemini for insights.
    """
    state.ACTIVE_SCANS[scan_id] = {
        "scanId": scan_id,
        "status": "running",
        "progress": 0.0,
        "phase": "discovery",
        "currentPort": None,
        "totalPorts": 1000,
        "findings": []
    }
    
    try:
        # Step 1: Run TCP Connect Port Scan
        async for update in scan_target(target):
            scan_state = state.ACTIVE_SCANS[scan_id]
            scan_state["progress"] = update["progress"]
            scan_state["currentPort"] = update["currentPort"]
            
            res = update["result"]
            if res["state"] == "open":
                port = res["port"]
                pid = find_process_for_port(port) or 0
                proc_name, proc_path = resolve_process_details(pid) if pid > 0 else ("Unknown", None)
                
                # Check connection binding to see if exposed (0.0.0.0)
                bind_addr = None
                try:
                    for conn in psutil.net_connections(kind="inet"):
                        if conn.laddr and conn.laddr.port == port:
                            bind_addr = conn.laddr.ip
                            break
                except Exception:
                    pass
                
                # Evaluate risk
                risk = analyze_port(port, proc_name, bind_addr, res.get("banner"))
                
                # Fetch remediation command
                remediation = get_remediation_for_finding(risk["rule_id"], pid)
                
                finding = {
                    "id": f"f-{port}",
                    "severity": risk["severity"],
                    "serviceName": risk["serviceName"],
                    "port": port,
                    "protocol": "tcp",
                    "processName": proc_name,
                    "processPid": pid,
                    "processPath": proc_path,
                    "riskScore": risk["risk_score"],
                    "ruleId": risk["rule_id"],
                    "fixDifficulty": risk["fix_difficulty"],
                    "status": "open",
                    "teachBlock": None,  # Populated lazily on GET /api/findings/{id}
                    "remediation": remediation,
                    "discoveredAt": datetime.utcnow().isoformat() + "Z"
                }
                scan_state["findings"].append(finding)
                
        # Step 2: Assessment Phase
        state.ACTIVE_SCANS[scan_id]["phase"] = "assessment"
        findings = state.ACTIVE_SCANS[scan_id]["findings"]
        
        # Merge report & compute delta comparison
        report = merge_reports(target, findings, state.LAST_REPORT)
        
        # Step 3: Correlation Phase (AI Holistic Insight)
        state.ACTIVE_SCANS[scan_id]["phase"] = "correlation"
        ai_insight = await state.ai_service.generate_holistic_insight(report)
        report["aiInsight"] = ai_insight
        
        # Save output in memory session
        state.LAST_REPORT = report
        state.COMPLETED_REPORTS.append(report)
        
        state.ACTIVE_SCANS[scan_id]["status"] = "complete"
        state.ACTIVE_SCANS[scan_id]["report"] = report
        
    except Exception as e:
        state.ACTIVE_SCANS[scan_id]["status"] = "error"
        state.ACTIVE_SCANS[scan_id]["error"] = str(e)

@router.post("/scan")
def start_scan(request: ScanRequest, background_tasks: BackgroundTasks, _rate_limit = Depends(rate_limit_scan)):
    """
    REST endpoint to initiate an asynchronous TCP port scan of the target host.
    """
    logger.info("Scan started.")
    valid_target = validate_target(request.target)
    scan_id = str(uuid.uuid4())
    
    # Run scan in the background
    background_tasks.add_task(run_scan_task, scan_id, valid_target)
    
    return {
        "scanId": scan_id,
        "status": "initiated"
    }

@router.get("/scan/status")
async def scan_status_stream(scanId: str):
    """
    SSE stream delivering real-time scan progress and findings, ending with the merged report.
    """
    async def event_generator():
        while True:
            scan = state.ACTIVE_SCANS.get(scanId)
            if not scan:
                yield f"event: error\ndata: {json.dumps({'detail': 'Scan ID not found'})}\n\n"
                break
                
            status = scan.get("status")
            
            if status == "running":
                payload = {
                    "scanId": scanId,
                    "status": "running",
                    "progress": scan.get("progress", 0.0),
                    "phase": scan.get("phase", "discovery"),
                    "currentPort": scan.get("currentPort"),
                    "totalPorts": scan.get("totalPorts", 1000),
                    "foundSoFar": [
                        {"port": f["port"], "state": "open", "service": f["serviceName"], "banner": None}
                        for f in scan.get("findings", [])
                    ]
                }
                yield f"event: scan_progress\ndata: {json.dumps(payload)}\n\n"
                
            elif status == "complete":
                payload = {
                    "scanId": scanId,
                    "status": "complete",
                    "report": scan.get("report")
                }
                yield f"event: scan_complete\ndata: {json.dumps(payload)}\n\n"
                break
                
            elif status == "error":
                payload = {
                    "scanId": scanId,
                    "status": "failed",
                    "error": scan.get("error", "Unknown scan error")
                }
                yield f"event: scan_complete\ndata: {json.dumps(payload)}\n\n"
                break
                
            await asyncio.sleep(0.5)
 
    return StreamingResponse(event_generator(), media_type="text/event-stream")
