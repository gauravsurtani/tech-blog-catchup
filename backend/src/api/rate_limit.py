"""Rate limiter singleton for the API."""

from fastapi import Request
from slowapi import Limiter


def get_real_client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For behind Railway/proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


limiter = Limiter(key_func=get_real_client_ip)
