import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.crud import photo as photo_crud
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user_orm import User
from app.schemas.photo import (
    ConfirmRequest,
    PhotoRead,
    PhotoUpdate,
    UploadRequest,
    UploadResponse,
)

router = APIRouter(prefix="/photos", tags=["photos"])

MAX_SIZE = 1000 * 1024 * 1024  # 1000 MB


def _to_read(photo, url: str, thumbnail_url: str) -> PhotoRead:
    return PhotoRead(
        id=photo.id,
        filename=photo.filename,
        size=photo.size,
        mime_type=photo.mime_type,
        created_at=photo.created_at,
        url=url,
        thumbnail_url=thumbnail_url,
    )


@router.post("/upload-url", response_model=UploadResponse)
async def get_upload_url(
    req: UploadRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> UploadResponse:
    if not req.content_type or not (
        req.content_type.startswith("image/") or req.content_type.startswith("video/")
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only image and video files are accepted",
        )

    if req.size > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds limit",
        )

    key = storage.build_key(current_user.id, req.filename)
    thumb_key = key + ".thumb"

    url = storage.get_presigned_put_url(key, req.content_type)
    thumb_url = storage.get_presigned_put_url(thumb_key, "image/jpeg")

    return UploadResponse(key=key, url=url, thumbnail_url=thumb_url)


@router.post("/confirm", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
async def confirm_upload(
    req: ConfirmRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PhotoRead:
    # Persist metadata
    photo = await photo_crud.create_photo(
        db,
        user_id=current_user.id,
        key=req.key,
        filename=req.filename,
        size=req.size,
        mime_type=req.content_type,
    )

    url = storage.get_presigned_url(photo.key)
    thumb_url = storage.get_presigned_url(photo.key + ".thumb")
    return _to_read(photo, url, thumb_url)


@router.get("", response_model=list[PhotoRead])
async def list_photos(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[PhotoRead]:
    photos = await photo_crud.list_photos(db, current_user.id)
    return [
        _to_read(
            p,
            storage.get_presigned_url(p.key),
            storage.get_presigned_url(p.key + ".thumb")
        )
        for p in photos
    ]


@router.patch("/{photo_id}", response_model=PhotoRead)
async def update_photo(
    photo_id: uuid.UUID,
    photo_update: PhotoUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PhotoRead:
    if photo_update.filename is not None:
        photo = await photo_crud.update_photo(
            db, photo_id, current_user.id, photo_update.filename
        )
        if not photo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found"
            )
        
        # We must return the full PhotoRead model which requires presigned URLs.
        url = storage.get_presigned_url(photo.key)
        thumb_url = storage.get_presigned_url(photo.key + ".thumb")
        return _to_read(photo, url, thumb_url)
    
    # If nothing was updated, just fetch and return current
    photo = await photo_crud.get_photo(db, photo_id, current_user.id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found"
        )
    url = storage.get_presigned_url(photo.key)
    thumb_url = storage.get_presigned_url(photo.key + ".thumb")
    return _to_read(photo, url, thumb_url)


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    photo = await photo_crud.get_photo(db, photo_id, current_user.id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    # Delete from object store first, then DB
    try:
        storage.delete_file(photo.key)
        storage.delete_file(photo.key + ".thumb")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Storage delete failed: {exc}",
        )

    await photo_crud.delete_photo(db, photo_id, current_user.id)
