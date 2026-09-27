# Tasks

## 1. Project Context & Workspace Setup

- [x] 1.1 Update `openspec/config.yaml` with Bisect tech stack, architecture constraints, and git ownership guidelines, and verify `openspec validate` succeeds
- [x] 1.2 Initialize `backend/` with `uv`, configure `pyproject.toml` with dependencies (`fastapi`, `uvicorn[standard]`, `sqlmodel`, `sqlalchemy`, `asyncpg`, `alembic`, `pydantic-settings`, `aiosqlite`, `pytest`, `pytest-asyncio`, `httpx`), and verify `uv sync` builds the lockfile

## 2. Configuration, Database & Logging Infrastructure

- [x] 2.1 Implement `app/core/config.py` using `pydantic_settings.BaseSettings` for database URL, environment mode, API prefix, and log level, and verify default settings load correctly
- [x] 2.2 Implement `app/core/logging.py` for structured logging and request timing middleware, and verify log formatting
- [x] 2.3 Implement `app/core/db.py` setting up async engine (`create_async_engine`), async sessionmaker, and FastAPI `get_session` dependency generator, and verify session injection

## 3. Domain Models & Alembic Migrations

- [x] 3.1 Implement enumeration types (`RunStatus`, `StepType`) in `app/models/enums.py` and verify all lifecycle states are represented
- [x] 3.2 Implement `User` SQLModel entity in `app/models/user.py` with UUID primary key, `github_user_id`, `github_username`, `encrypted_token`, and timestamps
- [x] 3.3 Implement `Repository` SQLModel entity in `app/models/repository.py` with UUID primary key, `owner_id` foreign key, `github_repo_id`, `full_name`, `default_branch`, `clone_url`, and timestamps
- [x] 3.4 Implement `Run` and `RunStep` SQLModel entities in `app/models/run.py` with foreign keys, lifecycle statuses, execution logs, and timestamps, and expose all models in `app/models/__init__.py`
- [x] 3.5 Initialize Alembic in `backend/`, configure `alembic/env.py` to target `SQLModel.metadata` and async database URLs, generate initial migration script, and verify migration file is created

## 4. API Application & Health Endpoints

- [x] 4.1 Implement `app/api/v1/health.py` with `GET /health` (liveness) and `GET /health/db` (readiness with `SELECT 1` query)
- [x] 4.2 Assemble FastAPI application in `app/main.py` mounting CORS, request logging middleware, and API router (`/api/v1`), and verify application startup

## 5. Testing Suite & Verification

- [x] 5.1 Configure `pytest` and implement `tests/conftest.py` with async test client (`httpx.AsyncClient`) and in-memory test database fixtures
- [x] 5.2 Implement `tests/test_health.py` verifying `/health` and `/health/db` endpoints return valid HTTP responses
- [x] 5.3 Implement `tests/test_models.py` verifying entity creation, UUID generation, enum validation, and foreign key relationships
- [x] 5.4 Execute full test suite via `uv run pytest` and verify all tests pass cleanly
