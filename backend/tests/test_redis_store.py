"""Redis match-state helpers (pure parts + store against a fake client)."""

from __future__ import annotations

from typing import Any

import pytest

from src.core.redis import (
    MATCH_STATE_TTL_SECONDS,
    RedisMatchStore,
    deserialize_state,
    match_key,
    serialize_state,
)


def test_key_and_ttl() -> None:
    assert match_key("abc") == "match:abc"
    assert MATCH_STATE_TTL_SECONDS == 86_400  # 24h, CLAUDE.md §5.2


def test_serialize_roundtrip_is_stable() -> None:
    state = {"status": "PLAYING", "scores": {"teamA": 10, "teamB": 0}, "round": 2}
    raw = serialize_state(state)
    assert deserialize_state(raw) == state
    # Deterministic (sorted keys) — important for cheap change detection.
    assert serialize_state(state) == serialize_state(dict(reversed(list(state.items()))))


class FakeRedis:
    """Minimal async stand-in covering the commands RedisMatchStore uses."""

    def __init__(self) -> None:
        self.store: dict[str, str] = {}
        self.ttl: dict[str, int] = {}

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self.store[key] = value
        if ex is not None:
            self.ttl[key] = ex

    async def get(self, key: str) -> str | None:
        return self.store.get(key)

    async def expire(self, key: str, seconds: int) -> bool:
        if key not in self.store:
            return False
        self.ttl[key] = seconds
        return True

    async def delete(self, key: str) -> None:
        self.store.pop(key, None)
        self.ttl.pop(key, None)


@pytest.mark.asyncio
async def test_store_save_load_touch_delete() -> None:
    fake = FakeRedis()
    store = RedisMatchStore(client=fake)  # type: ignore[arg-type]
    state: dict[str, Any] = {"status": "LOBBY", "round": 1}

    assert await store.load("m1") is None
    await store.save("m1", state)
    assert fake.ttl["match:m1"] == MATCH_STATE_TTL_SECONDS
    assert await store.load("m1") == state

    fake.ttl["match:m1"] = 5
    assert await store.touch("m1") is True
    assert fake.ttl["match:m1"] == MATCH_STATE_TTL_SECONDS
    assert await store.touch("missing") is False

    await store.delete("m1")
    assert await store.load("m1") is None
