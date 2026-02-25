import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.crud import photo as photo_crud
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user_orm import User
from app.schemas.photo import PhotoRead

router = APIRouter(prefix="/photos", tags=["photos"])

MAX_SIZE = 10 * 1024 * 1024  # 10 MB


def _to_read(photo, url: str) -> PhotoRead:
    return PhotoRead(
        id=photo.id,
        filename=photo.filename,
        size=photo.size,
        mime_type=photo.mime_type,
        created_at=photo.created_at,
        url=url,
    )


@router.post("", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: Annotated[UploadFile, File(description="Image file (max 10 MB)")],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PhotoRead:
    # Validate content type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only image files are accepted",
        )

    # Read and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds 10 MB limit",
        )

    # Upload to MinIO
    key = storage.build_key(current_user.id, file.filename or "upload")
    try:
        storage.upload_file(file_bytes, key, file.content_type)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Storage upload failed: {exc}",
        )

    # Persist metadata
    photo = await photo_crud.create_photo(
        db,
        user_id=current_user.id,
        key=key,
        filename=file.filename or "upload",
        size=len(file_bytes),
        mime_type=file.content_type,
    )

    url = storage.get_presigned_url(photo.key)
    return _to_read(photo, url)


@router.get("", response_model=list[PhotoRead])
async def list_photos(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[PhotoRead]:
    photos = await photo_crud.list_photos(db, current_user.id)
    return [_to_read(p, storage.get_presigned_url(p.key)) for p in photos]


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
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Storage delete failed: {exc}",
        )

    await photo_crud.delete_photo(db, photo_id, current_user.id)
