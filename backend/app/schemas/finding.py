from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Remediation(BaseModel):
    command: str
    description: str
    os: str # 'windows' | 'linux' | 'macos'
    requiresAdmin: bool

class Finding(BaseModel):
    id: str
    severity: str # 'critical' | 'high' | 'medium' | 'low'
    serviceName: str
    port: int
    protocol: str # 'tcp' | 'udp'
    processName: str
    processPid: int
    processPath: Optional[str] = None
    riskScore: float # 0-10
    ruleId: str
    fixDifficulty: int # 1-5
    status: str # 'open' | 'mitigated' | 'dismissed' | 'snoozed'
    teachBlock: Optional[str] = None
    remediation: Optional[Remediation] = None
    discoveredAt: str # ISO 8601 string