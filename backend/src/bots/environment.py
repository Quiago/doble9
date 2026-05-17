# AGENT: Backend
"""`CubanDoubleNine-v0` Gym environment — Phase 2 scaffold (`CLAUDE.md §5.5`).

Spec (frozen here so training work can start later without re-deriving):
  * Observation: own hand (10 tiles, padded) + board chain + per-opponent
    tile counts.
  * Action: tile_index (0-9) + placement_side (left/right) + request flag.
  * Reward: +1 win, -1 lose, +0.1 per point scored, -0.01 per illegal try.
  * Self-play curriculum: 2 bots → 4 bots → mixed with human replays.

`gymnasium` is the optional `[rl]` extra; import lazily so the default
env (and `make check`) never needs it.
"""

from __future__ import annotations

from typing import Any

OBS_HAND_SIZE = 10
ACTION_PASS = -1


def make_env(*args: Any, **kwargs: Any) -> Any:
    """Factory for `CubanDoubleNine-v0`. Implemented in Phase 2.

    Will wrap `src.game` (the authoritative rules) as a `gymnasium.Env`
    so training shares one rules engine with production.
    """
    raise NotImplementedError(
        "RL env is Phase 2 — install the [rl] extra and implement against "
        "src.game. M1 uses src.services.bot_service (heuristic)."
    )
