# AGENT: Backend
"""Typed application settings (12-factor, loaded from `.env`).

Variable names mirror `backend/.env.example` exactly (Architect-owned).
Import `settings` everywhere; never read `os.environ` directly.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Persistence
    database_url: str = Field(alias="DATABASE_URL")
    redis_url: str = Field(alias="REDIS_URL")

    # Auth (JWT)
    secret_key: str = Field(alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # External services
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")

    # CORS — comma-separated origins in the env. `NoDecode` disables
    # pydantic-settings' JSON pre-parse so our CSV validator handles it.
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"], alias="CORS_ORIGINS"
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_csv(cls, v: object) -> object:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton. Tests override via `get_settings.cache_clear()`."""
    return Settings()  # values come from env / .env
