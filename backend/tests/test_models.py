"""Models stay faithful to migration 0001 (CLAUDE.md §7 + ADR-005)."""

from src.models import Base

EXPECTED_TABLES = {
    "users",
    "player_stats",
    "matches",
    "match_players",
    "achievements",
    "inventory",
}


def test_metadata_has_all_tables() -> None:
    assert set(Base.metadata.tables) == EXPECTED_TABLES


def test_users_columns_match_migration() -> None:
    cols = Base.metadata.tables["users"].columns
    assert {
        "id",
        "username",
        "email",
        "password_hash",  # added for JWT (ADR-005), absent from CLAUDE.md §7
        "avatar_url",
        "created_at",
        "last_login",
        "country",
        "settings",
    } <= set(cols.keys())
    assert not cols["username"].nullable
    assert cols["username"].unique


def test_keys_and_indexes() -> None:
    mp = Base.metadata.tables["match_players"]
    assert {c.name for c in mp.primary_key.columns} == {"match_id", "user_id"}
    assert "ix_match_players_user" in {i.name for i in mp.indexes}

    inv = Base.metadata.tables["inventory"]
    assert "ix_inventory_user" in {i.name for i in inv.indexes}

    ach = Base.metadata.tables["achievements"]
    assert "uq_user_achievement" in {c.name for c in ach.constraints if c.name}
