import uuid
from datetime import datetime

from pydantic import BaseModel


class PhotoRead(BaseModel):
    id: uuid.UUID
    filename: str
    size: int
    mime_type: str
    created_at: datetime
    url: str  # presigned URL injected at response time
    thumbnail_url: str

    model_config = {"from_attributes": True}

class PhotoUpdate(BaseModel):
    filename: str | None = None


class UploadRequest(BaseModel):
    filename: str
    content_type: str
    size: int


class UploadResponse(BaseModel):
    key: str
    url: str
    thumbnail_url: str


class ConfirmRequest(BaseModel):
    key: str
    filename: str
    content_type: str
    size: int
