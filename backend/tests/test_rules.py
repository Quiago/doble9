"""Dealing, teams, legal moves, blocking."""

import random

from src.game.board import Board
from src.game.rules import (
    BONEYARD_SIZE,
    HAND_SIZE,
    NUM_PLAYERS,
    deal,
    double_nine_holder,
    has_legal_move,
    is_blocked,
    legal_moves,
    next_seat,
    opponent_team,
    seats_of,
    team_of,
)
from src.game.tile import Tile, generate_double_nine_deck


def test_teams() -> None:
    assert team_of(0) == "teamA" and team_of(2) == "teamA"
    assert team_of(1) == "teamB" and team_of(3) == "teamB"
    assert seats_of("teamA") == (0, 2) and seats_of("teamB") == (1, 3)
    assert opponent_team("teamA") == "teamB"


def test_next_seat_clockwise() -> None:
    assert [next_seat(s) for s in range(4)] == [1, 2, 3, 0]


def test_deal_partitions_the_full_set() -> None:
    hands, boneyard = deal(random.Random(42))
    assert all(len(h) == HAND_SIZE for h in hands.values())
    assert len(boneyard) == BONEYARD_SIZE
    all_tiles = [t for h in hands.values() for t in h] + boneyard
    assert len(all_tiles) == 55
    assert set(all_tiles) == set(generate_double_nine_deck())
    assert len(hands) == NUM_PLAYERS


def test_double_nine_holder_found() -> None:
    hands, _ = deal(random.Random(7))
    holder = double_nine_holder(hands)
    assert Tile(9, 9) in hands[holder]


def test_legal_moves_and_mandatory() -> None:
    board = Board()
    hand = [Tile(9, 9), Tile(3, 4), Tile(0, 1)]
    # Empty board: every tile is playable (one nominal side).
    assert len(legal_moves(hand, board)) == 3
    # Opening forced to the 9-9.
    forced = legal_moves(hand, board, mandatory_tile=Tile(9, 9))
    assert forced == [(Tile(9, 9), "right")]


def test_is_blocked_true_when_no_one_can_move() -> None:
    board = Board()
    board.place(Tile(0, 0), "right", by_seat=0)  # both ends 0
    hands = {0: [Tile(1, 2)], 1: [Tile(3, 4)], 2: [Tile(5, 6)], 3: [Tile(7, 8)]}
    assert is_blocked(hands, board)
    assert not has_legal_move(hands[0], board)


def test_is_blocked_false_with_a_move_or_empty_hand() -> None:
    board = Board()
    board.place(Tile(0, 0), "right", by_seat=0)
    hands = {0: [Tile(0, 5)], 1: [Tile(3, 4)], 2: [Tile(5, 6)], 3: [Tile(7, 8)]}
    assert not is_blocked(hands, board)  # seat 0 can play 0-5
    empty = {0: [], 1: [Tile(3, 4)], 2: [Tile(5, 6)], 3: [Tile(7, 8)]}
    assert is_blocked(empty, board)  # empty hand doesn't keep it open
