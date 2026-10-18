import logging
from dataclasses import replace
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.user_state_routes import create_user_state_router
from app.api.request_body_limit import RequestBodyLimitMiddleware
from app.api.rate_limit import RateLimitMiddleware
from app.config import Settings
from app.repositories.json_user_state_repository import (
    JsonUserStateRepository,
    UserStorageCapacityError,
)
from app.services.user_state_service import UserStateService

LOGGER = logging.getLogger("rnb_api")


def create_app(
    data_directory: str | Path | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    resolved_settings = settings or Settings.from_environment()
    if data_directory is not None:
        resolved_settings = replace(resolved_settings, data_directory=Path(data_directory))
    app = FastAPI(title="R&B Fireplace Radar API")
    app.add_middleware(
        RequestBodyLimitMiddleware,
        max_body_bytes=resolved_settings.max_request_body_bytes,
    )
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=resolved_settings.max_requests_per_minute,
    )
    configure_cors(app, resolved_settings)
    repository = JsonUserStateRepository(
        resolved_settings.data_directory,
        resolved_settings.max_user_files,
    )
    app.include_router(create_user_state_router(UserStateService(repository)))
    configure_error_handlers(app)

    @app.get("/healthz")
    async def get_health() -> dict[str, str]:
        return {"status": "ok"}

    return app


def configure_cors(app: FastAPI, settings: Settings) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["X-Device-Id", "Content-Type"],
    )


def configure_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(UserStorageCapacityError)
    async def handle_capacity_error(
        request: Request,
        error: UserStorageCapacityError,
    ) -> JSONResponse:
        LOGGER.error(
            "[repository][error] User storage capacity reached | context: %s",
            {"method": request.method, "path": request.url.path},
        )
        return JSONResponse(
            status_code=503,
            content={"detail": "User storage capacity has been reached"},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request,
        error: RequestValidationError,
    ) -> JSONResponse:
        LOGGER.warning(
            "[api][warning] Request validation failed | context: %s",
            {"method": request.method, "path": request.url.path, "errorCount": len(error.errors())},
        )
        return JSONResponse(status_code=422, content={"detail": "Request validation failed"})

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
        LOGGER.exception(
            "[api][error] Unexpected request failure | context: %s",
            {"method": request.method, "path": request.url.path, "errorType": type(error).__name__},
        )
        return JSONResponse(status_code=500, content={"detail": "The service could not complete the request"})


app = create_app()
