from fastapi import Header, HTTPException

from app.models.user_state import DeviceId, TrackId


async def get_device_id(x_device_id: str | None = Header(default=None)) -> str:
    if x_device_id is None:
        raise HTTPException(status_code=422, detail="X-Device-Id is required")
    try:
        return DeviceId(value=x_device_id).value
    except ValueError as error:
        raise HTTPException(status_code=422, detail="X-Device-Id is invalid") from error


async def get_track_id(track_id: str) -> str:
    try:
        return TrackId(value=track_id).value
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Track ID is invalid") from error
