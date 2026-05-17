# AGENT: Backend
"""In-memory repositories — power `make check` (no Postgres) and local
M1 single-player dev. Process-local, not durable. Production wires the
SQLAlchemy impl (`repositories.sql`) instead.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from src.repositories.protocols import (
    ConflictError,
    HistoryRow,
    InsufficientCoinsError,
    LeaderboardRow,
    MatchRow,
    NotFoundError,
    StatsRow,
    StoreItemRow,
    UserRow,
)


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _uuid() -> str:
    return str(uuid.uuid4())


# Static catalogue (no DB table for the catalogue itself — only ownership
# lives in `inventory`). Mirrors StoreItem in the contract.
STORE_CATALOG: tuple[StoreItemRow, ...] = (
    StoreItemRow("skin_manolito_heat", "avatar_skin", "Manolito Heat",
                 "Manolito con jersey de los Heat.", 250, None, False),
    StoreItemRow("skin_manolito_esmoquin", "avatar_skin", "Manolito Esmoquin",
                 "Manolito de etiqueta.", 400, None, False),
    StoreItemRow("theme_calle_cuba", "board_theme", "Calle Cuba",
                 "Mesa de dominó en una calle de La Habana.", 300, None, False),
    StoreItemRow("tiles_oro", "tile_set", "Fichas de Oro",
                 "Set de fichas doradas premium.", 500, None, False),
    StoreItemRow("emote_pollona", "emote", "¡POLLONA!",
                 "Emote de celebración.", 100, None, False),
)


class MemoryUserRepository:
    def __init__(self) -> None:
        self._by_id: dict[str, UserRow] = {}

    async def create(self, *, username: str, email: str, password_hash: str) -> UserRow:
        for u in self._by_id.values():
            if u.username == username or u.email == email:
                raise ConflictError("username or email already in use")
        row = UserRow(
            id=_uuid(), username=username, email=email,
            password_hash=password_hash, avatar_url=None, country=None,
            created_at=_now_iso(),
        )
        self._by_id[row.id] = row
        return row

    async def get_by_id(self, user_id: str) -> UserRow | None:
        return self._by_id.get(user_id)

    async def get_by_identifier(self, identifier: str) -> UserRow | None:
        for u in self._by_id.values():
            if identifier in (u.username, u.email):
                return u
        return None


class MemoryStatsRepository:
    def __init__(self) -> None:
        self._rows: dict[str, StatsRow] = {}

    async def ensure(self, user_id: str) -> StatsRow:
        return self._rows.setdefault(user_id, StatsRow(user_id=user_id))

    async def get(self, user_id: str) -> StatsRow | None:
        return self._rows.get(user_id)

    async def adjust_coins(self, user_id: str, delta: int) -> int:
        row = await self.ensure(user_id)
        new_total = row.coins + delta
        if new_total < 0:
            raise InsufficientCoinsError("not enough coins")
        row.coins = new_total
        return new_total


class MemoryMatchRepository:
    def __init__(self) -> None:
        self._by_id: dict[str, MatchRow] = {}
        self._members: dict[str, set[str]] = {}

    async def create(
        self, *, mode: str, target_score: int, room_code: str,
        host_user_id: str, fill_with_bots: bool,
    ) -> MatchRow:
        row = MatchRow(
            id=_uuid(), room_code=room_code, mode=mode, status="LOBBY",
            target_score=target_score, created_at=_now_iso(),
        )
        self._by_id[row.id] = row
        self._members[row.id] = {host_user_id}
        return row

    async def get_by_id(self, match_id: str) -> MatchRow | None:
        return self._by_id.get(match_id)

    async def get_by_room_code(self, room_code: str) -> MatchRow | None:
        for m in self._by_id.values():
            if m.room_code == room_code:
                return m
        return None

    async def add_player(self, match_id: str, user_id: str) -> None:
        if match_id not in self._by_id:
            raise NotFoundError("match not found")
        self._members[match_id].add(user_id)

    async def history(
        self, user_id: str, *, page: int, page_size: int
    ) -> tuple[list[HistoryRow], int]:
        return [], 0


class MemoryStoreRepository:
    def __init__(self, stats: MemoryStatsRepository) -> None:
        self._stats = stats
        self._owned: dict[str, set[str]] = {}

    async def list_items(self, user_id: str | None) -> list[StoreItemRow]:
        owned = self._owned.get(user_id or "", set())
        return [
            StoreItemRow(
                i.key, i.type, i.name, i.description, i.price_coins,
                i.preview_url, i.key in owned,
            )
            for i in STORE_CATALOG
        ]

    async def purchase(self, user_id: str, item_key: str) -> int:
        item = next((i for i in STORE_CATALOG if i.key == item_key), None)
        if item is None:
            raise NotFoundError("item not found")
        owned = self._owned.setdefault(user_id, set())
        if item_key in owned:
            return (await self._stats.ensure(user_id)).coins
        remaining = await self._stats.adjust_coins(user_id, -item.price_coins)
        owned.add(item_key)
        return remaining


class MemoryLeaderboardRepository:
    def __init__(self, users: MemoryUserRepository, stats: MemoryStatsRepository) -> None:
        self._users = users
        self._stats = stats

    async def top(self, *, tier: str | None, limit: int) -> list[LeaderboardRow]:
        rows = [
            (uid, s) for uid, s in self._stats._rows.items()
            if tier is None or s.league_tier == tier
        ]
        rows.sort(key=lambda kv: kv[1].league_points, reverse=True)
        out: list[LeaderboardRow] = []
        for rank, (uid, s) in enumerate(rows[:limit], start=1):
            u = await self._users.get_by_id(uid)
            out.append(
                LeaderboardRow(
                    rank=rank, user_id=uid,
                    username=u.username if u else uid,
                    avatar_url=u.avatar_url if u else None,
                    league_tier=s.league_tier, league_points=s.league_points,
                )
            )
        return out
