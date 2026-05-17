# AGENT: Backend
"""Leaderboard router — weekly league standings."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from src.api.deps import CurrentUser, LeaderboardRepoDep
from src.api.schemas import LeaderboardEntry, LeagueTier

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    current: CurrentUser,
    leaders: LeaderboardRepoDep,
    tier: Annotated[LeagueTier | None, Query()] = None,
    limit: Annotated[int, Query(le=200)] = 50,
) -> list[LeaderboardEntry]:
    rows = await leaders.top(tier=tier.value if tier else None, limit=limit)
    return [
        LeaderboardEntry(
            rank=r.rank, user_id=r.user_id, username=r.username,
            avatar_url=r.avatar_url, league_tier=LeagueTier(r.league_tier),
            league_points=r.league_points,
        )
        for r in rows
    ]
