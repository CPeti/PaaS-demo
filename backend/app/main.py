from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.routers import auth, users, photos


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Create tables on startup (use Alembic in production instead)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="PaaS Demo API",
    version="0.1.0",
    lifespan=lifespan,
)

_origins = ["http://localhost:5173", "http://localhost"]  # Vite dev / nginx
if settings.FRONTEND_URL:
    _origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(photos.router)


@app.get("/", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
