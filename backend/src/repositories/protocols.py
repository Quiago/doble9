# AGENT: Backend
"""Repository Protocols + shared domain DTOs and errors.

DTOs are plain dataclasses (storage-agnostic); routers map them to the
`api.schemas` contract types.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class NotFoundError(Exception):
    """Requested entity does not exist."""


class ConflictError(Exception):
    """Uniqueness violation (e.g. username/email already taken)."""


class InsufficientCoinsError(Exception):
    """Purchase rejected: not enough coins."""


@dataclass(slots=True)
class UserRow:
    id: str
    username: str
    email: str | None
    password_hash: str | None
    avatar_url: str | None
    country: str | None
    created_at: str


@dataclass(slots=True)
class StatsRow:
    user_id: str
    games_played: int = 0
    games_won: int = 0
    games_lost: int = 0
    total_points: int = 0
    current_streak: int = 0
    best_streak: int = 0
    league_tier: str = "Bronze"
    league_points: int = 0
    coins: int = 100
    xp: int = 0
    level: int = 1


@dataclass(slots=True)
class MatchRow:
    id: str
    room_code: str
    mode: str
    status: str
    target_score: int
    created_at: str


@dataclass(slots=True)
class HistoryRow:
    match_id: str
    mode: str
    winner_team: str | None
    final_scores: dict[str, int]
    played_at: str
    result: str  # "win" | "loss"


@dataclass(slots=True)
class LeaderboardRow:
    rank: int
    user_id: str
    username: str
    avatar_url: str | None
    league_tier: str
    league_points: int


@dataclass(slots=True)
class StoreItemRow:
    key: str
    type: str
    name: str
    description: str
    price_coins: int
    preview_url: str | None
    owned: bool


class UserRepository(Protocol):
    async def create(
        self, *, username: str, email: str, password_hash: str
    ) -> UserRow: ...
    async def get_by_id(self, user_id: str) -> UserRow | None: ...
    async def get_by_identifier(self, identifier: str) -> UserRow | None: ...


class StatsRepository(Protocol):
    async def ensure(self, user_id: str) -> StatsRow: ...
    async def get(self, user_id: str) -> StatsRow | None: ...
    async def adjust_coins(self, user_id: str, delta: int) -> int: ...


class MatchRepository(Protocol):
    async def create(
        self,
        *,
        mode: str,
        target_score: int,
        room_code: str,
        host_user_id: str,
        fill_with_bots: bool,
    ) -> MatchRow: ...
    async def get_by_id(self, match_id: str) -> MatchRow | None: ...
    async def get_by_room_code(self, room_code: str) -> MatchRow | None: ...
    async def add_player(self, match_id: str, user_id: str) -> None: ...
    async def history(
        self, user_id: str, *, page: int, page_size: int
    ) -> tuple[list[HistoryRow], int]: ...


class StoreRepository(Protocol):
    async def list_items(self, user_id: str | None) -> list[StoreItemRow]: ...
    async def purchase(self, user_id: str, item_key: str) -> int: ...


class LeaderboardRepository(Protocol):
    async def top(
        self, *, tier: str | None, limit: int
    ) -> list[LeaderboardRow]: ...
