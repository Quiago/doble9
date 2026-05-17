# AGENT: Backend
"""In-process registry of live `MatchRuntime`s.

M1 scope: solo seating (the joining user at seat 0, three bots). Real
multiplayer seat assignment from `match_players` is M2 (the join_lobby
contract carries only `matchId`); flagged for the Architect.
"""

from __future__ import annotations

import random

from src.core.redis import RedisMatchStore
from src.game.state_machine import Player
from src.ws.runtime import MatchRuntime


def _solo_players(user_id: str) -> list[Player]:
    return [
        Player(seat=0, user_id=user_id, name="Tú", is_bot=False),
        Player(seat=1, user_id="bot:1", name="Bot Yusniel", is_bot=True),
        Player(seat=2, user_id="bot:2", name="Bot Manolo", is_bot=True),
        Player(seat=3, user_id="bot:3", name="Bot Yaíma", is_bot=True),
    ]


class MatchRegistry:
    def __init__(self, *, store: RedisMatchStore | None = None) -> None:
        self._runtimes: dict[str, MatchRuntime] = {}
        self._store = store

    def get(self, match_id: str) -> MatchRuntime | None:
        return self._runtimes.get(match_id)

    def get_or_create_solo(
        self, match_id: str, user_id: str, *, target_score: int = 100
    ) -> MatchRuntime:
        rt = self._runtimes.get(match_id)
        if rt is None:
            rt = MatchRuntime(
                match_id,
                _solo_players(user_id),
                mode="solo",
                target_score=target_score,
                rng=random.Random(),
                store=self._store,
            )
            self._runtimes[match_id] = rt
        return rt

    def drop(self, match_id: str) -> None:
        self._runtimes.pop(match_id, None)
