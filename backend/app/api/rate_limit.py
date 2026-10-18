import asyncio
import time
from collections import OrderedDict

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

RATE_WINDOW_SECONDS = 60.0
MAX_CLIENT_BUCKETS = 4_096


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp, max_requests: int) -> None:
        self._app = app
        self._max_requests = max_requests
        self._buckets: OrderedDict[str, tuple[float, int]] = OrderedDict()
        self._lock = asyncio.Lock()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if not self._should_limit(scope):
            await self._app(scope, receive, send)
            return
        if await self._is_exhausted(self._get_client_key(scope)):
            response = JSONResponse(status_code=429, content={"detail": "Too many requests"})
            await response(scope, receive, send)
            return
        await self._app(scope, receive, send)

    @staticmethod
    def _should_limit(scope: Scope) -> bool:
        return (
            scope["type"] == "http"
            and str(scope.get("path", "")).startswith("/api/v1/")
            and scope.get("method") != "OPTIONS"
        )

    @staticmethod
    def _get_client_key(scope: Scope) -> str:
        headers = dict(scope.get("headers", []))
        forwarded = headers.get(b"x-forwarded-for", b"").decode("ascii", errors="ignore")
        if forwarded:
            return forwarded.split(",", maxsplit=1)[0].strip()
        client = scope.get("client")
        return str(client[0]) if client else "unknown"

    async def _is_exhausted(self, client_key: str) -> bool:
        now = time.monotonic()
        async with self._lock:
            started_at, count = self._buckets.pop(client_key, (now, 0))
            if now - started_at >= RATE_WINDOW_SECONDS:
                started_at, count = now, 0
            count += 1
            self._buckets[client_key] = (started_at, count)
            while len(self._buckets) > MAX_CLIENT_BUCKETS:
                self._buckets.popitem(last=False)
            return count > self._max_requests
