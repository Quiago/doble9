# AGENT: Backend
"""SQLAlchemy 2.0 async repositories (production).

Validated against the real Postgres via docker-compose integration, not
in `make check` (unit tests use the in-memory impl). Schema is the
Architect migration 0001 via `src.models`.
"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Match, MatchPlayer, PlayerStats, User
from src.repositories.memory import STORE_CATALOG
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


def _user_row(u: User) -> UserRow:
    return UserRow(
        id=str(u.id), username=u.username, email=u.email,
        password_hash=u.password_hash, avatar_url=u.avatar_url,
        country=u.country, created_at=u.created_at.isoformat(),
    )


def _stats_row(s: PlayerStats) -> StatsRow:
    return StatsRow(
        user_id=str(s.user_id), games_played=s.games_played,
        games_won=s.games_won, games_lost=s.games_lost,
        total_points=s.total_points, current_streak=s.current_streak,
        best_streak=s.best_streak, league_tier=s.league_tier,
        league_points=s.league_points, coins=s.coins, xp=s.xp, level=s.level,
    )


def _match_row(m: Match) -> MatchRow:
    return MatchRow(
        id=str(m.id), room_code=m.room_code, mode=m.mode,
        status=m.status, target_score=m.target_score,
        created_at=m.created_at.isoformat(),
    )


class SqlUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def create(self, *, username: str, email: str, password_hash: str) -> UserRow:
        user = User(username=username, email=email, password_hash=password_hash)
        self._s.add(user)
        try:
            await self._s.flush()
        except IntegrityError as exc:
            raise ConflictError("username or email already in use") from exc
        return _user_row(user)

    async def get_by_id(self, user_id: str) -> UserRow | None:
        u = await self._s.get(User, uuid.UUID(user_id))
        return _user_row(u) if u else None

    async def get_by_identifier(self, identifier: str) -> UserRow | None:
        stmt = select(User).where(
            (User.username == identifier) | (User.email == identifier)
        )
        u = (await self._s.execute(stmt)).scalar_one_or_none()
        return _user_row(u) if u else None


class SqlStatsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def ensure(self, user_id: str) -> StatsRow:
        uid = uuid.UUID(user_id)
        s = await self._s.get(PlayerStats, uid)
        if s is None:
            s = PlayerStats(user_id=uid)
            self._s.add(s)
            await self._s.flush()
        return _stats_row(s)

    async def get(self, user_id: str) -> StatsRow | None:
        s = await self._s.get(PlayerStats, uuid.UUID(user_id))
        return _stats_row(s) if s else None

    async def adjust_coins(self, user_id: str, delta: int) -> int:
        s = await self._s.get(PlayerStats, uuid.UUID(user_id))
        if s is None:
            s = PlayerStats(user_id=uuid.UUID(user_id))
            self._s.add(s)
            await self._s.flush()
        if s.coins + delta < 0:
            raise InsufficientCoinsError("not enough coins")
        s.coins += delta
        await self._s.flush()
        return s.coins


class SqlMatchRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def create(
        self, *, mode: str, target_score: int, room_code: str,
        host_user_id: str, fill_with_bots: bool,
    ) -> MatchRow:
        m = Match(
            room_code=room_code, mode=mode, status="LOBBY",
            target_score=target_score,
        )
        self._s.add(m)
        await self._s.flush()
        self._s.add(
            MatchPlayer(
                match_id=m.id, user_id=uuid.UUID(host_user_id),
                team="teamA", seat=0, is_bot=False,
            )
        )
        await self._s.flush()
        return _match_row(m)

    async def get_by_id(self, match_id: str) -> MatchRow | None:
        m = await self._s.get(Match, uuid.UUID(match_id))
        return _match_row(m) if m else None

    async def get_by_room_code(self, room_code: str) -> MatchRow | None:
        stmt = select(Match).where(Match.room_code == room_code)
        m = (await self._s.execute(stmt)).scalar_one_or_none()
        return _match_row(m) if m else None

    async def add_player(self, match_id: str, user_id: str) -> None:
        m = await self._s.get(Match, uuid.UUID(match_id))
        if m is None:
            raise NotFoundError("match not found")
        count = (
            await self._s.execute(
                select(func.count())
                .select_from(MatchPlayer)
                .where(MatchPlayer.match_id == m.id)
            )
        ).scalar_one()
        seat = int(count)
        self._s.add(
            MatchPlayer(
                match_id=m.id, user_id=uuid.UUID(user_id),
                team="teamA" if seat % 2 == 0 else "teamB",
                seat=seat, is_bot=False,
            )
        )
        await self._s.flush()

    async def history(
        self, user_id: str, *, page: int, page_size: int
    ) -> tuple[list[HistoryRow], int]:
        uid = uuid.UUID(user_id)
        base = (
            select(Match, MatchPlayer.team)
            .join(MatchPlayer, MatchPlayer.match_id == Match.id)
            .where(MatchPlayer.user_id == uid, Match.status == "FINISHED")
        )
        total = (
            await self._s.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()
        rows = (
            await self._s.execute(
                base.order_by(Match.ended_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()
        items: list[HistoryRow] = []
        for m, team in rows:
            scores = m.final_scores or {"teamA": 0, "teamB": 0}
            result = "win" if m.winner_team == team else "loss"
            items.append(
                HistoryRow(
                    match_id=str(m.id), mode=m.mode,
                    winner_team=m.winner_team,
                    final_scores={
                        "teamA": int(scores.get("teamA", 0)),
                        "teamB": int(scores.get("teamB", 0)),
                    },
                    played_at=(m.ended_at or m.created_at).isoformat(),
                    result=result,
                )
            )
        return items, int(total)


class SqlStoreRepository:
    def __init__(self, session: AsyncSession, stats: SqlStatsRepository) -> None:
        self._s = session
        self._stats = stats

    async def list_items(self, user_id: str | None) -> list[StoreItemRow]:
        owned: set[str] = set()
        if user_id is not None:
            from src.models import Inventory

            keys = (
                await self._s.execute(
                    select(Inventory.item_key).where(
                        Inventory.user_id == uuid.UUID(user_id)
                    )
                )
            ).scalars()
            owned = set(keys)
        return [
            StoreItemRow(
                i.key, i.type, i.name, i.description, i.price_coins,
                i.preview_url, i.key in owned,
            )
            for i in STORE_CATALOG
        ]

    async def purchase(self, user_id: str, item_key: str) -> int:
        from src.models import Inventory

        item = next((i for i in STORE_CATALOG if i.key == item_key), None)
        if item is None:
            raise NotFoundError("item not found")
        existing = (
            await self._s.execute(
                select(Inventory).where(
                    Inventory.user_id == uuid.UUID(user_id),
                    Inventory.item_key == item_key,
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            return (await self._stats.ensure(user_id)).coins
        remaining = await self._stats.adjust_coins(user_id, -item.price_coins)
        self._s.add(
            Inventory(
                user_id=uuid.UUID(user_id),
                item_type=item.type, item_key=item_key, equipped=False,
            )
        )
        await self._s.flush()
        return remaining


class SqlLeaderboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def top(self, *, tier: str | None, limit: int) -> list[LeaderboardRow]:
        stmt = (
            select(
                User.id, User.username, User.avatar_url,
                PlayerStats.league_tier, PlayerStats.league_points,
            )
            .join(PlayerStats, PlayerStats.user_id == User.id)
            .order_by(PlayerStats.league_points.desc())
            .limit(limit)
        )
        if tier is not None:
            stmt = stmt.where(PlayerStats.league_tier == tier)
        rows = (await self._s.execute(stmt)).all()
        return [
            LeaderboardRow(
                rank=i, user_id=str(uid), username=uname,
                avatar_url=avatar, league_tier=lt, league_points=lp,
            )
            for i, (uid, uname, avatar, lt, lp) in enumerate(rows, start=1)
        ]
