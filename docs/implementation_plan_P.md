# Implementation Plan — Security, Deployment & Production Hardening

This plan outlines the steps and code changes required to harden the VulnSentry AI backend for public deployment on Hugging Face Spaces (and the public internet) for hackathons and demonstration purposes.

## Proposed Changes

We will introduce a custom sliding-window rate limiter, a global exception-handling middleware, a log-rotation system that redacts sensitive keys, strict input schema validation using Pydantic, admin endpoint protection (local-only + secret token), a multi-stage Docker build, and environment safety configurations.

---

### Component 1: Security & Rate Limiting Abstractions

We will create two new modules under `backend/app/core/` to handle rate limiting and secure logging config.

#### [NEW] [rate_limiter.py](file:///d:/WebProjects/VulnSentry%20AI/backend/app/core/rate_limiter.py)
* Implements an in-memory `InMemoryRateLimiter` class using sliding window/timestamp tracking per client IP address.
* Registers two separate rate limit checks:
  * **Scan limit:** 5 requests per minute for `/api/scan`.
  * **AI limit:** 20 requests per minute for `/api/analyze`.
* Exposes standard FastAPI dependencies `rate_limit_scan` and `rate_limit_ai` raising a custom exception or HTTP 429 when limits are exceeded.

#### [NEW] [logging_config.py](file:///d:/WebProjects/VulnSentry%20AI/backend/app/core/logging_config.py)
* Automatically creates a `logs/` directory in the workspace.
* Sets up a `RotatingFileHandler` writing to `logs/backend.log` (5MB max size, 5 backups max) and a console handler.
* Uses a custom `RedactingFilter` to scan and redact any matches of potential Gemini API keys (pattern `AIzaSy[A-Za-z0-9_-]{33}`) and common sensitive parameters from logs before writing them to disk.

---

### Component 2: API Route Hardening & Validation

We will integrate validation, rate limiting, and access control into the router files.

#### [MODIFY] [scan.py](file:///d:/WebProjects/VulnSentry%20AI/backend/app/api/scan.py)
* Imports `rate_limit_scan` from `app.core.rate_limiter`.
* Registers `Depends(rate_limit_scan)` on the `POST /api/scan` endpoint.

#### [MODIFY] [analyze.py](file:///d:/WebProjects%20AI/backend/app/api/analyze.py)
* Imports `rate_limit_ai` from `app.core.rate_limiter`.
* Registers `Depends(rate_limit_ai)` on the `POST /api/analyze` endpoint.
* Enforces request body validation checks using modified Pydantic validators.

#### [MODIFY] [remediation.py](file:///d:/WebProjects%20AI/backend/app/api/remediation.py)
* Adds verification to `remediate_finding`:
  * Enforces client IP must be loopback (`127.0.0.1`, `::1`).
  * If `API_SECRET` is set in the environment, verifies that the `X-API-Secret` request header matches it exactly.
  * Rejects public execution attempts with a strict `403 Forbidden` response.

#### [MODIFY] [analysis_response.py](file:///d:/WebProjects%20AI/backend/app/schemas/analysis_response.py)
* Strengthens `FindingItem` and `AnalysisRequest` schemas with Pydantic field validators:
  * Port range validation (between 1 and 65535).
  * Score range validation (between 0.0 and 100.0).
  * Strict string length boundaries (prevent massive payload buffer injection).
  * Predefined severity enums ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'UNKNOWN').

---

### Component 3: Core App Setup & Middleware

