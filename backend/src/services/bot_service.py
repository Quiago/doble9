# AGENT: Backend
"""Heuristic (rule-based) bot — M1 single-player vs bots (`CLAUDE.md §15`).

Deliberately NOT the RL agent (Phase 2, `src/bots/`). This unblocks the
frontend's solo mode: the match service calls `bot_take_turn` whenever a
bot-occupied seat is on turn and broadcasts the authoritative result.

`choose_play` is pure (hand + board → move | pass) and exhaustively
tested; `bot_take_turn` is the thin adapter onto `MatchStateMachine`.

Strategy (NORMAL/HARD): shed weight. Among legal moves prefer the
highest-pip tile (doubles weighted heavier — they are the easiest tiles
to get stuck with), so a blocked round leaves the lightest hand and a
domino is reached sooner. HARD additionally grabs an immediate
hand-emptying win and keeps ends it can still answer. EASY plays a random
legal move (gentle opponent / tutorial).
"""

from __future__ import annotations

import random
from collections.abc import Sequence
from enum import StrEnum

from src.game.board import Board, BoardSide
from src.game.rules import Seat, legal_moves
from src.game.state_machine import MatchStateMachine, Result
from src.game.tile import Tile

BotMove = tuple[Tile, BoardSide]


class BotDifficulty(StrEnum):
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"


_DOUBLE_PENALTY = 5  # doubles are the hardest tiles to offload → shed first


def _weight_score(tile: Tile) -> float:
    """Higher = more desirable to play now. Base = pip weight; doubles get
    a bonus so they leave the hand early."""
    return float(tile.pips) + (_DOUBLE_PENALTY if tile.is_double else 0)


def _hard_bonus(tile: Tile, side: BoardSide, hand: Sequence[Tile], board: Board) -> float:
    bonus = 0.0
    # Winning move (this was the last tile) trumps everything.
    if len(hand) == 1:
        bonus += 1_000.0
    # Prefer leaving an open end whose value we still hold elsewhere, so we
    # keep an answer next turn.
    if not board.is_empty:
        end = board.left_end if side == "left" else board.right_end
        if end is not None:
            exposed = tile.other_end(end)
            if any(t is not tile and t.matches(exposed) for t in hand):
                bonus += 2.0
    return bonus


def choose_play(
    hand: Sequence[Tile],
    board: Board,
    *,
    mandatory_tile: Tile | None = None,
    difficulty: BotDifficulty = BotDifficulty.NORMAL,
    rng: random.Random | None = None,
) -> BotMove | None:
    """Pick a legal `(tile, side)`, or `None` to pass when blocked."""
    moves = legal_moves(hand, board, mandatory_tile=mandatory_tile)
    if not moves:
        return None

    r = rng or random.Random()

    if difficulty is BotDifficulty.EASY:
        return r.choice(moves)

    def total(move: BotMove) -> float:
        tile, side = move
        s = _weight_score(tile)
        if difficulty is BotDifficulty.HARD:
            s += _hard_bonus(tile, side, hand, board)
        return s

    best = max(total(m) for m in moves)
    top = [m for m in moves if total(m) == best]
    # Randomise among equally-good moves so games aren't identical.
    return r.choice(top)


def bot_take_turn(
    sm: MatchStateMachine,
    seat: Seat,
    *,
    difficulty: BotDifficulty = BotDifficulty.NORMAL,
    rng: random.Random | None = None,
) -> Result:
    """Drive the bot at `seat` for exactly one authoritative action.

    The state machine validates everything; this only chooses *what* to
    attempt, so a buggy heuristic can never produce an illegal game state.
    """
    if sm.status != "PLAYING":
        return Result.error(f"bot cannot act in state {sm.status}")
    if sm.turn_seat != seat:
        return Result.error("not the bot's turn")

    player = sm.players[seat]
    move = choose_play(
        sm.hands[seat],
        sm.board,
        mandatory_tile=sm.mandatory_tile,
        difficulty=difficulty,
        rng=rng,
    )
    if move is None:
        return sm.pass_turn(player.user_id)
    tile, side = move
    return sm.play_tile(player.user_id, tile.id, side)
