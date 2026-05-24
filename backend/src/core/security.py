# AGENT: Backend
"""Password hashing (passlib/bcrypt) and JWT issue/verify (PyJWT).

Stateless auth (`CLAUDE.md §5.1`): the token `sub` is the user UUID. The
gateway/REST layer turns a valid token into the current user.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from src.core.config import get_settings


class TokenError(Exception):
    """Invalid / expired / malformed token."""


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))
    except (ValueError, UnicodeEncodeError):
        # Malformed hash → treat as a failed verification, never crash auth.
        return False


def create_access_token(
    subject: str,
    *,
    expires_minutes: int | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    minutes = (
        expires_minutes if expires_minutes is not None else settings.access_token_expire_minutes
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Return the decoded payload or raise `TokenError`."""
    settings = get_settings()
    try:
        decoded: dict[str, Any] = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return decoded
    except jwt.PyJWTError as exc:
        raise TokenError(str(exc)) from exc
