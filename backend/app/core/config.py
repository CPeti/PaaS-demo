from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    FRONTEND_URL: str = ""  # e.g. https://frontend.up.railway.app

    # MinIO / S3-compatible object storage
    MINIO_ENDPOINT: str = "http://localhost:9000"       # internal (ops)
    MINIO_PUBLIC_ENDPOINT: str = ""                     # external (presign); defaults to MINIO_ENDPOINT
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "photos"

    @property
    def minio_public_endpoint(self) -> str:
        """Return MINIO_PUBLIC_ENDPOINT if set, otherwise fall back to MINIO_ENDPOINT."""
        return self.MINIO_PUBLIC_ENDPOINT or self.MINIO_ENDPOINT


settings = Settings()
