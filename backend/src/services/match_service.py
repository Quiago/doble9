# AGENT: Backend
"""Matchmaking helpers (REST side).

Live gameplay state (the `MatchStateMachine` + bot driving + Redis
snapshot) is owned by the WS gateway in Block D. Here we only mint room
codes and the durable match record.
"""

from __future__ import annotations

import secrets

_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous 0/O/1/I
ROOM_CODE_LEN = 6


def generate_room_code(length: int = ROOM_CODE_LEN) -> str:
    """Human-friendly, unambiguous room code (fits VARCHAR(8))."""
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))
