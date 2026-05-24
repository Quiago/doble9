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
    StoreItemRow(
        "skin_manolito_heat",
        "avatar_skin",
        "Manolito Heat",
        "Manolito con jersey de los Heat.",
        250,
        None,
        False,
    ),
    StoreItemRow(
        "skin_manolito_esmoquin",
        "avatar_skin",
        "Manolito Esmoquin",
        "Manolito de etiqueta.",
        400,
        None,
        False,
    ),
    StoreItemRow(
        "theme_calle_cuba",
        "board_theme",
        "Calle Cuba",
        "Mesa de dominó en una calle de La Habana.",
        300,
        None,
        False,
    ),
    StoreItemRow(
        "tiles_oro", "tile_set", "Fichas de Oro", "Set de fichas doradas premium.", 500, None, False
    ),
    StoreItemRow("emote_pollona", "emote", "¡POLLONA!", "Emote de celebración.", 100, None, False),
)


class MemoryUserRepository:
    def __init__(self) -> None:
        self._by_id: dict[str, UserRow] = {}

    async def create(self, *, username: str, email: str, password_hash: str) -> UserRow:
        for u in self._by_id.values():
            if u.username == username or u.email == email:
                raise ConflictError("username or email already in use")
        row = UserRow(
            id=_uuid(),
            username=username,
            email=email,
            password_hash=password_hash,
            avatar_url=None,
            country=None,
            created_at=_now_iso(),
            settings={},
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

    async def update(
        self,
        user_id: str,
        *,
        username: str | None = None,
        email: str | None = None,
        avatar_url: str | None = None,
        country: str | None = None,
        settings: dict[str, object] | None = None,
    ) -> UserRow:
        u = self._by_id.get(user_id)
        if u is None:
            raise NotFoundError("user not found")
        for existing in self._by_id.values():
            if existing.id != user_id and (
                (username is not None and existing.username == username)
                or (email is not None and existing.email == email)
            ):
                raise ConflictError("username or email already in use")

        # UserRow is a frozen-like or slots dataclass. We can replace it or mutate fields.
        # It's an immutable-like dataclass from dataclasses. Let's create a new one.
        updated = UserRow(
            id=u.id,
            username=username if username is not None else u.username,
            email=email if email is not None else u.email,
            password_hash=u.password_hash,
            avatar_url=avatar_url if avatar_url is not None else u.avatar_url,
            country=country if country is not None else u.country,
            created_at=u.created_at,
            settings=settings if settings is not None else u.settings,
        )
        self._by_id[user_id] = updated
        return updated


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

    async def update_after_match(
        self,
        user_id: str,
        *,
        won: bool,
        points: int,
        xp_gain: int,
        coins_gain: int,
        league_points_gain: int,
    ) -> StatsRow:
        row = await self.ensure(user_id)
        row.games_played += 1
        row.total_points += points
        if won:
            row.games_won += 1
            row.current_streak += 1
            if row.current_streak > row.best_streak:
                row.best_streak = row.current_streak
        else:
            row.games_lost += 1
            row.current_streak = 0
        row.xp += xp_gain
        row.coins += coins_gain
        row.league_points = max(0, row.league_points + league_points_gain)
        row.level = 1 + (row.xp // 1000)
        return row


class MemoryMatchRepository:
    def __init__(self) -> None:
        self._by_id: dict[str, MatchRow] = {}
        self._members: dict[str, set[str]] = {}

    async def create(
        self,
        *,
        mode: str,
        target_score: int,
        room_code: str,
        host_user_id: str,
        fill_with_bots: bool,
    ) -> MatchRow:
        row = MatchRow(
            id=_uuid(),
            room_code=room_code,
            mode=mode,
            status="LOBBY",
            target_score=target_score,
            created_at=_now_iso(),
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

    async def finish_match(
        self,
        match_id: str,
        *,
        winner_team: str,
        final_scores: dict[str, int],
        status: str = "FINISHED",
    ) -> None:
        if match_id not in self._by_id:
            raise NotFoundError("match not found")
        m = self._by_id[match_id]
        # Memory matches don't have fields in MatchRow, but let's update them anyway in our dict
        # we can recreate the MatchRow with updated status
        updated = MatchRow(
            id=m.id,
            room_code=m.room_code,
            mode=m.mode,
            status=status,
            target_score=m.target_score,
            created_at=m.created_at,
        )
        self._by_id[match_id] = updated


class MemoryStoreRepository:
    def __init__(self, stats: MemoryStatsRepository) -> None:
        self._stats = stats
        self._owned: dict[str, set[str]] = {}

    async def list_items(self, user_id: str | None) -> list[StoreItemRow]:
        owned = self._owned.get(user_id or "", set())
        return [
            StoreItemRow(
                i.key,
                i.type,
                i.name,
                i.description,
                i.price_coins,
                i.preview_url,
                i.key in owned,
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
            (uid, s)
            for uid, s in self._stats._rows.items()
            if tier is None or s.league_tier == tier
        ]
        rows.sort(key=lambda kv: kv[1].league_points, reverse=True)
        out: list[LeaderboardRow] = []
        for rank, (uid, s) in enumerate(rows[:limit], start=1):
            u = await self._users.get_by_id(uid)
            out.append(
                LeaderboardRow(
                    rank=rank,
                    user_id=uid,
                    username=u.username if u else uid,
                    avatar_url=u.avatar_url if u else None,
                    league_tier=s.league_tier,
                    league_points=s.league_points,
                )
            )
        return out
