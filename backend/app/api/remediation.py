from fastapi import APIRouter, HTTPException, Body
from app.core import state
from app.core.remediator import execute_remediation_command
from app.core.posture_score import calculate_posture_score

router = APIRouter()

@router.post("/remediate/{finding_id}")
async def remediate_finding(finding_id: str, payload: dict = Body(...)):
    """
    Executes the remediation command for a given finding if confirmed by the user.
    """
    if not payload.get("confirmed"):
        raise HTTPException(
            status_code=400, 
            detail="Remediation action must be explicitly confirmed."
        )
        
    if not state.LAST_REPORT:
        raise HTTPException(
            status_code=404, 
            detail="No scan report found in the current session."
        )
        
    findings = state.LAST_REPORT.get("findings", [])
    finding = None
    for f in findings:
        if f.get("id") == finding_id:
            finding = f
            break
            
    if not finding:
        raise HTTPException(
            status_code=404, 
            detail=f"Finding with ID {finding_id} not found."
        )
        
    remediation = finding.get("remediation")
    if not remediation:
        raise HTTPException(
            status_code=400, 
            detail=f"No remediation available for finding {finding_id}."
        )
        
    command = remediation.get("command")
    requires_admin = remediation.get("requiresAdmin", False)
    
    # Run the remediation command
    exec_res = await execute_remediation_command(command)
    
    if exec_res.get("success", False):
        finding["status"] = "mitigated"
        
        # Update posture score dynamically in the active report
        state.LAST_REPORT["postureScore"] = calculate_posture_score(findings)
        
        return {
            "findingId": finding_id,
            "command": command,
            "executed": True,
            "result": exec_res.get("result"),
            "requiresAdmin": requires_admin
        }
    else:
        return {
            "findingId": finding_id,
            "command": command,
            "executed": False,
            "result": exec_res.get("result"),
            "requiresAdmin": requires_admin
        }
