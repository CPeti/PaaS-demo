import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.photo_orm import Photo


async def create_photo(
    db: AsyncSession,
    user_id: uuid.UUID,
    key: str,
    filename: str,
    size: int,
    mime_type: str,
) -> Photo:
    photo = Photo(
        user_id=user_id,
        key=key,
        filename=filename,
        size=size,
        mime_type=mime_type,
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return photo


async def list_photos(db: AsyncSession, user_id: uuid.UUID) -> list[Photo]:
    result = await db.execute(
        select(Photo)
        .where(Photo.user_id == user_id)
        .order_by(Photo.created_at.desc())
    )
    return list(result.scalars().all())


async def get_photo(
    db: AsyncSession, photo_id: uuid.UUID, user_id: uuid.UUID
) -> Photo | None:
    result = await db.execute(
        select(Photo).where(Photo.id == photo_id, Photo.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def delete_photo(
    db: AsyncSession, photo_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    """Delete photo row; returns True if a row was deleted, False if not found."""
    result = await db.execute(
        delete(Photo)
        .where(Photo.id == photo_id, Photo.user_id == user_id)
        .returning(Photo.id)
    )
    await db.commit()
    return result.scalar_one_or_none() is not None
