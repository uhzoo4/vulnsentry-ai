# Gemini Orchestration System Implementation Plan

Build the AI analysis orchestration layer using the Gemini API to analyze local machine vulnerabilities and service exposures, providing educational and defensive insights.

## User Review Required

> [!IMPORTANT]
> The backend application uses FastAPI. We will create the new analyze route under `backend/app/api/analyze.py` and register it in `backend/app/main.py`. The Gemini API client will utilize the `google-generativeai` library.

## Open Questions

> [!NOTE]
> No major blockers are identified. We will load the API keys via `python-dotenv` from the environment.

## Proposed Changes

### [Backend Components]

#### [NEW] [analysis_response.py](file:///d:/WebProjects/VulnSentry%20AI/backend/app/schemas/analysis_response.py)
* Define Pydantic request and response schemas for `/api/analyze`.
* `AnalysisRequest` will accept a list of findings, posture scores, open ports, and risk scores.
* `AnalysisResponse` will return the AI summary, severity level, explanations, and list of recommended defensive actions, or fallback metadata.

#### [NEW] [gemini_service.py](file:///d:/WebProjects/VulnSentry%20AI/backend/app/core/gemini_service.py)
* Initialize the Gemini Generative Model client using `google.generativeai`.
* Read configuration from `GEMINI_API_KEY` and `GEMINI_MODEL` (defaulting to `gemini-2.5-flash`).
* Construct a system prompt enforcing defensive guidance and prohibiting exploit/offensive instructions.
* Call the API using an asynchronous execution wrapper and parse the structured JSON response, handling exceptions with static offline fallbacks.

#### [NEW] [analyze.py](file:///d:/WebProjects/VulnSentry%20AI/backend/app/api/analyze.py)
* Implement the FastAPI router for `POST /api/analyze`.
* Instantiate the Gemini service and call it to perform the analysis.

#### [NEW] [requirements.txt](file:///d:/WebProjects/VulnSentry%20AI/backend/requirements.txt)
* List required python libraries: `google-generativeai` and `python-dotenv`.

#### [NEW] [.env.example](file:///d:/WebProjects/VulnSentry%20AI/backend/.env.example)
* Provide templates for `GEMINI_API_KEY` and `GEMINI_MODEL`.

#### [MODIFY] [main.py](file:///d:/WebProjects/VulnSentry%20AI/backend/app/main.py)
* Register `/api/analyze` router prefix in the FastAPI main application instance.

---

## Verification Plan

### Automated Tests
* Run FastAPI locally and perform integration tests via `curl`:
  ```bash
  curl -X POST "http://localhost:8000/api/analyze" \
       -H "Content-Type: application/json" \
       -d '{"findings": [{"port": 3306, "service": "mysql", "severity": "high", "risk_score": 8.2}]}'
  ```

### Manual Verification
* Test fallback mode when `GEMINI_API_KEY` is not configured, verifying that the application gracefully returns fallback JSON without throwing exceptions.
