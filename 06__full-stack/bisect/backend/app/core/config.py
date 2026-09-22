from functools import lru_cache
from typing import List
from cryptography.fernet import Fernet
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    PROJECT_NAME: str = "Bisect"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bisect"
    DATABASE_ECHO: bool = False
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # GitHub OAuth
    GITHUB_CLIENT_ID: str = "mock-github-client-id"
    GITHUB_CLIENT_SECRET: str = "mock-github-client-secret"
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/github/callback"

    # Cryptography & JWT
    ENCRYPTION_SECRET_KEY: str = "i2_x1szObisCwZwpi3tCtg8FjNh-SyANThdSUbF07QY="
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production-must-be-long-and-secure"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    @field_validator("ENCRYPTION_SECRET_KEY")
    @classmethod
    def validate_encryption_key(cls, v: str) -> str:
        if v:
            try:
                Fernet(v.encode() if isinstance(v, str) else v)
            except Exception as e:
                raise ValueError(f"Invalid ENCRYPTION_SECRET_KEY for Fernet encryption: {e}")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()


settings = get_settings()
