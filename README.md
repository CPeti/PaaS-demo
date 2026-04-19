# Lumina - Cloud-Based Photo Album

> **PaaS Demo** · Cloud-based Scalable Systems course

A full-stack photo album application demonstrating a Platform-as-a-Service deployment model with a decoupled frontend/backend architecture, JWT authentication, and a managed relational database.

---

## Architecture

```
┌────────────────────┐         ┌──────────────────────────┐
│  Frontend (Preact) │ ───── > │  Backend (FastAPI)       │
│  Vite · Tailwind   │  HTTP   │  SQLAlchemy · asyncpg    │
│  wouter (routing)  │         │  JWT (PyJWT · pwdlib)    │
│  Canvas thumbnails │         └──────────┬───┬───────────┘
└─────────┬──────────┘                    │   │
          │ PUT                 ┌─────────▼──┐│
          │                     │ PostgreSQL ││
          └────────────────── > │ (Database) ││
                                └────────────┘│
                                      ┌───────▼────┐
                                      │ MinIO (S3) │
                                      │ (Storage)  │
                                      └────────────┘
```

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Frontend  | Preact, TypeScript, Vite, Tailwind CSS v4     |
| Backend   | FastAPI, SQLAlchemy (async), Alembic, asyncpg |
| Auth      | OAuth2 password flow, JWT (HS256)             |
| Database  | PostgreSQL 16                                 |
| Container | Docker Compose (local dev)                    |

---

## Features

- **User registration & JWT login** - secure password hashing with Argon2
- **Direct S3 Uploads** - fast, scalable photo and video uploads using presigned URLs
- **Client-Side Processing** - media thumbnail generation happens in-browser to reduce backend load
- **Async backend** - fully non-blocking I/O with SQLAlchemy async + asyncpg
- **Database migrations** - Alembic for schema versioning

---

## Getting Started

### Prerequisites

- Docker (with Compose v2)

### Docker - full stack

```bash
docker compose up --build
```

### Kubernetes / Tilt

If you have a local Kubernetes cluster (like Docker Desktop, k3d, or minikube) and `tilt` installed, you can run the entire stack with live reloading:

```bash
tilt up
```

Press `Space` to open the Tilt dashboard in your browser.

| Service           | URL                        |
| ----------------- | -------------------------- |
| Frontend          | http://localhost:5173      |
| Backend (FastAPI) | http://localhost:8000      |
| API docs          | http://localhost:8000/docs |

> The backend URL embedded in the frontend bundle defaults to `http://localhost:8000`.
> Override it at build time: `docker compose build --build-arg VITE_API_URL=https://api.example.com frontend`

### Local development (without Docker)

**Prerequisites:** Python ≥ 3.11, Node.js ≥ 20, Docker (for the DB only)

```bash
# 1 - Database
cd backend && docker compose up -d

# 2 - Backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3 - Frontend
cd frontend && npm install && npm run dev
```

---

## API Endpoints

| Method   | Path                 | Auth   | Description                         |
| -------- | -------------------- | ------ | ----------------------------------- |
| `GET`    | `/`                  | -      | Health check                        |
| `POST`   | `/auth/register`     | -      | Create account                      |
| `POST`   | `/auth/token`        | -      | Login → JWT                         |
| `GET`    | `/users/me`          | Bearer | Current user profile                |
| `GET`    | `/photos`            | Bearer | List user's photos                  |
| `POST`   | `/photos/upload-url` | Bearer | Get S3 Presigned PUT URL            |
| `POST`   | `/photos/confirm`    | Bearer | Confirm direct S3 upload            |
| `PATCH`  | `/photos/{id}`       | Bearer | Update photo metadata (e.g. rename) |
| `DELETE` | `/photos/{id}`       | Bearer | Delete photo                        |

---

## Project Structure

```
PaaS-demo/
├── backend/
│   ├── app/
│   │   ├── core/        # Security, settings
│   │   ├── crud/        # DB access layer
│   │   ├── db/          # Engine, session, base
│   │   ├── models/      # SQLAlchemy ORM models
│   │   ├── routers/     # FastAPI route handlers
│   │   ├── schemas/     # Pydantic request/response models
│   │   └── main.py      # App factory & lifespan
│   ├── alembic/         # DB migrations
│   ├── docker-compose.yml
│   └── requirements.txt
├── charts/              # Helm charts for Kubernetes
│   ├── backend/         # FastAPI backend chart
│   ├── frontend/        # Preact frontend chart
│   └── infra/           # Infrastructure (Postgres, MinIO) chart
├── frontend/
│   └── src/
│   │   ├── lib/         # api.ts, auth.ts
│   │   ├── pages/       # LandingPage, LoginPage, RegisterPage, etc
│   │   └── app.tsx      # Router
└── Tiltfile             # Tilt configuration for local Kubernetes dev
```

---

## Environment Variables (`backend/.env`)

| Variable                      | Default                    | Description                |
| ----------------------------- | -------------------------- | -------------------------- |
| `DATABASE_URL`                | `postgresql+asyncpg://...` | Async DB connection string |
| `SECRET_KEY`                  | _(set a strong secret)_    | JWT signing key            |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30`                       | Token lifetime             |
