from pydantic import BaseModel
from typing import List, Optional
from app.schemas.finding import Finding

class ScanRequest(BaseModel):
    target: str
    intensity: str = "standard"

class ScanSummary(BaseModel):
    totalPortsScanned: int
    openPortsFound: int
    criticalFindings: int
    highFindings: int
    mediumFindings: int
    lowFindings: int

class AiInsight(BaseModel):
    recommendation: str
    topFindingId: str

class ScanDelta(BaseModel):
    resolvedFindingIds: List[str]
    newFindingIds: List[str]
    attackSurfaceChangePercent: float

class ScanReport(BaseModel):
    scanId: str
    target: str
    timestamp: str
    postureScore: int
    previousPostureScore: Optional[int] = None
    summary: ScanSummary
    findings: List[Finding]
    aiInsight: Optional[AiInsight] = None
    delta: Optional[ScanDelta] = None

class ScanState(BaseModel):
    scanId: str
    status: str # 'idle' | 'running' | 'complete' | 'error'
    progress: float
    phase: str # 'discovery' | 'assessment' | 'correlation'
    findings: List[Finding]
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
