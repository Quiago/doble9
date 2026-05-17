# AGENT: Backend
"""Inventory — faithful to migration 0001 (cosmetic items / store)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    false,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (Index("ix_inventory_user", "user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    item_type: Mapped[str] = mapped_column(String(30), nullable=False)
    item_key: Mapped[str] = mapped_column(String(50), nullable=False)
    equipped: Mapped[bool] = mapped_column(Boolean(), server_default=false())
    acquired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
