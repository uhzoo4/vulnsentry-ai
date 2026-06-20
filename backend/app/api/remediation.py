from fastapi import APIRouter, HTTPException, Body, Request, Depends
from app.core import state
from app.core.remediator import execute_remediation_command
from app.core.posture_score import calculate_posture_score
from app.core.config import settings

router = APIRouter()

def verify_admin_access(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    is_local = client_ip in ("127.0.0.1", "::1", "localhost")
    
    # Check if API_SECRET is set
    api_secret = settings.API_SECRET
    if api_secret:
        # Check header
        secret_header = request.headers.get("X-API-Secret")
        if secret_header != api_secret:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Invalid API secret."
            )
            
    if not is_local:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Administrative actions are restricted to local connections only."
        )

@router.post("/remediate/{finding_id}", dependencies=[Depends(verify_admin_access)])
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
