from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Callable

from app.models.user_state import UserState

LOCK_STRIPE_COUNT = 64


class UserStorageCapacityError(RuntimeError):
    pass


class JsonUserStateRepository:
    def __init__(self, user_directory: Path, max_user_files: int = 10_000) -> None:
        self._user_directory = user_directory
        self._max_user_files = max_user_files
        self._locks = tuple(asyncio.Lock() for _ in range(LOCK_STRIPE_COUNT))
        self._creation_lock = asyncio.Lock()

    async def get_or_create(self, device_id: str) -> UserState:
        async with self._get_lock(device_id):
            path = self._get_state_path(device_id)
            if path.is_file():
                return UserState.model_validate_json(path.read_text(encoding="utf-8"))
            state = UserState.default()
            await self._write_new_state(path, state)
            return state

    async def save(self, device_id: str, state: UserState) -> UserState:
        async with self._get_lock(device_id):
            validated_state = UserState.model_validate(state.model_dump())
            path = self._get_state_path(device_id)
            if path.is_file():
                self._write_state(path, validated_state)
            else:
                await self._write_new_state(path, validated_state)
            return validated_state

    async def update(
        self,
        device_id: str,
        transition: Callable[[UserState], UserState],
    ) -> UserState:
        async with self._get_lock(device_id):
            path = self._get_state_path(device_id)
            current_state = self._read_state(path) if path.is_file() else UserState.default()
            next_state = UserState.model_validate(transition(current_state).model_dump())
            if path.is_file():
                self._write_state(path, next_state)
            else:
                await self._write_new_state(path, next_state)
            return next_state

    async def _write_new_state(self, path: Path, state: UserState) -> None:
        async with self._creation_lock:
            if path.is_file():
                self._write_state(path, state)
                return
            self._user_directory.mkdir(parents=True, exist_ok=True)
            if sum(1 for _ in self._user_directory.glob("*.json")) >= self._max_user_files:
                raise UserStorageCapacityError("user storage capacity reached")
            self._write_state(path, state)

    def _get_lock(self, device_id: str) -> asyncio.Lock:
        return self._locks[hash(device_id) % LOCK_STRIPE_COUNT]

    def _get_state_path(self, device_id: str) -> Path:
        return self._user_directory / f"{device_id}.json"

    def _read_state(self, path: Path) -> UserState:
        return UserState.model_validate_json(path.read_text(encoding="utf-8"))

    def _write_state(self, path: Path, state: UserState) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = self._write_temporary_file(path, state)
        try:
            temporary_path.replace(path)
            self._sync_directory(path.parent)
        finally:
            temporary_path.unlink(missing_ok=True)

    def _write_temporary_file(self, path: Path, state: UserState) -> Path:
        with NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=path.parent,
            prefix=f"{path.stem}-", suffix=".tmp", delete=False,
        ) as temporary_file:
            json.dump(state.model_dump(mode="json"), temporary_file, ensure_ascii=False)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
            return Path(temporary_file.name)

    @staticmethod
    def _sync_directory(directory: Path) -> None:
        if not hasattr(os, "O_DIRECTORY"):
            return
        descriptor = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
