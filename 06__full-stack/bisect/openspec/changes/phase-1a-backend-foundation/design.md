# Design: Phase 1A Backend Foundation

## Context

Bisect is an automated AI debugging/patching engine with a Next.js frontend, FastAPI backend, PostgreSQL database, Podman execution sandbox, and Claude API integration. See `proposal.md` for overall motivation.

For Phase 1A, we establish the backend project skeleton, database ORM, domain models, health endpoints, logging, and test fixtures without implementing the AI agent loop, sandbox runner, GitHub OAuth, or frontend UI.

Constraints:
- Fast local iteration with `uv` package manager.
- Fully asynchronous database operations with SQLAlchemy/asyncpg wrapped in SQLModel.
- Strict schema enforcement and type validation via Pydantic v2 / Pydantic Settings.
- Zero premature microservice or monorepo abstractions; single backend directory root.
- Human developer retains full ownership of Git commands on the Bisect repository (no automated git actions by developer tools).

## Goals / Non-Goals

**Goals:**
- Set up a clean, modular FastAPI project under `backend/` managed by `uv`.
- Provide asynchronous PostgreSQL database connection lifecycle with connection pooling and FastAPI dependency injection (`get_session`).
- Configure Alembic for database migrations tracking SQLModel entity metadata.
- Implement SQLModel models for `User`, `Repository`, `Run`, and `RunStep` with UUID primary keys and proper indexes.
- Implement `/health` and `/health/db` endpoints for liveness/readiness probes.
- Configure structured JSON logging with request timing middleware.
- Configure `pytest` with asynchronous test fixtures (using SQLite in-memory or PostgreSQL test harness).

**Non-Goals:**
- GitHub OAuth flow and API client implementation (Phase 1B).
- Podman sandbox runner or container process execution (Phase 2).
- Anthropic Claude API prompt client or agent loop (Phase 3).
- Git repository cloning, branch manipulation, or PR creation (Phase 4).
- Next.js frontend dashboard and polling hooks (Phase 5).

## Decisions

### Decision 1: Project Management with `uv`
- **Choice**: Use Astral's `uv` for dependency management and virtual environments via standard `pyproject.toml`.
- **Rationale**: `uv` is orders of magnitude faster than `poetry` or standard `pip`, natively supports lockfiles (`uv.lock`), and adheres to PEP 621.
- **Alternatives considered**: Poetry (slower resolution), Pipenv (heavyweight, slower), raw venv + pip (lacks deterministic locking).

### Decision 2: Asynchronous SQLModel with `asyncpg` and SQLAlchemy 2.0 AsyncEngine
- **Choice**: Use SQLModel on top of `sqlalchemy.ext.asyncio` with `asyncpg` driver for PostgreSQL.
- **Rationale**: SQLModel bridges Pydantic v2 schemas and SQLAlchemy models, reducing duplicate class definitions while supporting full async query execution (`AsyncSession`).
- **Alternatives considered**: Synchronous SQLAlchemy (blocks async event loop during DB operations), Tortoise ORM (smaller ecosystem and migration tooling compared to Alembic), Prisma Python (immature).

### Decision 3: Relational RunStep Log Storage
- **Choice**: Store run progress steps in a dedicated `RunStep` table linked by foreign key to `Run`.
- **Rationale**: Enables granular polling (`GET /api/v1/runs/{id}/steps?after={step_id}`) and clean auditing without reading/writing large monolithic JSON blobs.
- **Alternatives considered**: JSONB column on `Run` table (causes concurrency/locking issues when updating run logs and complicates incremental pagination).

### Decision 4: Alembic Configuration for SQLModel Auto-discovery
- **Choice**: Configure `alembic/env.py` to import `SQLModel.metadata` and resolve async database URLs properly via `NullPool` in migration runs.
- **Rationale**: Standardizes database migrations across local and CI/production environments.

### Decision 5: Test Execution Strategy
- **Choice**: Configure pytest with `pytest-asyncio` and an async test client using SQLite in-memory (`aiosqlite`) for fast unit tests, alongside PostgreSQL connection capability for integration testing.
- **Rationale**: Enables instant test runs during local development without strictly requiring a running PostgreSQL daemon for basic route/model validation.

## Risks / Trade-offs

- **[Risk]**: SQLModel async support requires careful handling of relationships and session lifecycle.
  - **Mitigation**: Use explicit `select()` statements with `AsyncSession.exec()` and avoid lazy-loading across session boundaries.
- **[Risk]**: Alembic may fail to detect SQLModel table definitions if models are not imported into `env.py`.
  - **Mitigation**: Maintain a central `app/models/__init__.py` exporting all model classes and import `SQLModel.metadata` in `alembic/env.py`.
- **[Risk]**: Database connection pool exhaustion during concurrent polling requests.
  - **Mitigation**: Configure connection pool limits (`pool_size`, `max_overflow`, `pool_pre_ping`) in `app/core/db.py` via Pydantic settings.

## Migration Plan

1. Local setup: initialize backend virtual environment using `uv sync`.
2. Generate initial Alembic migration: `uv run alembic revision --autogenerate -m "initial_schema"`.
3. Apply migration: `uv run alembic upgrade head`.
4. Verify health endpoints: `uv run pytest`.
