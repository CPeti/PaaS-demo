import uuid

import boto3
from botocore.config import Config

from app.core.config import settings


def get_s3_client():
    """Return a boto3 S3 client pointed at MinIO (or any S3-compatible store)."""
    return boto3.client(
        "s3",
        endpoint_url=settings.MINIO_ENDPOINT,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",  # required by boto3 even for MinIO
    )


def build_key(user_id: uuid.UUID, filename: str) -> str:
    """Generate a unique, collision-free object key."""
    return f"{user_id}/{uuid.uuid4()}/{filename}"


def upload_file(file_bytes: bytes, key: str, content_type: str) -> None:
    """Upload raw bytes to the photos bucket."""
    s3 = get_s3_client()
    s3.put_object(
        Bucket=settings.MINIO_BUCKET,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )


def delete_file(key: str) -> None:
    """Delete an object from the photos bucket."""
    s3 = get_s3_client()
    s3.delete_object(Bucket=settings.MINIO_BUCKET, Key=key)


def get_presigned_url(key: str, expires: int = 3600) -> str:
    """Return a pre-signed GET URL valid for `expires` seconds."""
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.MINIO_BUCKET, "Key": key},
        ExpiresIn=expires,
    )
