# AGENT: Backend
"""Matches router — create / get (reconnect) / join by room code.

Live state is Redis-backed and owned by the WS gateway (Block D, ADR-004);
`GET /matches/{id}` returns the authoritative snapshot if a live match
exists, else 404.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status

from src.api.deps import CurrentUser, MatchRepoDep, MatchStoreDep
from src.api.schemas import JoinMatchRequest, MatchCreateRequest, MatchSummary
from src.repositories.protocols import MatchRow, NotFoundError
from src.services.match_service import generate_room_code

router = APIRouter(tags=["matches"])


def _summary(m: MatchRow) -> MatchSummary:
    return MatchSummary(
        id=m.id,
        room_code=m.room_code,
        mode=m.mode,
        status=m.status,
        target_score=m.target_score,
        created_at=m.created_at,
    )


@router.post(
    "/matches",
    response_model=MatchSummary,
    status_code=status.HTTP_201_CREATED,
)
async def create_match(
    body: MatchCreateRequest, current: CurrentUser, matches: MatchRepoDep
) -> MatchSummary:
    row = await matches.create(
        mode=body.mode.value,
        target_score=body.target_score,
        room_code=generate_room_code(),
        host_user_id=current.id,
        fill_with_bots=body.fill_with_bots,
    )
    return _summary(row)


@router.get("/matches/{match_id}", response_model=None)
async def get_match(match_id: str, current: CurrentUser, store: MatchStoreDep) -> dict[str, Any]:
    snapshot = await store.load(match_id)
    if snapshot is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "match not found or ended")
    return snapshot


@router.post("/matches/{match_id}/join", response_model=MatchSummary)
async def join_match(
    match_id: str,
    body: JoinMatchRequest,
    current: CurrentUser,
    matches: MatchRepoDep,
) -> MatchSummary:
    row = await matches.get_by_id(match_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "match not found")
    if row.room_code != body.room_code:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "wrong room code")
    try:
        await matches.add_player(match_id, current.id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return _summary(row)
