"""Settings parsing."""

from src.core.config import Settings, get_settings


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
