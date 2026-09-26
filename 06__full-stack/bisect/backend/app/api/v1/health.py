from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.logging import logger

router = APIRouter(tags=["health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def liveness_check() -> dict:
    """Service liveness probe endpoint."""
    return {"status": "ok", "service": "bisect-backend"}


@router.get("/health/db", status_code=status.HTTP_200_OK)
async def readiness_db_check(
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Database readiness probe executing a lightweight query."""
    try:
        await session.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        logger.exception("Database health check failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "error",
                "database": "disconnected",
                "error": str(exc),
            },
        )
