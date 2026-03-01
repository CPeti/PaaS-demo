import io
import uuid
import cv2
import tempfile
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.crud import photo as photo_crud
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user_orm import User
from app.schemas.photo import PhotoRead, PhotoUpdate

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


@router.post("", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: Annotated[UploadFile, File(description="Image file (max 10 MB)")],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PhotoRead:
    # Validate content type
    if not file.content_type or not (
        file.content_type.startswith("image/") or file.content_type.startswith("video/")
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only image and video files are accepted",
        )

    # Read and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds limit",
        )

    # Generate thumbnail
    thumb_bytes = None
    thumb_content_type = None
    if file.content_type.startswith("image/"):
        try:
            image = Image.open(io.BytesIO(file_bytes))
            image.thumbnail((400, 400))
            thumb_io = io.BytesIO()
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            image.save(thumb_io, format="JPEG", quality=85)
            thumb_bytes = thumb_io.getvalue()
            thumb_content_type = "image/jpeg"
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image file: {exc}",
            )
    elif file.content_type.startswith("video/"):
        try:
            with tempfile.NamedTemporaryFile(delete=True, suffix=".mp4") as temp_video:
                temp_video.write(file_bytes)
                temp_video.flush()
                
                cap = cv2.VideoCapture(temp_video.name)
                ret, frame = cap.read()
                cap.release()
                
                if ret:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    image = Image.fromarray(frame_rgb)
                    image.thumbnail((400, 400))
                    
                    thumb_io = io.BytesIO()
                    image.save(thumb_io, format="JPEG", quality=85)
                    thumb_bytes = thumb_io.getvalue()
                    thumb_content_type = "image/jpeg"
        except Exception as exc:
            print(f"Failed to generate video thumbnail: {exc}")
            # We don't fail the upload if thumbnail generation fails for a video
            pass

    # Upload to MinIO
    key = storage.build_key(current_user.id, file.filename or "upload")
    thumb_key = key + ".thumb"
    try:
        storage.upload_file(file_bytes, key, file.content_type)
        if thumb_bytes and thumb_content_type:
            storage.upload_file(thumb_bytes, thumb_key, thumb_content_type)
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
    thumb_url = storage.get_presigned_url(thumb_key)
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
