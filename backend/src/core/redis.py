# AGENT: Backend
"""Redis: live match-state store + pub/sub client.

Per `CLAUDE.md §5.2` the authoritative live snapshot of a match lives in
Redis under `match:{id}` with a 24h TTL (refreshed on every mutation so
active games never expire). Durable history goes to Postgres separately.

Key/serialization helpers are pure and unit-tested; `RedisMatchStore`
takes an injected async client so tests don't need a live server.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

import redis.asyncio as aioredis

from src.core.config import get_settings

# 24h, refreshed on each write (CLAUDE.md §5.2).
MATCH_STATE_TTL_SECONDS = 24 * 60 * 60


def match_key(match_id: str) -> str:
    return f"match:{match_id}"


def serialize_state(state: dict[str, Any]) -> str:
    return json.dumps(state, separators=(",", ":"), sort_keys=True)


def deserialize_state(raw: str | bytes) -> dict[str, Any]:
    data: dict[str, Any] = json.loads(raw)
    return data


@lru_cache(maxsize=1)
def get_redis() -> aioredis.Redis:
    """Lazy singleton client (no connection until first command)."""
    settings = get_settings()
    return aioredis.from_url(settings.redis_url, decode_responses=True)


class RedisMatchStore:
    """Thin async wrapper around the `match:{id}` key with TTL refresh."""

    def __init__(self, client: aioredis.Redis | None = None) -> None:
        self._r = client if client is not None else get_redis()

    async def save(self, match_id: str, state: dict[str, Any]) -> None:
        await self._r.set(
            match_key(match_id),
            serialize_state(state),
            ex=MATCH_STATE_TTL_SECONDS,
        )

    async def load(self, match_id: str) -> dict[str, Any] | None:
        raw = await self._r.get(match_key(match_id))
        return deserialize_state(raw) if raw is not None else None

    async def touch(self, match_id: str) -> bool:
        """Refresh the TTL without rewriting the payload."""
        return bool(await self._r.expire(match_key(match_id), MATCH_STATE_TTL_SECONDS))

    async def delete(self, match_id: str) -> None:
        await self._r.delete(match_key(match_id))
