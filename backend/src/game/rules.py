# AGENT: Backend
"""Cuban double-9 rules: dealing, legal moves, opening, round/match end.

Pure functions over `Tile` / `Board`. The state machine composes these;
nothing here mutates shared state or touches I/O. Rule references point at
`CLAUDE.md §5.3`.

House rules implemented (documented so tests can lock them):
  * 4 players, 2v2. Seats 0 & 2 = teamA, seats 1 & 3 = teamB.
  * Deal 10 tiles each (40), 15 stay in the boneyard. No drawing — a
    player with no legal tile passes.
  * Round 1 opener is whoever holds the double-9 and MUST play it first.
  * A round ends when a player empties their hand ("domino") or the board
    is blocked (no one can play — "tranque").
  * Match ends when a team reaches `target_score` (default 100).
"""

from __future__ import annotations

import random
from collections.abc import Mapping, Sequence
from typing import Literal

from src.game.board import Board, BoardSide
from src.game.tile import Tile, generate_double_nine_deck

Seat = int
Team = Literal["teamA", "teamB"]

NUM_PLAYERS = 4
HAND_SIZE = 10
BONEYARD_SIZE = 15
DEFAULT_TARGET_SCORE = 100
DOUBLE_NINE = Tile(9, 9)

SEATS: tuple[Seat, ...] = (0, 1, 2, 3)


def team_of(seat: Seat) -> Team:
    """Seats 0 & 2 → teamA; seats 1 & 3 → teamB."""
    if seat not in SEATS:
        raise ValueError(f"seat out of range 0..3: {seat}")
    return "teamA" if seat % 2 == 0 else "teamB"


def seats_of(team: Team) -> tuple[Seat, Seat]:
    return (0, 2) if team == "teamA" else (1, 3)


def opponent_team(team: Team) -> Team:
    return "teamB" if team == "teamA" else "teamA"


def deal(rng: random.Random | None = None) -> tuple[dict[Seat, list[Tile]], list[Tile]]:
    """Shuffle the 55-tile set; 10 to each of 4 seats, 15 to the boneyard."""
    deck = generate_double_nine_deck()
    r: random.Random = rng or random.Random()
    r.shuffle(deck)
    hands: dict[Seat, list[Tile]] = {}
    for seat in SEATS:
        start = seat * HAND_SIZE
        hands[seat] = deck[start : start + HAND_SIZE]
    boneyard = deck[NUM_PLAYERS * HAND_SIZE :]
    assert len(boneyard) == BONEYARD_SIZE
    return hands, boneyard


def double_nine_holder(hands: Mapping[Seat, Sequence[Tile]]) -> Seat:
    """Seat holding the 9-9. Raises if it was dealt to the boneyard."""
    for seat, hand in hands.items():
        if DOUBLE_NINE in hand:
            return seat
    raise ValueError("double-9 not present in any hand")


def opening_move(hands: Mapping[Seat, Sequence[Tile]]) -> tuple[Seat, Tile | None]:
    """Round-1 salida (Cuban rule): the seat holding the **highest double**
    opens and must play it. With 40 dealt / 15 in the boneyard the 9-9 is
    often not dealt, so we generalise from "must hold 9-9" to "highest
    double" (9-9 is simply the top of that order). If no double was dealt
    at all, seat 0 opens with a free choice.
    """
    best: tuple[Seat, Tile] | None = None
    for seat, hand in hands.items():
        for tile in hand:
            if tile.is_double and (best is None or tile.high > best[1].high):
                best = (seat, tile)
    return best if best is not None else (0, None)


def legal_moves(
    hand: Sequence[Tile],
    board: Board,
    *,
    mandatory_tile: Tile | None = None,
) -> list[tuple[Tile, BoardSide]]:
    """All `(tile, side)` plays available to a hand on the current board.

    `mandatory_tile` forces the opening move (round 1: the highest double,
    see `opening_move`). On an empty board the side is nominal ("right");
    both ends open afterwards.
    """
    candidates: Sequence[Tile] = (
        [mandatory_tile] if mandatory_tile is not None and mandatory_tile in hand else hand
    )
    moves: list[tuple[Tile, BoardSide]] = []
    for tile in candidates:
        for side in board.playable_sides(tile):
            moves.append((tile, side))
    return moves


def has_legal_move(
    hand: Sequence[Tile],
    board: Board,
    *,
    mandatory_tile: Tile | None = None,
) -> bool:
    return bool(legal_moves(hand, board, mandatory_tile=mandatory_tile))


def is_blocked(hands: Mapping[Seat, Sequence[Tile]], board: Board) -> bool:
    """Tranque: every seat still holding tiles has no legal move."""
    return all(
        len(hand) == 0 or not has_legal_move(hand, board) for hand in hands.values()
    )


def next_seat(seat: Seat) -> Seat:
    """Turn order is seat-clockwise: 0 → 1 → 2 → 3 → 0."""
    return (seat + 1) % NUM_PLAYERS
