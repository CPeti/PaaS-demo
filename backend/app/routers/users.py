from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import get_all_users
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user_orm import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/", response_model=list[UserRead])
async def read_all_users(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[UserRead]:
    users = await get_all_users(db)
    return [UserRead.model_validate(u) for u in users]
