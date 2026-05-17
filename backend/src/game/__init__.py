# AGENT: Backend
"""Pure, server-authoritative Cuban double-9 game core.

No network, DB or framework deps live here — only the rules of the game.
Shapes mirror the cross-agent contract in `shared/types/game.d.ts`
(Architect-owned). Any deviation requires an ADR.
"""

from src.game.board import Board, PlacedTile
from src.game.scoring import RoundOutcome, SpecialPlay, special_plays_for_move
from src.game.state_machine import MatchStateMachine, Result
from src.game.tile import Pip, Tile, generate_double_nine_deck

__all__ = [
    "Board",
    "PlacedTile",
    "Pip",
    "Tile",
    "generate_double_nine_deck",
    "RoundOutcome",
    "SpecialPlay",
    "special_plays_for_move",
    "MatchStateMachine",
    "Result",
]
