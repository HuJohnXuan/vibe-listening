from fastapi.testclient import TestClient
from pathlib import Path

from app.main import create_app


DEVICE_ID = "2f1d9e13-dde1-4c41-bf2a-3e927b0734f4"
LOCAL_ORIGIN = "http://localhost:3000"


def test_reports_health() -> None:
    client = TestClient(create_app(data_directory="test-data"))

    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_creates_empty_state_for_valid_device_id(tmp_path) -> None:
    client = TestClient(create_app(data_directory=tmp_path / "users"))

    response = client.get("/api/v1/user-state", headers={"X-Device-Id": DEVICE_ID})

    assert response.status_code == 200
    assert response.json()["favorites"] == []
    assert response.json()["later"] == []


def test_rejects_missing_device_id(tmp_path) -> None:
    client = TestClient(create_app(data_directory=tmp_path / "users"))

    response = client.get("/api/v1/user-state")

    assert response.status_code == 422


def test_allows_only_approved_cors_origin(tmp_path) -> None:
    client = TestClient(create_app(data_directory=tmp_path / "users"))

    response = client.options(
        "/api/v1/user-state",
        headers={
            "Origin": LOCAL_ORIGIN,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Device-Id",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == LOCAL_ORIGIN


def test_rejects_unapproved_cors_origin(tmp_path) -> None:
    client = TestClient(create_app(data_directory=tmp_path / "users"))

    response = client.options(
        "/api/v1/user-state",
        headers={
            "Origin": "https://unapproved.example",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Device-Id",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_mutates_favorites_and_later_state(tmp_path) -> None:
    client = TestClient(create_app(data_directory=tmp_path / "users"))
    headers = {"X-Device-Id": DEVICE_ID}

    favorite_response = client.put("/api/v1/favorites/ember-after-midnight", headers=headers)
    later_response = client.put(
        "/api/v1/later",
        headers=headers,
        json={"trackIds": ["slow-bloom", "ember-after-midnight", "slow-bloom"]},
    )

    assert favorite_response.status_code == 200
    assert later_response.json()["favorites"] == ["ember-after-midnight"]
    assert later_response.json()["later"] == ["slow-bloom", "ember-after-midnight"]


def test_records_playback_and_replaces_preferences(tmp_path) -> None:
    client = TestClient(create_app(data_directory=tmp_path / "users"))
    headers = {"X-Device-Id": DEVICE_ID}

    history_response = client.post(
        "/api/v1/playback-history",
        headers=headers,
        json={"trackId": "slow-bloom"},
    )
    preferences_response = client.put(
        "/api/v1/preferences",
        headers=headers,
        json={
            "theme": "night",
            "displayOptions": {"showArtwork": True},
            "musicTags": ["neo-soul"],
        },
    )

    assert history_response.status_code == 200
    assert history_response.json()["playbackHistory"][0]["trackId"] == "slow-bloom"
    assert preferences_response.json()["preferences"]["theme"] == "night"


def test_returns_user_safe_validation_error(tmp_path) -> None:
    client = TestClient(create_app(data_directory=tmp_path / "users"))

    response = client.put(
        "/api/v1/later",
        headers={"X-Device-Id": DEVICE_ID},
        json={"trackIds": [""]},
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "Request validation failed"}


def test_returns_user_safe_error_when_storage_fails(tmp_path, monkeypatch) -> None:
    client = TestClient(
        create_app(data_directory=tmp_path / "users"),
        raise_server_exceptions=False,
    )

    def reject_directory_creation(*args, **kwargs) -> None:
        raise OSError("private storage detail")

    monkeypatch.setattr(Path, "mkdir", reject_directory_creation)
    response = client.put(
        "/api/v1/favorites/slow-bloom",
        headers={"X-Device-Id": DEVICE_ID},
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "The service could not complete the request"}
    assert "private storage detail" not in response.text


def test_rejects_request_body_above_configured_limit(tmp_path) -> None:
    client = TestClient(create_app(data_directory=tmp_path / "users"))

    response = client.put(
        "/api/v1/preferences",
        headers={"X-Device-Id": DEVICE_ID},
        content=b"x" * 65_537,
    )

    assert response.status_code == 413
    assert response.json() == {"detail": "Request body is too large"}


def test_returns_capacity_error_without_exposing_storage_details(tmp_path) -> None:
    from app.config import Settings

    settings = Settings(
        data_directory=tmp_path / "users",
        allowed_origins=(LOCAL_ORIGIN,),
        max_user_files=1,
        max_request_body_bytes=65_536,
        max_requests_per_minute=120,
    )
    client = TestClient(create_app(settings=settings))
    client.put("/api/v1/favorites/one", headers={"X-Device-Id": DEVICE_ID})

    response = client.put(
        "/api/v1/favorites/two",
        headers={"X-Device-Id": "0f66564f-2a53-43f6-a5bb-4f815c58ccd7"},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "User storage capacity has been reached"}


def test_rate_limits_user_state_requests_per_client(tmp_path) -> None:
    from app.config import Settings

    settings = Settings(
        data_directory=tmp_path / "users",
        allowed_origins=(LOCAL_ORIGIN,),
        max_user_files=10,
        max_request_body_bytes=65_536,
        max_requests_per_minute=2,
    )
    client = TestClient(create_app(settings=settings))
    headers = {"X-Device-Id": DEVICE_ID, "X-Forwarded-For": "203.0.113.10"}

    assert client.get("/api/v1/user-state", headers=headers).status_code == 200
    assert client.get("/api/v1/user-state", headers=headers).status_code == 200
    response = client.get("/api/v1/user-state", headers=headers)

    assert response.status_code == 429
    assert response.json() == {"detail": "Too many requests"}
