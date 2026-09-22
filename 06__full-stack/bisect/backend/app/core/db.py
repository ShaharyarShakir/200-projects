from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.core.config import settings
from app.core.logging import logger


def get_engine_args(db_url: str) -> dict:
    """Generate engine arguments based on database dialect."""
    args = {
        "echo": settings.DATABASE_ECHO,
        "future": True,
    }
    if db_url.startswith("postgresql"):
        args.update(
            {
                "pool_size": settings.DB_POOL_SIZE,
                "max_overflow": settings.DB_MAX_OVERFLOW,
                "pool_pre_ping": True,
            }
        )
    return args


# Ensure async driver prefix for PostgreSQL if needed
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("sqlite://") and not db_url.startswith("sqlite+aiosqlite://"):
    db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

engine = create_async_engine(db_url, **get_engine_args(db_url))

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency to yield an asynchronous database session."""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception as exc:
            await session.rollback()
            logger.error(f"Database session rollback due to error: {exc}")
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables using SQLModel metadata."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database schema initialized via SQLModel metadata.")
