from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.core import state
from app.schemas.analysis_response import AnalysisRequest, AnalysisResponse
from app.core.rate_limiter import rate_limit_ai
from app.core.gemini_service import GeminiAnalysisService

router = APIRouter()

def get_service():
    return GeminiAnalysisService()

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

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    request: AnalysisRequest,
    _: None = Depends(rate_limit_ai)
):
    """
    Analyzes local machine vulnerabilities and service exposures.
    """
    findings_list = [item.dict() for item in request.findings]
    
    service = get_service()

    result = await service.analyze_findings(
        findings=findings_list,
        posture_score=request.posture_score,
        open_ports=request.open_ports,
        scores=request.scores
    )
    
    return AnalysisResponse(**result)
