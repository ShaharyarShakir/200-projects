import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock
from app.core.db import get_session
from app.main import app


@pytest.mark.asyncio
async def test_liveness_check(client: AsyncClient) -> None:
    """Verify /health returns status ok."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "bisect-backend"


@pytest.mark.asyncio
async def test_api_v1_liveness_check(client: AsyncClient) -> None:
    """Verify /api/v1/health returns status ok."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "bisect-backend"


@pytest.mark.asyncio
async def test_readiness_db_check_success(client: AsyncClient) -> None:
    """Verify /health/db returns 200 when database is connected."""
    response = await client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_readiness_db_check_failure(client: AsyncClient) -> None:
    """Verify /health/db returns 503 when database execution fails."""
    mock_session = AsyncMock()
    mock_session.execute.side_effect = Exception("Database connection timeout")

    async def override_failing_session():
        yield mock_session

    app.dependency_overrides[get_session] = override_failing_session
    try:
        response = await client.get("/health/db")
        assert response.status_code == 503
        data = response.json()
        assert data["detail"]["status"] == "error"
        assert data["detail"]["database"] == "disconnected"
    finally:
        app.dependency_overrides.clear()
