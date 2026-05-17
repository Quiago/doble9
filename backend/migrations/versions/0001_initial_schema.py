"""initial schema (CLAUDE.md §7)

Architect-authored baseline: users, player_stats, matches, match_players,
achievements, inventory. Written explicitly (no autogenerate) so it runs
before SQLAlchemy models exist. Backend agent extends via new revisions.

Revision ID: 0001
Revises:
Create Date: 2026-05-17
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

UUID = postgresql.UUID(as_uuid=True)
JSONB = postgresql.JSONB


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID, primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("username", sa.String(32), nullable=False, unique=True),
        sa.Column("email", sa.String(255), unique=True),
        sa.Column("password_hash", sa.Text()),
        sa.Column("avatar_url", sa.Text()),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("last_login", sa.TIMESTAMP(timezone=True)),
        sa.Column("country", sa.String(2)),
        sa.Column("settings", JSONB, server_default=sa.text("'{}'::jsonb")),
    )

    op.create_table(
        "player_stats",
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("games_played", sa.Integer(), server_default="0"),
        sa.Column("games_won", sa.Integer(), server_default="0"),
        sa.Column("games_lost", sa.Integer(), server_default="0"),
        sa.Column("total_points", sa.Integer(), server_default="0"),
        sa.Column("current_streak", sa.Integer(), server_default="0"),
        sa.Column("best_streak", sa.Integer(), server_default="0"),
        sa.Column("league_tier", sa.String(20), server_default="Bronze"),
        sa.Column("league_points", sa.Integer(), server_default="0"),
        sa.Column("coins", sa.Integer(), server_default="100"),
        sa.Column("xp", sa.Integer(), server_default="0"),
        sa.Column("level", sa.Integer(), server_default="1"),
    )

    op.create_table(
        "matches",
        sa.Column("id", UUID, primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("room_code", sa.String(8), nullable=False, unique=True),
        sa.Column("mode", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), server_default="lobby"),
        sa.Column("target_score", sa.Integer(), server_default="100"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("started_at", sa.TIMESTAMP(timezone=True)),
        sa.Column("ended_at", sa.TIMESTAMP(timezone=True)),
        sa.Column("winner_team", sa.String(10)),
        sa.Column("final_scores", JSONB),
        sa.Column("game_log", JSONB),
    )

    op.create_table(
        "match_players",
        sa.Column("match_id", UUID, sa.ForeignKey("matches.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("team", sa.String(10), nullable=False),
        sa.Column("seat", sa.Integer(), nullable=False),
        sa.Column("joined_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("left_at", sa.TIMESTAMP(timezone=True)),
        sa.Column("is_bot", sa.Boolean(), server_default=sa.false()),
    )

    op.create_table(
        "achievements",
        sa.Column("id", UUID, primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("achievement_key", sa.String(50), nullable=False),
        sa.Column("unlocked_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "achievement_key", name="uq_user_achievement"),
    )

    op.create_table(
        "inventory",
        sa.Column("id", UUID, primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("item_type", sa.String(30), nullable=False),
        sa.Column("item_key", sa.String(50), nullable=False),
        sa.Column("equipped", sa.Boolean(), server_default=sa.false()),
        sa.Column("acquired_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_match_players_user", "match_players", ["user_id"])
    op.create_index("ix_inventory_user", "inventory", ["user_id"])


def downgrade() -> None:
    op.drop_table("inventory")
    op.drop_table("achievements")
    op.drop_table("match_players")
    op.drop_table("matches")
    op.drop_table("player_stats")
    op.drop_table("users")
