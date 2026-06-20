import json
import logging
import asyncio
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("vulnsentry.gemini")

# Try importing google-generativeai
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    logger.warning("google-generativeai package not found. Fallback mode active.")

class GeminiAnalysisService:
    def __init__(self):
        self.configured = False
        if HAS_GENAI and settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.configured = True
            except Exception as e:
                # Log a generic error message, never logging the actual key
                logger.error("Failed to configure Gemini Generative AI SDK.")

    def _get_fallback_response(self) -> Dict[str, Any]:
        return {
            "status": "fallback",
            "summary": "AI analysis unavailable.",
            "severity": "UNKNOWN",
            "explanation": "Could not connect to the VulnSentry AI analysis engine.",
            "recommendations": [
                "Retry analysis later."
            ]
        }

    async def analyze_findings(
        self,
        findings: List[Dict[str, Any]],
        posture_score: float = None,
        open_ports: List[int] = None,
        scores: List[float] = None
    ) -> Dict[str, Any]:
        """
        Main entry point for security posture analysis.
        Runs the blocking Gemini API call in an executor with a 20-second timeout.
        """
        if not self.configured or not HAS_GENAI or not settings.AI_ENABLED:
            return self._get_fallback_response()

        try:
            # Build list of findings details for the model
            findings_text = ""
            max_severity = "LOW"
            severity_priority = {"critical": 4, "high": 3, "medium": 2, "low": 1}
            highest_priority = 0

            for idx, f in enumerate(findings):
                port = f.get("port")
                service = f.get("service")
                severity = f.get("severity", "low").lower()
                risk_score = f.get("risk_score", 0.0)

                findings_text += f"- Finding #{idx+1}: Port {port} running service '{service}' (Severity: {severity.upper()}, Risk Score: {risk_score}/100)\n"
                
                prio = severity_priority.get(severity, 1)
                if prio > highest_priority:
                    highest_priority = prio
                    max_severity = severity.upper()

            # Compile prompt
            prompt = (
                "You are VulnSentry AI.\n"
                "You are a defensive cybersecurity analyst.\n"
                "Your responsibilities:\n"
                "* explain findings\n"
                "* educate users\n"
                "* recommend defensive actions\n\n"
                "Never:\n"
                "* generate exploits\n"
                "* generate payloads\n"
                "* provide offensive techniques\n"
                "* provide attack instructions\n\n"
                f"Analyze the following local security exposure scan data:\n"
                f"Overall Posture Score: {posture_score if posture_score is not None else 'N/A'}\n"
                f"Open Ports: {open_ports if open_ports else 'N/A'}\n"
                f"Exposure Risk Scores: {scores if scores else 'N/A'}\n\n"
                f"Scan Findings:\n{findings_text if findings_text else 'No active findings exposed.'}\n\n"
                "Respond ONLY with a valid JSON object matching the schema below. Do not wrap in markdown blocks. "
                "The json response must contain the following keys:\n"
                "- 'summary': A 1-2 sentence high-level summary of the overall machine posture.\n"
                "- 'severity': The calculated overall threat severity (e.g. 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW').\n"
                "- 'explanation': A simple 2-3 sentence educational explanation detailing why these active ports present a vulnerability risk.\n"
                "- 'recommendations': A list of specific action-oriented defensive recommendations to secure the machine.\n"
                "Do not include any other keys in the response."
            )

            # Define generative model and Generation Config
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            generation_config = {
                "response_mime_type": "application/json"
            }

            loop = asyncio.get_running_loop()
            
            # Run blocking content generation in thread executor with 20s timeout
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: model.generate_content(
                        contents=prompt,
                        generation_config=generation_config
                    )
                ),
                timeout=20.0
            )

            response_text = response.text.strip()
            
            # Parse and return JSON
            data = json.loads(response_text)
            return {
                "summary": data.get("summary", "System analysis complete."),
                "severity": data.get("severity", max_severity),
                "explanation": data.get("explanation", "Review active TCP sockets and local bindings."),
                "recommendations": data.get("recommendations", ["Review active ports and service bindings."]),
                "status": "success"
            }

        except asyncio.TimeoutError:
            logger.error("Gemini timeout.")
            return self._get_fallback_response()
        except json.JSONDecodeError:
            logger.error("Gemini API returned an invalid response format.")
            return self._get_fallback_response()
        except Exception as e:
            logger.error("Gemini API failure occurred.")
            return self._get_fallback_response()
