"""Heuristic bot — pure policy + MatchStateMachine adapter."""

import random

from src.game.board import Board
from src.game.state_machine import MatchStateMachine, Player
from src.game.tile import Tile
from src.services.bot_service import BotDifficulty, bot_take_turn, choose_play


def _players() -> list[Player]:
    return [Player(seat=s, user_id=f"u{s}", name=f"P{s}", is_bot=True) for s in range(4)]


# ── pure policy ───────────────────────────────────────────────────────────
def test_pass_when_blocked() -> None:
    board = Board()
    board.place(Tile(0, 0), "right", by_seat=0)  # ends 0 | 0
    assert choose_play([Tile(1, 2), Tile(3, 4)], board) is None


def test_respects_mandatory_opening() -> None:
    hand = [Tile(9, 9), Tile(3, 4), Tile(0, 1)]
    for diff in BotDifficulty:
        move = choose_play(hand, Board(), mandatory_tile=Tile(9, 9), difficulty=diff)
        assert move is not None and move[0] == Tile(9, 9)


def test_normal_sheds_heaviest_then_doubles() -> None:
    # Empty board: 9-9 (18 + double bonus) must beat 0-1 (1).
    move = choose_play([Tile(0, 1), Tile(9, 9)], Board(), difficulty=BotDifficulty.NORMAL)
    assert move == (Tile(9, 9), "right")


def test_easy_returns_a_legal_move() -> None:
    board = Board()
    board.place(Tile(3, 5), "right", by_seat=0)
    hand = [Tile(3, 9), Tile(5, 7), Tile(1, 2)]
    move = choose_play(hand, board, difficulty=BotDifficulty.EASY, rng=random.Random(0))
    assert move is not None
    tile, side = move
    assert board.can_place(tile, side) and tile in hand


def test_hard_prefers_keeping_an_answerable_end() -> None:
    board = Board()
    board.place(Tile(1, 2), "right", by_seat=0)  # ends 1 | 2
    # Both 1-4 (left) and 2-3 (right) weigh 5; only 1-4 leaves an end (4)
    # the bot can still answer (it holds 4-4).
    hand = [Tile(1, 4), Tile(2, 3), Tile(4, 4)]
    move = choose_play(hand, board, difficulty=BotDifficulty.HARD)
    assert move == (Tile(1, 4), "left")


def test_hard_takes_immediate_win() -> None:
    board = Board()
    board.place(Tile(3, 4), "right", by_seat=0)  # ends 3 | 4
    hand = [Tile(4, 7)]  # last tile, plays on the 4
    move = choose_play(hand, board, difficulty=BotDifficulty.HARD)
    assert move == (Tile(4, 7), "right")


# ── state-machine adapter ─────────────────────────────────────────────────
def test_bot_take_turn_guards() -> None:
    sm = MatchStateMachine("m", _players(), rng=random.Random(1))
    assert not bot_take_turn(sm, 0).success  # not started (LOBBY)
    sm.start()
    not_on_turn = (sm.turn_seat + 1) % 4  # type: ignore[operator]
    assert not bot_take_turn(sm, not_on_turn).success


def test_all_bot_match_terminates() -> None:
    sm = MatchStateMachine("m", _players(), rng=random.Random(2024), clock=lambda: 1000.0)
    sm.start()
    rng = random.Random(7)
    for _ in range(20_000):
        if sm.status == "FINISHED":
            break
        seat = sm.turn_seat
        assert seat is not None
        res = bot_take_turn(sm, seat, difficulty=BotDifficulty.NORMAL, rng=rng)
        assert res.success, res.error_message
    assert sm.status == "FINISHED"
    assert max(sm.scores.values()) >= sm.target_score
