"""Alembic async env — Architect scaffold.

BACKEND AGENT HANDOFF: once SQLAlchemy models exist, set
`target_metadata = Base.metadata` (import from src.models) to enable
`make makemigration` autogenerate. Until then, write migrations explicitly
(see versions/0001_initial_schema.py).
"""

from __future__ import annotations

import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# DB URL from environment (12-factor). Never hardcode in alembic.ini.
# Normalize to the asyncpg driver (ADR-008) so managed-Postgres URLs work.
from src.core.config import to_async_dsn  # noqa: E402

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set (copy backend/.env.example -> .env)")
config.set_main_option("sqlalchemy.url", to_async_dsn(DATABASE_URL))

# AGENT: Backend — models now exist; autogenerate compares against them.
from src.models import Base  # noqa: E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
