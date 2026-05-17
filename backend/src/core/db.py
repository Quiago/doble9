# AGENT: Backend
"""Async SQLAlchemy engine/session (asyncpg).

Lazy singletons: importing this module never opens a connection, so the
pure game core and unit tests stay DB-free. `get_session` is the FastAPI
dependency used by REST routers (Block C).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core.config import get_settings


@lru_cache(maxsize=1)
def get_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(settings.database_url, pool_pre_ping=True, future=True)


@lru_cache(maxsize=1)
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        get_engine(), expire_on_commit=False, class_=AsyncSession
    )


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: one session per request, rolled back on error."""
    async with get_sessionmaker()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def dispose_engine() -> None:
    """Close the pool (app shutdown / test teardown)."""
    if get_engine.cache_info().currsize:
        await get_engine().dispose()
