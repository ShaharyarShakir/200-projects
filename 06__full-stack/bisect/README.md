# Bisect

Bisect is a full-stack workspace for an AI-assisted coding agent. It combines a
FastAPI backend for authentication, repository synchronization, agent execution,
and sandbox management with a Next.js workspace UI.

## Stack

- **Backend:** Python 3.12+, FastAPI, SQLModel/SQLAlchemy, Alembic, PostgreSQL
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication:** GitHub OAuth 2.0 with JWT sessions
- **AI provider:** Groq
- **Execution sandbox:** Podman
- **Tooling:** `uv` for Python dependencies and `pnpm` for frontend dependencies

## Repository layout

```text
backend/       FastAPI application, database models, migrations, and tests
frontend/      Next.js App Router application and frontend tests
compose.yaml   Local PostgreSQL service
openspec/      Product specifications and implementation history
```

## Prerequisites

Install the following tools:

- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/)
- Node.js and [`pnpm`](https://pnpm.io/)
- Docker or Podman with Compose support

Podman is only required when using the agent sandbox locally. PostgreSQL is
required for the running backend; the backend test suite uses an in-memory
SQLite database.

## Local setup

From the project root, start PostgreSQL:

```bash
docker compose up -d postgres
```

Create the backend environment file and update its values, especially the
database, GitHub OAuth, JWT, encryption, and Groq settings:

```bash
cp backend/.env.example backend/.env
```

For the local Compose database, use:

```dotenv
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/bisect
```

Install backend dependencies, apply migrations, and start the API:

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

In a second terminal, install frontend dependencies and start the web app:

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend runs at <http://localhost:3000>. The backend runs at
<http://localhost:8000>.

## Backend API

The interactive API documentation is available at:

- Swagger UI: <http://localhost:8000/api/v1/docs>
- ReDoc: <http://localhost:8000/api/v1/redoc>
- OpenAPI JSON: <http://localhost:8000/api/v1/openapi.json>

Health probes:

```text
GET /health
GET /health/db
```

The main API routes are currently grouped under `/api/v1`:

- `/auth` — GitHub OAuth login, callback, and current-user profile
- `/repositories` — list, synchronize, and inspect repositories

The frontend uses `http://localhost:8000` by default. To point it at another
backend, set `NEXT_PUBLIC_API_URL` before starting the frontend.

## Development commands

### Backend

```bash
cd backend
uv run pytest
uv run alembic upgrade head
```

### Frontend

```bash
cd frontend
pnpm test
pnpm build
```

Use `pnpm test -- --watch` for the Vitest watch mode.

## Stopping local services

Stop PostgreSQL while preserving its named volume:

```bash
docker compose stop postgres
```

Remove the container and local database volume when the data is no longer
needed:

```bash
docker compose down -v
```

Do not commit `backend/.env`, local databases, virtual environments,
`node_modules`, or Next.js build output. These files are covered by the project
`.gitignore`.