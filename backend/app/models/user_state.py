from __future__ import annotations

from datetime import datetime
from typing import TypeAlias
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_TRACK_ID_LENGTH = 128
MAX_COLLECTION_SIZE = 500
MAX_THEME_LENGTH = 64
MAX_MUSIC_TAGS = 32
MAX_MUSIC_TAG_LENGTH = 64
MAX_DISPLAY_OPTIONS = 32
MAX_DISPLAY_KEY_LENGTH = 64
MAX_DISPLAY_STRING_LENGTH = 256
PreferenceValue: TypeAlias = bool | int | float | str | None


class DeviceId(BaseModel):
    value: str

    @field_validator("value")
    @classmethod
    def validate_uuid(cls, value: str) -> str:
        UUID(value)
        return value


class TrackId(BaseModel):
    value: str = Field(min_length=1, max_length=MAX_TRACK_ID_LENGTH)

    @field_validator("value")
    @classmethod
    def reject_blank_value(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("track ID must not be blank")
        return value


def to_camel_case(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel_case, populate_by_name=True)


class Preferences(ApiModel):
    theme: str = Field(default="default", min_length=1, max_length=MAX_THEME_LENGTH)
    display_options: dict[str, PreferenceValue] = Field(
        default_factory=dict,
        max_length=MAX_DISPLAY_OPTIONS,
    )
    music_tags: list[str] = Field(default_factory=list, max_length=MAX_MUSIC_TAGS)

    @field_validator("display_options")
    @classmethod
    def validate_display_options(
        cls,
        display_options: dict[str, PreferenceValue],
    ) -> dict[str, PreferenceValue]:
        for key, value in display_options.items():
            if not key.strip() or len(key) > MAX_DISPLAY_KEY_LENGTH:
                raise ValueError("display option keys must be non-blank and within the limit")
            if isinstance(value, str) and len(value) > MAX_DISPLAY_STRING_LENGTH:
                raise ValueError("display option strings must be within the limit")
        return display_options

    @field_validator("music_tags")
    @classmethod
    def validate_music_tags(cls, music_tags: list[str]) -> list[str]:
        validated = []
        for music_tag in music_tags:
            if not music_tag.strip() or len(music_tag) > MAX_MUSIC_TAG_LENGTH:
                raise ValueError("music tags must be non-blank and within the limit")
            if music_tag not in validated:
                validated.append(music_tag)
        return validated


class PlaybackHistoryEntry(ApiModel):
    track_id: str = Field(min_length=1, max_length=MAX_TRACK_ID_LENGTH)
    started_at: datetime

    @field_validator("track_id")
    @classmethod
    def validate_track_id(cls, track_id: str) -> str:
        return TrackId(value=track_id).value


class UserState(ApiModel):
    favorites: list[str] = Field(default_factory=list, max_length=MAX_COLLECTION_SIZE)
    later: list[str] = Field(default_factory=list, max_length=MAX_COLLECTION_SIZE)
    playback_history: list[PlaybackHistoryEntry] = Field(
        default_factory=list,
        max_length=MAX_COLLECTION_SIZE,
    )
    preferences: Preferences = Field(default_factory=Preferences)

    @field_validator("favorites", "later")
    @classmethod
    def validate_track_ids(cls, track_ids: list[str]) -> list[str]:
        return [TrackId(value=track_id).value for track_id in track_ids]

    @classmethod
    def default(cls) -> "UserState":
        return cls()


class LaterRequest(ApiModel):
    track_ids: list[str] = Field(max_length=MAX_COLLECTION_SIZE)

    @field_validator("track_ids")
    @classmethod
    def validate_track_ids(cls, track_ids: list[str]) -> list[str]:
        return [TrackId(value=track_id).value for track_id in track_ids]


class PlaybackStartRequest(ApiModel):
    track_id: str

    @field_validator("track_id")
    @classmethod
    def validate_track_id(cls, track_id: str) -> str:
        return TrackId(value=track_id).value


class PreferencesRequest(Preferences):
    pass
