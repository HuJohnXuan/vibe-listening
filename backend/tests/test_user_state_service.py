from datetime import datetime, timezone
from pathlib import Path

import pytest

from app.repositories.json_user_state_repository import JsonUserStateRepository
from app.models.user_state import MAX_COLLECTION_SIZE
from app.services.user_state_service import UserStateService


DEVICE_ID = "2f1d9e13-dde1-4c41-bf2a-3e927b0734f4"


@pytest.fixture
def service(tmp_path: Path) -> UserStateService:
    return UserStateService(JsonUserStateRepository(tmp_path / "users"))


@pytest.mark.asyncio
async def test_adds_a_favorite_once(service: UserStateService) -> None:
    await service.add_favorite(DEVICE_ID, "ember-after-midnight")
    state = await service.add_favorite(DEVICE_ID, "ember-after-midnight")

    assert state.favorites == ["ember-after-midnight"]


@pytest.mark.asyncio
async def test_replaces_later_in_first_occurrence_order(service: UserStateService) -> None:
    state = await service.replace_later(
        DEVICE_ID,
        ["slow-bloom", "ember-after-midnight", "slow-bloom"],
    )

    assert state.later == ["slow-bloom", "ember-after-midnight"]


@pytest.mark.asyncio
async def test_prepends_each_playback_start(service: UserStateService) -> None:
    first_start = datetime(2026, 8, 1, 8, 0, tzinfo=timezone.utc)
    second_start = datetime(2026, 8, 1, 8, 1, tzinfo=timezone.utc)

    await service.record_playback_start(DEVICE_ID, "slow-bloom", first_start)
    state = await service.record_playback_start(DEVICE_ID, "slow-bloom", second_start)

    assert [entry.started_at for entry in state.playback_history] == [second_start, first_start]


@pytest.mark.asyncio
async def test_keeps_only_newest_playback_entries_at_history_limit(
    service: UserStateService,
) -> None:
    for index in range(MAX_COLLECTION_SIZE + 1):
        await service.record_playback_start(
            DEVICE_ID,
            f"track-{index}",
            datetime(2026, 8, 1, 8, index % 60, tzinfo=timezone.utc),
        )

    state = await service.get_state(DEVICE_ID)

    assert len(state.playback_history) == MAX_COLLECTION_SIZE
    assert state.playback_history[0].track_id == f"track-{MAX_COLLECTION_SIZE}"
    assert state.playback_history[-1].track_id == "track-1"


@pytest.mark.asyncio
async def test_preferences_update_preserves_favorites(service: UserStateService) -> None:
    await service.add_favorite(DEVICE_ID, "ember-after-midnight")
    state = await service.replace_preferences(
        DEVICE_ID,
        theme="night",
        display_options={"showArtwork": True},
        music_tags=["neo-soul"],
    )

    assert state.favorites == ["ember-after-midnight"]
    assert state.preferences.theme == "night"
    assert state.preferences.music_tags == ["neo-soul"]
