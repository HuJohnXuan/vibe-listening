from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping

DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:3000",
    "http://localhost:3001",
)
DEFAULT_MAX_USER_FILES = 10_000
DEFAULT_MAX_REQUEST_BODY_BYTES = 65_536
DEFAULT_MAX_REQUESTS_PER_MINUTE = 120


@dataclass(frozen=True)
class Settings:
    data_directory: Path
    allowed_origins: tuple[str, ...]
    max_user_files: int = DEFAULT_MAX_USER_FILES
    max_request_body_bytes: int = DEFAULT_MAX_REQUEST_BODY_BYTES
    max_requests_per_minute: int = DEFAULT_MAX_REQUESTS_PER_MINUTE

    @classmethod
    def from_environment(cls, environment: Mapping[str, str] | None = None) -> "Settings":
        values = os.environ if environment is None else environment
        data_directory = Path(values.get("RNB_DATA_DIRECTORY", "data/users"))
        origins_value = values.get("RNB_ALLOWED_ORIGINS", ",".join(DEFAULT_ALLOWED_ORIGINS))
        allowed_origins = tuple(origin.strip() for origin in origins_value.split(",") if origin.strip())
        if not allowed_origins:
            raise ValueError("RNB_ALLOWED_ORIGINS must contain at least one origin")
        max_user_files = cls._read_positive_int(values, "RNB_MAX_USER_FILES", DEFAULT_MAX_USER_FILES)
        max_body_bytes = cls._read_positive_int(
            values, "RNB_MAX_REQUEST_BODY_BYTES", DEFAULT_MAX_REQUEST_BODY_BYTES
        )
        max_requests = cls._read_positive_int(
            values, "RNB_MAX_REQUESTS_PER_MINUTE", DEFAULT_MAX_REQUESTS_PER_MINUTE
        )
        return cls(data_directory, allowed_origins, max_user_files, max_body_bytes, max_requests)

    @staticmethod
    def _read_positive_int(values: Mapping[str, str], name: str, default: int) -> int:
        try:
            value = int(values.get(name, str(default)))
        except ValueError as error:
            raise ValueError(f"{name} must be a positive integer") from error
        if value <= 0:
            raise ValueError(f"{name} must be a positive integer")
        return value
