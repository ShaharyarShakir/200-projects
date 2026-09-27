# Proposal

## Why

Bisect requires a reliable, modular, and type-safe backend foundation before higher-level agentic orchestration, sandboxing, and GitHub integrations can be built. Establishing the core FastAPI application, asynchronous SQLModel/PostgreSQL persistence layer, Alembic migrations, domain data models (`User`, `Repository`, `Run`, `RunStep`), and a solid testing harness in Phase 1A provides the minimal runnable base required to execute the 7-day MVP without architectural drift.

## What Changes

- Initialize Python project management with `uv` and standard dependencies (FastAPI, SQLModel, asyncpg, Alembic, Pydantic Settings, pytest).
- Configure centralized environment variables and runtime settings using Pydantic Settings (`app/core/config.py`).
- Implement async database engine and session dependency injection (`app/core/db.py`).
- Initialize Alembic migrations configured to discover SQLModel metadata automatically.
- Define initial relational domain models:
  - `User`: GitHub identity and encrypted access token holder.
  - `Repository`: GitHub repository metadata linked to an owner.
  - `Run`: State-machine tracking entity representing a repair job across its full lifecycle.
  - `RunStep`: Chronological event and execution step logs associated with a run.
- Implement structured JSON/console logging and request lifecycle handling.
- Implement operational health check endpoints: `GET /health` and `GET /health/db`.
- Establish `pytest` test harness with test database fixtures and unit/integration tests for health checks and domain models.
- Enrich OpenSpec project context in `openspec/config.yaml`.

## Capabilities

### New Capabilities
- `backend-foundation`: FastAPI application runtime, environment configuration, async database session management, structured logging, health check endpoints, and test suite harness.
- `domain-models`: Relational data models for users, repositories, runs, and run steps with SQLModel and Alembic schema migrations.

### Modified Capabilities
<!-- None: Greenfield project -->

## Impact

- **Backend code**: Creates new `backend/` directory with package structure (`app/core`, `app/models`, `app/api`, `alembic`, `tests`).
- **Dependencies**: Introduces FastAPI, Uvicorn, SQLModel, SQLAlchemy, asyncpg, Alembic, Pydantic Settings, and pytest via `uv`.
- **Database**: Connects to PostgreSQL (local Podman container or managed cloud database).
- **Tooling & Docs**: Configures OpenSpec context in `openspec/config.yaml` for subsequent development phases.
