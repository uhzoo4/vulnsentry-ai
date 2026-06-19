from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.core import state

router = APIRouter()

@router.get("/findings")
def get_findings():
    """
    Returns the findings from the most recent completed scan report.
    """
    if not state.LAST_REPORT:
        return []
    return state.LAST_REPORT.get("findings", [])

@router.get("/findings/export")
def export_findings():
    """
    Returns the latest ScanReport as a downloadable JSON attachment.
    """
    if not state.LAST_REPORT:
        raise HTTPException(
            status_code=404, 
            detail="No scan report available to export. Run a scan first."
        )
        
    return JSONResponse(
        content=state.LAST_REPORT,
        headers={
            "Content-Disposition": "attachment; filename=\"vulnsentry-report.json\""
        }
    )

@router.get("/findings/{finding_id}")
async def get_finding_detail(finding_id: str):
    """
    Retrieves detailed info for a single finding, populating the AI Teach Block lazily.
    """
    if not state.LAST_REPORT:
        raise HTTPException(status_code=404, detail="No scan report exists in the current session.")
        
    findings = state.LAST_REPORT.get("findings", [])
    finding = None
    for f in findings:
        if f.get("id") == finding_id:
            finding = f
            break
            
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding with ID {finding_id} not found.")
        
    # Lazy load the Teach Block if not already populated
    if not finding.get("teachBlock"):
        rule_id = finding.get("ruleId")
        service_name = finding.get("serviceName")
        port = finding.get("port")
        process_name = finding.get("processName")
        
        teach_text = await state.ai_service.generate_teach_block(
            rule_id=rule_id,
            service_name=service_name,
            port=port,
            process_name=process_name
        )
        finding["teachBlock"] = teach_text
        
    return finding
