from datetime import datetime
from app.models.user_state import (
    MAX_COLLECTION_SIZE,
    PlaybackHistoryEntry,
    PreferenceValue,
    Preferences,
    UserState,
)
from app.repositories.json_user_state_repository import JsonUserStateRepository


class UserStateService:
    def __init__(self, repository: JsonUserStateRepository) -> None:
        self._repository = repository

    async def get_state(self, device_id: str) -> UserState:
        return await self._repository.get_or_create(device_id)

    async def add_favorite(self, device_id: str, track_id: str) -> UserState:
        def add_track(state: UserState) -> UserState:
            favorites = state.favorites if track_id in state.favorites else [*state.favorites, track_id]
            return state.model_copy(update={"favorites": favorites})

        return await self._repository.update(device_id, add_track)

    async def remove_favorite(self, device_id: str, track_id: str) -> UserState:
        def remove_track(state: UserState) -> UserState:
            favorites = [item for item in state.favorites if item != track_id]
            return state.model_copy(update={"favorites": favorites})

        return await self._repository.update(device_id, remove_track)

    async def replace_later(self, device_id: str, track_ids: list[str]) -> UserState:
        later = list(dict.fromkeys(track_ids))
        return await self._repository.update(
            device_id,
            lambda state: state.model_copy(update={"later": later}),
        )

    async def record_playback_start(
        self,
        device_id: str,
        track_id: str,
        started_at: datetime,
    ) -> UserState:
        entry = PlaybackHistoryEntry(track_id=track_id, started_at=started_at)
        return await self._repository.update(
            device_id,
            lambda state: state.model_copy(
                update={"playback_history": [entry, *state.playback_history][:MAX_COLLECTION_SIZE]}
            ),
        )

    async def replace_preferences(
        self,
        device_id: str,
        theme: str,
        display_options: dict[str, PreferenceValue],
        music_tags: list[str],
    ) -> UserState:
        preferences = Preferences(
            theme=theme,
            display_options=display_options,
            music_tags=music_tags,
        )
        return await self._repository.update(
            device_id,
            lambda state: state.model_copy(update={"preferences": preferences}),
        )
