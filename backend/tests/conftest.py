"""Shared fixtures. Provides deterministic settings env so infra modules
(`config`/`security`/`redis`) are unit-testable without a real .env."""

from __future__ import annotations

from collections.abc import Iterator

import pytest

from src.core.config import get_settings

_TEST_ENV = {
    "DATABASE_URL": "postgresql+asyncpg://t:t@localhost:5432/t",
    "REDIS_URL": "redis://localhost:6379/0",
    "SECRET_KEY": "test-secret-key",
    "ALGORITHM": "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "60",
    "CORS_ORIGINS": "http://localhost:5173,https://doble9s.com",
}


@pytest.fixture(autouse=True)
def _settings_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    for key, value in _TEST_ENV.items():
        monkeypatch.setenv(key, value)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
