import os
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings, validate_config
from app.core.logging_config import setup_logging

# 1. Initialize logging
setup_logging()
logger = logging.getLogger("vulnsentry.main")

# 2. Validate configuration
validate_config()

from app.api.live import router as live_router
from app.api.scan import router as scan_router
from app.api.analysics import router as analysics_router
from app.api.remediation import router as remediation_router

app = FastAPI(
    title="VulnSentry AI",
    version="0.8.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

@app.on_event("startup")
async def startup():
    logger.info("Application startup complete.")

# 3. CORS Configuration
allowed_origins_str = settings.ALLOWED_ORIGINS
allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Security Headers Middleware
# NOTE: X-Frame-Options is intentionally NOT set to DENY because
# Hugging Face Spaces renders Docker apps inside an iframe.
# DENY would block HF from displaying the Space entirely.
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    return response

# 5. Request Payload Size Limit Middleware (1MB)
MAX_PAYLOAD_SIZE = 1 * 1024 * 1024  # 1 MB

@app.middleware("http")
async def limit_payload_size(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_PAYLOAD_SIZE:
                    return JSONResponse(
                        status_code=400,
                        content={"error": "Payload size limit exceeded."}
                    )
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid Content-Length header."}
                )
    return await call_next(request)

# 6. Global Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation failed for incoming request.")
    return JSONResponse(
        status_code=400,
        content={"error": "Malformed request or validation failed."}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code == 429:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded."}
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("An unhandled exception occurred.")
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred."}
    )

# 7. Include API routers
app.include_router(live_router, prefix="/api")
app.include_router(scan_router, prefix="/api")
app.include_router(analysics_router, prefix="/api")
app.include_router(remediation_router, prefix="/api")

# 8. Health Check Endpoints (explicit, fast, always registered)
@app.get("/api/health")
def health_check():
    ai_status = "online" if settings.AI_ENABLED else "fallback"
    return {
        "backend": "online",
        "scanner": "ready",
        "ai": ai_status
    }

@app.get("/api/version")
def version_check():
    return {
        "version": "0.8.0",
        "build": "hackathon"
    }

# 9. Explicit root route — always returns HTTP 200 JSON
# This is critical for HF health probes and must be registered
# BEFORE the catch-all SPA route below.
@app.get("/")
def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    return FileResponse(index_file)

@app.get("/{fallback_path:path}")
def serve_frontend(fallback_path: str):
    if fallback_path.startswith("api"):
        raise HTTPException(404)

    index_file = os.path.join(static_dir, "index.html")
    return FileResponse(index_file)

# 10. React SPA Static Serving (catch-all LAST)
static_dir = os.path.join(
    os.path.dirname(__file__),
    "static"
)

logger.info(f"MAIN FILE: {__file__}")
logger.info(f"STATIC DIR: {static_dir}")
logger.info(f"STATIC EXISTS: {os.path.exists(static_dir)}")
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{fallback_path:path}")
    def serve_frontend(fallback_path: str):
        # Never intercept API routes
        if fallback_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(
            status_code=404,
            content={"error": "Frontend build files not found."}
        )