import uuid

import boto3
from botocore.config import Config

from app.core.config import settings


def _make_client(endpoint_url: str):
    """Create a boto3 S3 client for the given endpoint."""
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",  # required by boto3 even for MinIO
    )


def _ops_client():
    """Client for upload/delete — uses internal Docker endpoint."""
    return _make_client(settings.MINIO_ENDPOINT)


def _presign_client():
    """Client for presigning — uses public endpoint so browser URLs resolve.

    Presigned URL generation is pure local HMAC math; no network call is made
    to the public endpoint from inside the container.
    """
    return _make_client(settings.minio_public_endpoint)


def build_key(user_id: uuid.UUID, filename: str) -> str:
    """Generate a unique, collision-free object key."""
    return f"{user_id}/{uuid.uuid4()}/{filename}"


def upload_file(file_bytes: bytes, key: str, content_type: str) -> None:
    """Upload raw bytes to the photos bucket (via internal endpoint)."""
    _ops_client().put_object(
        Bucket=settings.MINIO_BUCKET,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )


def delete_file(key: str) -> None:
    """Delete an object from the photos bucket (via internal endpoint)."""
    _ops_client().delete_object(Bucket=settings.MINIO_BUCKET, Key=key)


def get_presigned_url(key: str, expires: int = 3600) -> str:
    """Return a pre-signed GET URL valid for `expires` seconds.

    Uses the public endpoint so the URL is resolvable by the browser,
    not the internal Docker service name.
    """
    return _presign_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.MINIO_BUCKET, "Key": key},
        ExpiresIn=expires,
    )
