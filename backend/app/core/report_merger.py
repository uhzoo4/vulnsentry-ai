from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid
from app.core.posture_score import calculate_posture_score

def merge_reports(
    target: str,
    findings: List[Dict[str, Any]],
    previous_report: Optional[Dict[str, Any]] = None,
    total_ports_scanned: int = 1000
) -> Dict[str, Any]:
    """
    Combines current findings with the previous scan report to construct a complete ScanReport.
    Computes delta and posture score progression.
    """
    scan_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Calculate posture score
    posture_score = calculate_posture_score(findings)
    
    # Count severities
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        sev = f.get("severity", "low").lower()
        if sev in severity_counts:
            severity_counts[sev] += 1
            
    summary = {
        "totalPortsScanned": total_ports_scanned,
        "openPortsFound": len(findings),
        "criticalFindings": severity_counts["critical"],
        "highFindings": severity_counts["high"],
        "mediumFindings": severity_counts["medium"],
        "lowFindings": severity_counts["low"]
    }
    
    report = {
        "scanId": scan_id,
        "target": target,
        "timestamp": timestamp,
        "postureScore": posture_score,
        "previousPostureScore": previous_report.get("postureScore") if previous_report else None,
        "summary": summary,
        "findings": findings,
        "aiInsight": None,
        "delta": None
    }
    
    if previous_report:
        prev_findings = {f["id"]: f for f in previous_report.get("findings", [])}
        curr_findings = {f["id"]: f for f in findings}
        
        resolved_ids = [fid for fid in prev_findings if fid not in curr_findings]
        new_ids = [fid for fid in curr_findings if fid not in prev_findings]
        
        prev_open_count = len(prev_findings)
        curr_open_count = len(curr_findings)
        if prev_open_count > 0:
            attack_surface_change = round(((curr_open_count - prev_open_count) / prev_open_count) * 100, 2)
        else:
            attack_surface_change = 0.0
            
        report["delta"] = {
            "resolvedFindingIds": resolved_ids,
            "newFindingIds": new_ids,
            "attackSurfaceChangePercent": attack_surface_change
        }
        
    return report
