"""Settings parsing."""

import pytest

from src.core.config import Settings, get_settings, to_async_dsn


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        # Managed-provider sync URLs upgrade to asyncpg (ADR-008).
        ("postgres://u:p@h:5432/db", "postgresql+asyncpg://u:p@h:5432/db"),
        ("postgresql://u:p@h:5432/db", "postgresql+asyncpg://u:p@h:5432/db"),
        # Already-async or other drivers are left untouched.
        ("postgresql+asyncpg://u:p@h/db", "postgresql+asyncpg://u:p@h/db"),
        ("postgresql+psycopg://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("sqlite+aiosqlite:///x.db", "sqlite+aiosqlite:///x.db"),
    ],
)
def test_to_async_dsn(raw: str, expected: str) -> None:
    assert to_async_dsn(raw) == expected


def test_settings_normalizes_sync_dsn() -> None:
    s = Settings(
        DATABASE_URL="postgres://u:p@h:5432/db",  # type: ignore[call-arg]
        REDIS_URL="y",
        SECRET_KEY="z",
    )
    assert s.database_url == "postgresql+asyncpg://u:p@h:5432/db"


def test_settings_load_from_env() -> None:
    s = get_settings()
    assert s.database_url.startswith("postgresql+asyncpg://")
    assert s.algorithm == "HS256"
    assert s.access_token_expire_minutes == 60


def test_cors_csv_parsed_to_list() -> None:
    s = get_settings()
    assert s.cors_origins == ["http://localhost:5173", "https://doble9s.com"]


def test_get_settings_is_cached() -> None:
    assert get_settings() is get_settings()


def test_cors_validator_handles_list_passthrough() -> None:
    s = Settings(
        DATABASE_URL="x",  # type: ignore[call-arg]
        REDIS_URL="y",
        SECRET_KEY="z",
        CORS_ORIGINS="a, b ,, c",
    )
    assert s.cors_origins == ["a", "b", "c"]
