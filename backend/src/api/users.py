# AGENT: Backend
"""Users router — player stats and paginated match history."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from src.api.deps import CurrentUser, MatchRepoDep, StatsRepoDep
from src.api.schemas import (
    LeagueTier,
    MatchHistoryEntry,
    MatchMode,
    PaginatedMatchHistory,
    PlayerStats,
    Scores,
)

router = APIRouter(tags=["users"])


@router.get("/users/{user_id}/stats", response_model=PlayerStats)
async def get_stats(
    user_id: str, current: CurrentUser, stats: StatsRepoDep
) -> PlayerStats:
    row = await stats.get(user_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "stats not found")
    return PlayerStats(
        user_id=row.user_id, games_played=row.games_played,
        games_won=row.games_won, games_lost=row.games_lost,
        total_points=row.total_points, current_streak=row.current_streak,
        best_streak=row.best_streak, league_tier=LeagueTier(row.league_tier),
        league_points=row.league_points, coins=row.coins, xp=row.xp,
        level=row.level,
    )


@router.get("/users/{user_id}/history", response_model=PaginatedMatchHistory)
async def get_history(
    user_id: str,
    current: CurrentUser,
    matches: MatchRepoDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(le=100, alias="pageSize")] = 20,
) -> PaginatedMatchHistory:
    rows, total = await matches.history(
        user_id, page=page, page_size=page_size
    )
    return PaginatedMatchHistory(
        items=[
            MatchHistoryEntry(
                match_id=r.match_id, mode=MatchMode(r.mode),
                winner_team=r.winner_team,
                final_scores=Scores(
                    team_a=r.final_scores.get("teamA", 0),
                    team_b=r.final_scores.get("teamB", 0),
                ),
                played_at=r.played_at, result=r.result,
            )
            for r in rows
        ],
        page=page, page_size=page_size, total=total,
    )
