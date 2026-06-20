from pydantic import BaseModel
from typing import Optional

class Connection(BaseModel):
    processName: str
    processPid: int
    processPath: Optional[str] = None
    port: int
    protocol: str
    state: str
    severity: str
