from fastapi import FastAPI
from app.api.live import router as live_router

app = FastAPI(
    title="VulnSentry AI",
    version="0.1.0"
)

app.include_router(
    live_router,
    prefix="/api"
)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "VulnSentry AI",
        "message": "Your Machine's Immune System"
    }