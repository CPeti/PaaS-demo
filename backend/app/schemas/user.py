import uuid

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long.")


class UserRead(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    is_active: bool

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None
