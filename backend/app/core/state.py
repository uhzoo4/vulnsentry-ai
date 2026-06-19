from typing import Dict, Any, List, Optional
from app.core.ai_orchestrator import GeminiService

# Global session state (No database configuration)
ACTIVE_SCANS: Dict[str, Dict[str, Any]] = {}
COMPLETED_REPORTS: List[Dict[str, Any]] = []
LAST_REPORT: Optional[Dict[str, Any]] = None

# Shared AI service client
ai_service = GeminiService()
