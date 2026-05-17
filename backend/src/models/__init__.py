# AGENT: Backend
"""SQLAlchemy models. Importing this package registers every table on
`Base.metadata` (Alembic autogenerate target, see `migrations/env.py`).
"""

from src.models.base import Base
from src.models.inventory import Inventory
from src.models.match import Match, MatchPlayer
from src.models.user import Achievement, PlayerStats, User

__all__ = [
    "Base",
    "User",
    "PlayerStats",
    "Achievement",
    "Match",
    "MatchPlayer",
    "Inventory",
]
