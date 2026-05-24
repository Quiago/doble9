# AGENT: Backend
"""User, PlayerStats, Achievement — faithful to migration 0001."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    username: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str | None] = mapped_column(Text())
    avatar_url: Mapped[str | None] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    country: Mapped[str | None] = mapped_column(String(2))
    settings: Mapped[dict[str, object]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))


class PlayerStats(Base):
    __tablename__ = "player_stats"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    games_played: Mapped[int] = mapped_column(Integer(), server_default="0")
    games_won: Mapped[int] = mapped_column(Integer(), server_default="0")
    games_lost: Mapped[int] = mapped_column(Integer(), server_default="0")
    total_points: Mapped[int] = mapped_column(Integer(), server_default="0")
    current_streak: Mapped[int] = mapped_column(Integer(), server_default="0")
    best_streak: Mapped[int] = mapped_column(Integer(), server_default="0")
    league_tier: Mapped[str] = mapped_column(String(20), server_default="Bronze")
    league_points: Mapped[int] = mapped_column(Integer(), server_default="0")
    coins: Mapped[int] = mapped_column(Integer(), server_default="100")
    xp: Mapped[int] = mapped_column(Integer(), server_default="0")
    level: Mapped[int] = mapped_column(Integer(), server_default="1")


class Achievement(Base):
    __tablename__ = "achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_key", name="uq_user_achievement"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    achievement_key: Mapped[str] = mapped_column(String(50), nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
