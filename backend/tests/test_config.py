from pathlib import Path

import pytest

from app.config import DEFAULT_ALLOWED_ORIGINS, Settings


def test_uses_safe_local_defaults_when_environment_is_empty() -> None:
    settings = Settings.from_environment({})

    assert settings.data_directory == Path("data/users")
    assert settings.allowed_origins == DEFAULT_ALLOWED_ORIGINS
    assert settings.max_user_files == 10_000
    assert settings.max_request_body_bytes == 65_536
    assert settings.max_requests_per_minute == 120


def test_parses_configured_data_directory_and_origins() -> None:
    settings = Settings.from_environment(
        {
            "RNB_DATA_DIRECTORY": "/var/lib/rnb-fireplace-radar/users",
            "RNB_ALLOWED_ORIGINS": "http://localhost:3000, http://localhost:3001",
            "RNB_MAX_USER_FILES": "250",
            "RNB_MAX_REQUEST_BODY_BYTES": "32768",
            "RNB_MAX_REQUESTS_PER_MINUTE": "75",
        }
    )

    assert settings.data_directory == Path("/var/lib/rnb-fireplace-radar/users")
    assert settings.allowed_origins == ("http://localhost:3000", "http://localhost:3001")
    assert settings.max_user_files == 250
    assert settings.max_request_body_bytes == 32_768
    assert settings.max_requests_per_minute == 75


def test_rejects_empty_origin_configuration() -> None:
    with pytest.raises(ValueError, match="at least one origin"):
        Settings.from_environment({"RNB_ALLOWED_ORIGINS": " , "})


@pytest.mark.parametrize(
    "name",
    ["RNB_MAX_USER_FILES", "RNB_MAX_REQUEST_BODY_BYTES", "RNB_MAX_REQUESTS_PER_MINUTE"],
)
def test_rejects_non_positive_resource_limit(name: str) -> None:
    with pytest.raises(ValueError, match=name):
        Settings.from_environment({name: "0"})
