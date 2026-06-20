from fastapi import APIRouter
from app.schemas.analysis_response import AnalysisRequest, AnalysisResponse
from app.core.gemini_service import GeminiAnalysisService

router = APIRouter()
analyze_service = GeminiAnalysisService()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_security_posture(request: AnalysisRequest):
    """
    Analyzes local machine vulnerabilities and service exposures.
    """
    # Convert the pydantic request objects to dictionary lists for the service
    findings_list = [item.dict() for item in request.findings]
    
    result = await analyze_service.analyze_findings(
        findings=findings_list,
        posture_score=request.posture_score,
        open_ports=request.open_ports,
        scores=request.scores
    )
    
    return AnalysisResponse(**result)
