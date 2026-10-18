from pathlib import Path

import pytest

from app.models.user_state import UserState
from pydantic import ValidationError
from app.repositories.json_user_state_repository import (
    JsonUserStateRepository,
    UserStorageCapacityError,
)


DEVICE_A = "2f1d9e13-dde1-4c41-bf2a-3e927b0734f4"
DEVICE_B = "0f66564f-2a53-43f6-a5bb-4f815c58ccd7"


@pytest.mark.asyncio
async def test_creates_and_persists_default_state_per_device(tmp_path: Path) -> None:
    repository = JsonUserStateRepository(tmp_path / "users")

    state = await repository.get_or_create(DEVICE_A)

    assert state == UserState.default()
    assert (tmp_path / "users" / f"{DEVICE_A}.json").is_file()


@pytest.mark.asyncio
async def test_keeps_user_documents_isolated(tmp_path: Path) -> None:
    repository = JsonUserStateRepository(tmp_path / "users")
    first_state = UserState(favorites=["ember-after-midnight"])

    await repository.save(DEVICE_A, first_state)
    second_state = await repository.get_or_create(DEVICE_B)

    assert await repository.get_or_create(DEVICE_A) == first_state
    assert second_state == UserState.default()


@pytest.mark.asyncio
async def test_replaces_existing_state_atomically(tmp_path: Path) -> None:
    repository = JsonUserStateRepository(tmp_path / "users")
    next_state = UserState(later=["slow-bloom"])

    await repository.get_or_create(DEVICE_A)
    await repository.save(DEVICE_A, next_state)

    assert await repository.get_or_create(DEVICE_A) == next_state
    assert not list((tmp_path / "users").glob("*.tmp"))


@pytest.mark.asyncio
async def test_rejected_update_leaves_existing_state_unchanged(tmp_path: Path) -> None:
    repository = JsonUserStateRepository(tmp_path / "users")
    original_state = UserState(favorites=["slow-bloom"])
    await repository.save(DEVICE_A, original_state)

    with pytest.raises(ValidationError):
        await repository.update(
            DEVICE_A,
            lambda state: state.model_copy(update={"favorites": [""]}),
        )

    assert await repository.get_or_create(DEVICE_A) == original_state


@pytest.mark.asyncio
async def test_rejects_new_user_when_storage_capacity_is_reached(tmp_path: Path) -> None:
    repository = JsonUserStateRepository(tmp_path / "users", max_user_files=1)
    await repository.save(DEVICE_A, UserState.default())

    with pytest.raises(UserStorageCapacityError):
        await repository.save(DEVICE_B, UserState.default())

    assert await repository.get_or_create(DEVICE_A) == UserState.default()
    assert not (tmp_path / "users" / f"{DEVICE_B}.json").exists()
