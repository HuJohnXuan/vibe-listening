from pydantic import ValidationError
import pytest

from app.models.user_state import DeviceId, Preferences, TrackId, UserState


def test_accepts_uuid_device_id() -> None:
    device_id = DeviceId(value="2f1d9e13-dde1-4c41-bf2a-3e927b0734f4")

    assert device_id.value == "2f1d9e13-dde1-4c41-bf2a-3e927b0734f4"


@pytest.mark.parametrize("value", ["", "not-a-uuid", "2f1d9e13-dde1-4c41-bf2a"])
def test_rejects_invalid_device_id(value: str) -> None:
    with pytest.raises(ValidationError):
        DeviceId(value=value)


def test_rejects_blank_track_id() -> None:
    with pytest.raises(ValidationError):
        TrackId(value="   ")


def test_creates_default_user_state() -> None:
    user_state = UserState.default()

    assert user_state.favorites == []
    assert user_state.later == []
    assert user_state.playback_history == []
    assert user_state.preferences == Preferences()


@pytest.mark.parametrize(
    "display_options",
    [
        {"nested": {"value": True}},
        {"label": "x" * 257},
        {f"option-{index}": True for index in range(33)},
    ],
)
def test_rejects_oversized_or_nested_display_options(display_options: object) -> None:
    with pytest.raises(ValidationError):
        Preferences(display_options=display_options)


def test_rejects_oversized_theme_and_music_tags() -> None:
    with pytest.raises(ValidationError):
        Preferences(theme="x" * 65)

    with pytest.raises(ValidationError):
        Preferences(music_tags=["x" * 65])
