import asyncio
import json
from fastapi import APIRouter
from starlette.responses import StreamingResponse
from app.core.monitor import get_connections

router = APIRouter()


@router.get("/live")
def live_connections_snapshot():
    """
    REST endpoint returning a snapshot of current connections.
    """
    return {"connections": get_connections()}


@router.get("/live/connections")
def live_connections_stream():
    """
    SSE endpoint streaming connection updates every 2 seconds.
    """
    async def event_generator():
        while True:
            try:
                conns = get_connections()
                payload = json.dumps({"connections": conns})
                yield f"event: connection_update\ndata: {payload}\n\n"
            except Exception as e:
                yield f"event: error\ndata: {str(e)}\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(event_generator(), media_type="text/event-stream")