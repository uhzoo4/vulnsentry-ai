from pydantic import BaseModel
from typing import List, Optional

class FindingItem(BaseModel):
    port: int
    service: str
    severity: str
    risk_score: float

class AnalysisRequest(BaseModel):
    findings: List[FindingItem]
    posture_score: Optional[float] = None
    open_ports: Optional[List[int]] = None
    scores: Optional[List[float]] = None

class AnalysisResponse(BaseModel):
    summary: Optional[str] = None
    severity: Optional[str] = None
    explanation: Optional[str] = None
    recommendations: Optional[List[str]] = None
    status: Optional[str] = None
    message: Optional[str] = None
