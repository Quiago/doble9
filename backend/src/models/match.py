# AGENT: Backend
"""Match, MatchPlayer — faithful to migration 0001.

Authoritative live state lives in Redis (`CLAUDE.md §5.2`); these rows are
the durable record (lobby/result/history, `final_scores`, `game_log`).
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    false,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    room_code: Mapped[str] = mapped_column(String(8), nullable=False, unique=True)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="lobby")
    target_score: Mapped[int] = mapped_column(Integer(), server_default="100")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    winner_team: Mapped[str | None] = mapped_column(String(10))
    final_scores: Mapped[dict[str, object] | None] = mapped_column(JSONB)
    game_log: Mapped[dict[str, object] | None] = mapped_column(JSONB)


class MatchPlayer(Base):
    __tablename__ = "match_players"
    __table_args__ = (Index("ix_match_players_user", "user_id"),)

    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    team: Mapped[str] = mapped_column(String(10), nullable=False)
    seat: Mapped[int] = mapped_column(Integer(), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_bot: Mapped[bool] = mapped_column(Boolean(), server_default=false())