#### [MODIFY] [main.py](file:///d:/WebProjects%20AI/backend/app/main.py)
* Initializes `logging_config` on startup.
* Configures global exception handler for:
  * `RequestValidationError` -> Returns `400 Bad Request` with a generic message (doesn't expose internal validation stack or field paths).
  * `HTTPException` with code 429 -> Returns exactly `{"error": "Rate limit exceeded."}`.
  * Generic `Exception` -> Returns `500 Internal Server Error` with `{"error": "An internal server error occurred."}` and logs the full traceback internally.
* Inspects `ALLOWED_ORIGINS` from the environment. Adds `CORSMiddleware` supporting wildcard matches for Hugging Face subdomains (`*.hf.space`) and `localhost`.
* Detects presence/absence of `GEMINI_API_KEY` on startup, logging a warning if not present, and toggling fallback state in the Gemini service layer gracefully.
* Implements a payload size limiter middleware blocking requests exceeding 1MB.
* Mounts the static directory `/app/static` at `/` to serve the React single page application (SPA) directly from the FastAPI server, facilitating single-port (7860) Hugging Face Spaces deployment.

---

### Component 4: Deployment & Environment

#### [NEW] [Dockerfile](file:///d:/WebProjects%20AI/backend/Dockerfile)
* A multi-stage Docker build:
  * **Stage 1 (Frontend Builder):** Installs frontend dependencies, runs `npm run build`, outputting to `frontend/dist`.
  * **Stage 2 (Final Backend):** Sets up python environment, installs `backend/requirements.txt`, copies backend source code, and copies built static files from Stage 1 into `backend/app/static`.
  * Exposes port `7860` (Hugging Face default).
  * Defines the startup command: `uvicorn app.main:app --host 0.0.0.0 --port 7860`.

#### [MODIFY] [requirements.txt](file:///d:/WebProjects%20AI/backend/requirements.txt)
* Declares standard FastAPI server packages and other libraries:
  `fastapi>=0.100.0`, `uvicorn>=0.22.0`, `psutil>=5.9.0`, `google-generativeai>=0.3.0`, `python-dotenv>=1.0.0`.

#### [MODIFY] [.env.example](file:///d:/WebProjects%20AI/backend/.env.example)
* Updated to include the new required environment variables:
  ```env
  GEMINI_API_KEY=
  GEMINI_MODEL=gemini-2.5-flash
  API_SECRET=
  ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
  RATE_LIMIT=true
  ```

#### [NEW] [.gitignore](file:///d:/WebProjects%20AI/backend/.gitignore)
* Ignores private files:
  ```
  .env
  .env.*
  *.key
  *.pem
  __pycache__/
  venv/
  logs/
  .cache/
  static/
  ```

#### [NEW] [.gitignore](file:///d:/WebProjects%20AI/.gitignore)
* Generates a root `.gitignore` ensuring that venvs, node_modules, and keys are not committed.

---

## Open Questions

> [!IMPORTANT]
> **1. CORS Hugging Face domain suffix wildcarding**
> Standard FastAPI `CORSMiddleware` does not support regex or wildcard patterns like `*.hf.space` natively via `allow_origins`. If the user accesses the page directly from Hugging Face Spaces, it will be served under the same origin, so CORS is not violated (relative calls go to `/api/...` on the same host).
> *Proposed Solution:* Since the frontend is served statically by the backend under the same port/domain, we do not need cross-origin requests in production. `ALLOWED_ORIGINS` will be used to whitelist local testing environments. Is this acceptable?
>
> **2. Admin X-API-Secret vs Local-only**
> For remediation execution, do you want us to allow remote admin executions if the `X-API-Secret` matches, or should we *strictly* block it to loopback `127.0.0.1` regardless of the header?
> *Proposed Solution:* We will enforce BOTH: the request client IP must be loopback (`127.0.0.1`, `::1`) AND, if `API_SECRET` is configured in the environment, the `X-API-Secret` header must match. This guarantees that even if a local process is compromised or exposed, the secret adds a secondary authorization layer.

## Verification Plan

### Automated Tests
* We will verify startup validation by executing uvicorn:
  `python -m uvicorn app.main:app --port 8000`
* We will create a local python test script `test_security.py` that checks rate limiting (sending 6 requests to scan and 21 to analyze to verify 429), input validation (sending negative ports or strings to verify 400), and exception handling.

### Manual Verification
* Accessing `http://localhost:8000/` and verifying standard online response.
* Building the Docker image locally to confirm success:
  `docker build -t vulnsentry-ai -f backend/Dockerfile .`
