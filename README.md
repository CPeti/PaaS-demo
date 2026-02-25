# Lumina — Cloud-Based Photo Album

> **PaaS Demo** · Cloud-based Scalable Systems course

A full-stack photo album application demonstrating a Platform-as-a-Service deployment model with a decoupled frontend/backend architecture, JWT authentication, and a managed relational database.

---

## Architecture

```
┌────────────────────┐         ┌──────────────────────────┐
│  Frontend (Preact) │ ───── > │  Backend (FastAPI)       │
│  Vite · Tailwind   │  HTTP   │  SQLAlchemy · asyncpg    │
│  wouter (routing)  │         │  JWT (PyJWT · pwdlib)    │
└────────────────────┘         └──────────┬───────────────┘
                                          │
                                 ┌────────▼──────────┐
                                 │  PostgreSQL 16    │
                                 │  (Docker / PaaS)  │
                                 └───────────────────┘
```

| Layer | Technology |
|---|---|
| Frontend | Preact, TypeScript, Vite, Tailwind CSS v4 |
| Backend | FastAPI, SQLAlchemy (async), Alembic, asyncpg |
| Auth | OAuth2 password flow, JWT (HS256) |
| Database | PostgreSQL 16 |
| Container | Docker Compose (local dev) |

---

## Features

- **User registration & JWT login** — secure password hashing with Argon2
- **Photo upload, view, delete** — per-user album management
- **Async backend** — fully non-blocking I/O with SQLAlchemy async + asyncpg
- **Database migrations** — Alembic for schema versioning

---

## Getting Started

### Prerequisites
- Python ≥ 3.11
- Node.js ≥ 20
- Docker

### 1 — Start the database

```bash
cd backend
docker compose up -d
```

### 2 — Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### 3 — Start the frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Health check |
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/token` | — | Login → JWT |
| `GET` | `/users/me` | Bearer | Current user profile |

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
└── frontend/
    └── src/
        ├── lib/         # api.ts, auth.ts
        ├── pages/       # LandingPage, LoginPage, RegisterPage
        └── app.tsx      # Router
```

---

## Environment Variables (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async DB connection string |
| `SECRET_KEY` | *(set a strong secret)* | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token lifetime |
