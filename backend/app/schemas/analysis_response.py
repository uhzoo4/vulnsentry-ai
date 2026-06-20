from pydantic import BaseModel, Field, validator
from typing import List, Optional

class FindingItem(BaseModel):
    port: int = Field(..., ge=1, le=65535)
    service: str = Field(..., min_length=1, max_length=100)
    severity: str = Field(..., min_length=1, max_length=20)
    risk_score: float = Field(..., ge=0.0, le=100.0)

    @validator('severity')
    def validate_severity(cls, v):
        v_upper = v.strip().upper()
        allowed = {'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'UNKNOWN'}
        if v_upper not in allowed:
            raise ValueError(f"Severity must be one of {allowed}")
        return v_upper

class AnalysisRequest(BaseModel):
    findings: List[FindingItem] = Field(..., max_items=100)
    posture_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    open_ports: Optional[List[int]] = Field(None, max_items=100)
    scores: Optional[List[float]] = Field(None, max_items=100)

    @validator('open_ports', each_item=True)
    def validate_open_ports(cls, v):
        if not (1 <= v <= 65535):
            raise ValueError("Port must be between 1 and 65535")
        return v

    @validator('scores', each_item=True)
    def validate_scores(cls, v):
        if not (0.0 <= v <= 100.0):
            raise ValueError("Score must be between 0.0 and 100.0")
        return v

class AnalysisResponse(BaseModel):
    summary: Optional[str] = None
    severity: Optional[str] = None
    explanation: Optional[str] = None
    recommendations: Optional[List[str]] = None
    status: Optional[str] = None
    message: Optional[str] = None

