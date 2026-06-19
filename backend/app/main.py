from fastapi import FastAPI
from app.api.live import router as live_router
from app.api.scan import router as scan_router
from app.api.analysics import router as findings_router
from app.api.remediation import router as remediation_router

app = FastAPI(
    title="VulnSentry AI",
    version="0.1.0"
)

app.include_router(
    live_router,
    prefix="/api"
)

app.include_router(
    scan_router,
    prefix="/api"
)

app.include_router(
    findings_router,
    prefix="/api"
)

app.include_router(
    remediation_router,
    prefix="/api"
)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "VulnSentry AI",
        "message": "Your Machine's Immune System"
    }