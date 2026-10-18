from collections.abc import Awaitable, Callable

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send


class RequestBodyLimitMiddleware:
    def __init__(self, app: ASGIApp, max_body_bytes: int) -> None:
        self._app = app
        self._max_body_bytes = max_body_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return
        if self._declared_size(scope) > self._max_body_bytes:
            await self._reject(scope, receive, send)
            return
        body = await self._read_body(receive)
        if body is None:
            await self._reject(scope, receive, send)
            return
        await self._app(scope, self._create_receive(body), send)

    def _declared_size(self, scope: Scope) -> int:
        headers = dict(scope.get("headers", []))
        try:
            return int(headers.get(b"content-length", b"0"))
        except ValueError:
            return self._max_body_bytes + 1

    async def _read_body(self, receive: Receive) -> bytes | None:
        chunks: list[bytes] = []
        size = 0
        while True:
            message = await receive()
            chunk = message.get("body", b"")
            size += len(chunk)
            if size > self._max_body_bytes:
                return None
            chunks.append(chunk)
            if not message.get("more_body", False):
                return b"".join(chunks)

    @staticmethod
    def _create_receive(body: bytes) -> Callable[[], Awaitable[Message]]:
        delivered = False

        async def receive() -> Message:
            nonlocal delivered
            if delivered:
                return {"type": "http.request", "body": b"", "more_body": False}
            delivered = True
            return {"type": "http.request", "body": body, "more_body": False}

        return receive

    @staticmethod
    async def _reject(scope: Scope, receive: Receive, send: Send) -> None:
        response = JSONResponse(
            status_code=413,
            content={"detail": "Request body is too large"},
        )
        await response(scope, receive, send)
