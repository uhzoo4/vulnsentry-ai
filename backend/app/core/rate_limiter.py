import time
import logging
from collections import defaultdict
from fastapi import HTTPException, Request
from app.core.config import settings

logger = logging.getLogger("vulnsentry.rate_limiter")

class InMemoryRateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        if not settings.RATE_LIMIT:
            return True
        now = time.time()
        # Clean older requests outside the sliding window
        self.history[client_ip] = [t for t in self.history[client_ip] if now - t < self.window_seconds]
        if len(self.history[client_ip]) >= self.requests_limit:
            return False
        self.history[client_ip].append(now)
        return True

# Scan API: 3 requests per minute
scan_limiter = InMemoryRateLimiter(requests_limit=3, window_seconds=60)
# AI Analysis API: 15 requests per minute
ai_limiter = InMemoryRateLimiter(requests_limit=15, window_seconds=60)

def rate_limit_scan(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not scan_limiter.is_allowed(client_ip):
        logger.warning("WARNING Rate limit exceeded.")
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")

def rate_limit_ai(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not ai_limiter.is_allowed(client_ip):
        logger.warning("WARNING Rate limit exceeded.")
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
