# AGENT: Backend
"""Declarative base. `Base.metadata` is wired into Alembic
(`migrations/env.py`) so `make makemigration` autogenerates against these
models. Models MUST stay faithful to the Architect baseline
`migrations/versions/0001_initial_schema.py` (`CLAUDE.md §7` + ADR-005,
e.g. `users.password_hash` for JWT).
"""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
