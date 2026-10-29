import os
import re
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SKILL//INTELLIGENCE API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = False

    # Database settings
    DATABASE_URL: Optional[str] = None
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # CORS origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()


def sanitize_db_uri(uri: Optional[str]) -> str:
    """
    Redact password and sensitive tokens from PostgreSQL connection URI.
    Example: postgresql://user:pass@host:5432/db -> postgresql://user:***@host:5432/db
    """
    if not uri:
        return ""
    # Redact user:password
    sanitized = re.sub(r"://([^:@]+):([^@]+)@", r"://\1:***@", uri)
    return sanitized


def extract_host_from_uri(uri: Optional[str]) -> str:
    """
    Extract safe host identifier without credentials.
    """
    if not uri:
        return "Unknown"
    match = re.search(r"@([^:/]+)", uri)
    if match:
        host = match.group(1)
        # Redact partial host if desired or return host
        return host
    return "Unknown Host"
