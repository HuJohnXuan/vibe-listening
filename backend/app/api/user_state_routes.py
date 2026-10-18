from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.api.dependencies import get_device_id, get_track_id
from app.models.user_state import LaterRequest, PlaybackStartRequest, PreferencesRequest, UserState
from app.services.user_state_service import UserStateService


def create_user_state_router(service: UserStateService) -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.get("/user-state", response_model=UserState)
    async def get_user_state(device_id: str = Depends(get_device_id)) -> UserState:
        return await service.get_state(device_id)

    @router.put("/favorites/{track_id}", response_model=UserState)
    async def add_favorite(
        track_id: str = Depends(get_track_id),
        device_id: str = Depends(get_device_id),
    ) -> UserState:
        return await service.add_favorite(device_id, track_id)

    @router.delete("/favorites/{track_id}", response_model=UserState)
    async def remove_favorite(
        track_id: str = Depends(get_track_id),
        device_id: str = Depends(get_device_id),
    ) -> UserState:
        return await service.remove_favorite(device_id, track_id)

    @router.put("/later", response_model=UserState)
    async def replace_later(request: LaterRequest, device_id: str = Depends(get_device_id)) -> UserState:
        return await service.replace_later(device_id, request.track_ids)

    add_history_route(router, service)
    add_preferences_route(router, service)
    return router


def add_history_route(router: APIRouter, service: UserStateService) -> None:
    @router.post("/playback-history", response_model=UserState)
    async def record_playback_start(
        request: PlaybackStartRequest,
        device_id: str = Depends(get_device_id),
    ) -> UserState:
        return await service.record_playback_start(device_id, request.track_id, datetime.now(timezone.utc))


def add_preferences_route(router: APIRouter, service: UserStateService) -> None:
    @router.put("/preferences", response_model=UserState)
    async def replace_preferences(
        request: PreferencesRequest,
        device_id: str = Depends(get_device_id),
    ) -> UserState:
        return await service.replace_preferences(
            device_id, request.theme, request.display_options, request.music_tags
        )
