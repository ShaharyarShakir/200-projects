from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import engine


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
async def health():
    return {
        "status": "ok",
        "service": "brainrot-studio-api",
    }


@router.get("/database")
def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "postgresql",
    }
