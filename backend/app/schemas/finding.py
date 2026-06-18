from pydantic import BaseModel


class Finding(BaseModel):
    port: int
    pid: int
    process: str
    status: str
    severity: str
    risk_score: int
    reason: str