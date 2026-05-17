"""Password hashing + JWT issue/verify."""

import pytest

from src.core.security import (
    TokenError,
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip() -> None:
    h = hash_password("manolito-9-9")
    assert h != "manolito-9-9"
    assert verify_password("manolito-9-9", h)
    assert not verify_password("wrong", h)


def test_verify_handles_malformed_hash() -> None:
    assert verify_password("whatever", "not-a-bcrypt-hash") is False


def test_jwt_roundtrip_carries_subject_and_claims() -> None:
    token = create_access_token("user-uuid-123", extra_claims={"role": "player"})
    payload = decode_token(token)
    assert payload["sub"] == "user-uuid-123"
    assert payload["role"] == "player"
    assert "exp" in payload and "iat" in payload


def test_expired_token_rejected() -> None:
    token = create_access_token("u", expires_minutes=-1)
    with pytest.raises(TokenError):
        decode_token(token)


def test_tampered_token_rejected() -> None:
    token = create_access_token("u")
    with pytest.raises(TokenError):
        decode_token(token + "tampered")
