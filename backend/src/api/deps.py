# AGENT: Backend
"""FastAPI dependencies: DB session, repositories, current user.

Every repo is provided through a function so tests swap the SQL impl for
the in-memory one via `app.dependency_overrides` (no Postgres in CI).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.core.redis import RedisMatchStore
from src.core.security import TokenError, decode_token
from src.repositories.protocols import (
    LeaderboardRepository,
    MatchRepository,
    StatsRepository,
    StoreRepository,
    UserRepository,
    UserRow,
)
from src.repositories.sql import (
    SqlLeaderboardRepository,
    SqlMatchRepository,
    SqlStatsRepository,
    SqlStoreRepository,
    SqlUserRepository,
)

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_user_repo(session: SessionDep) -> UserRepository:
    return SqlUserRepository(session)


def get_stats_repo(session: SessionDep) -> StatsRepository:
    return SqlStatsRepository(session)


def get_match_repo(session: SessionDep) -> MatchRepository:
    return SqlMatchRepository(session)


def get_store_repo(session: SessionDep) -> StoreRepository:
    return SqlStoreRepository(session, SqlStatsRepository(session))


def get_leaderboard_repo(session: SessionDep) -> LeaderboardRepository:
    return SqlLeaderboardRepository(session)


UserRepoDep = Annotated[UserRepository, Depends(get_user_repo)]
StatsRepoDep = Annotated[StatsRepository, Depends(get_stats_repo)]
MatchRepoDep = Annotated[MatchRepository, Depends(get_match_repo)]
StoreRepoDep = Annotated[StoreRepository, Depends(get_store_repo)]
LeaderboardRepoDep = Annotated[LeaderboardRepository, Depends(get_leaderboard_repo)]

def get_match_store() -> RedisMatchStore:
    return RedisMatchStore()


MatchStoreDep = Annotated[RedisMatchStore, Depends(get_match_store)]

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    users: UserRepoDep,
) -> UserRow:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing bearer token")
    try:
        payload = decode_token(creds.credentials)
    except TokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token") from exc
    sub = payload.get("sub")
    if not isinstance(sub, str):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "malformed token")
    user = await users.get_by_id(sub)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user no longer exists")
    return user


CurrentUser = Annotated[UserRow, Depends(get_current_user)]
