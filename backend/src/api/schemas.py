# AGENT: Backend
"""Pydantic DTOs — 1:1 with `contracts/openapi.yml`.

JSON is camelCase (the contract); Python attributes are snake_case via a
camel alias generator. Responses serialise by alias (FastAPI default).
"""

from __future__ import annotations

import re
from enum import StrEnum
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _valid_email(v: str) -> str:
    if not _EMAIL_RE.match(v):
        raise ValueError("invalid email address")
    return v


# Lightweight email type — avoids the extra `email-validator` dependency.
EmailStr = Annotated[str, AfterValidator(_valid_email)]


class _Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ── errors ────────────────────────────────────────────────────────────────
class ApiError(_Camel):
    code: str
    message: str
    details: dict[str, object] | None = None


# ── auth / user ───────────────────────────────────────────────────────────
class User(_Camel):
    id: str
    username: str
    email: str | None = None
    avatar_url: str | None = None
    country: str | None = None
    created_at: str
    settings: dict[str, object] = Field(default_factory=dict)


class UpdateUserRequest(_Camel):
    username: str | None = Field(default=None, min_length=3, max_length=32)
    email: EmailStr | None = None
    avatar_url: str | None = None
    country: str | None = None
    settings: dict[str, object] | None = None


class AuthResponse(_Camel):
    token: str
    user: User


class RegisterRequest(_Camel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(_Camel):
    identifier: str  # username or email
    password: str


class LeagueTier(StrEnum):
    BRONZE = "Bronze"
    SILVER = "Silver"
    GOLD = "Gold"
    PLATINUM = "Platinum"
    DIAMOND = "Diamond"


class PlayerStats(_Camel):
    user_id: str
    games_played: int
    games_won: int
    games_lost: int
    total_points: int
    current_streak: int
    best_streak: int
    league_tier: LeagueTier
    league_points: int
    coins: int
    xp: int
    level: int


# ── matches ───────────────────────────────────────────────────────────────
class MatchMode(StrEnum):
    SOLO = "solo"
    MULTIPLAYER = "multiplayer"
    TOURNAMENT = "tournament"


class MatchStatus(StrEnum):
    LOBBY = "LOBBY"
    DEALING = "DEALING"
    PLAYING = "PLAYING"
    SCORING = "SCORING"
    FINISHED = "FINISHED"


class MatchCreateRequest(_Camel):
    mode: MatchMode
    target_score: int = 100
    fill_with_bots: bool = False


class MatchSummary(_Camel):
    id: str
    room_code: str
    mode: MatchMode
    status: MatchStatus
    target_score: int
    created_at: str


class JoinMatchRequest(_Camel):
    room_code: str = Field(max_length=8)


# ── leaderboard / store / history ─────────────────────────────────────────
class LeaderboardEntry(_Camel):
    rank: int
    user_id: str
    username: str
    avatar_url: str | None = None
    league_tier: LeagueTier
    league_points: int


class StoreItemType(StrEnum):
    AVATAR_SKIN = "avatar_skin"
    BOARD_THEME = "board_theme"
    TILE_SET = "tile_set"
    EMOTE = "emote"


class StoreItem(_Camel):
    key: str
    type: StoreItemType
    name: str
    description: str
    price_coins: int
    preview_url: str | None = None
    owned: bool


class PurchaseRequest(_Camel):
    item_key: str


class PurchaseResponse(_Camel):
    item_key: str
    coins_remaining: int


class Scores(_Camel):
    team_a: int
    team_b: int


class MatchHistoryEntry(_Camel):
    match_id: str
    mode: MatchMode
    winner_team: str | None = None
    final_scores: Scores
    played_at: str
    result: str  # "win" | "loss"


class PaginatedMatchHistory(_Camel):
    items: list[MatchHistoryEntry]
    page: int
    page_size: int
    total: int
