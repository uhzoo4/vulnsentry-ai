from fastapi import APIRouter
from app.core.monitor import get_connections

router = APIRouter()


@router.get("/live")
def live_connections():
    return get_connections()