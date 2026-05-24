# AGENT: Backend
"""Auth router — register / login / me (`contracts/openapi.yml`)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from src.api.deps import CurrentUser, StatsRepoDep, UserRepoDep
from src.api.schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
)
from src.core.security import create_access_token, hash_password, verify_password
from src.repositories.protocols import ConflictError, UserRow

router = APIRouter(tags=["auth"])


def _to_user(row: UserRow) -> User:
    return User(
        id=row.id,
        username=row.username,
        email=row.email,
        avatar_url=row.avatar_url,
        country=row.country,
        created_at=row.created_at,
        settings=row.settings,
    )


@router.post(
    "/auth/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(body: RegisterRequest, users: UserRepoDep, stats: StatsRepoDep) -> AuthResponse:
    try:
        row = await users.create(
            username=body.username,
            email=body.email,
            password_hash=hash_password(body.password),
        )
    except ConflictError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    await stats.ensure(row.id)
    return AuthResponse(token=create_access_token(row.id), user=_to_user(row))


@router.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest, users: UserRepoDep) -> AuthResponse:
    row = await users.get_by_identifier(body.identifier)
    if (
        row is None
        or row.password_hash is None
        or not verify_password(body.password, row.password_hash)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials")
    return AuthResponse(token=create_access_token(row.id), user=_to_user(row))


@router.get("/auth/me", response_model=User)
async def me(current: CurrentUser) -> User:
    return _to_user(current)
