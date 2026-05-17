"""MatchStateMachine — authoritative flow, guards, full-match invariants."""

import random

import pytest

from src.game.board import Board
from src.game.rules import legal_moves
from src.game.state_machine import MatchError, MatchStateMachine, Player
from src.game.tile import Tile


def make_players() -> list[Player]:
    return [Player(seat=s, user_id=f"u{s}", name=f"P{s}") for s in range(4)]


def new_match(seed: int = 1) -> MatchStateMachine:
    return MatchStateMachine(
        "m1",
        make_players(),
        rng=random.Random(seed),
        clock=lambda: 1000.0,
    )


# ── construction guards ───────────────────────────────────────────────────
def test_requires_four_distinct_seats() -> None:
    with pytest.raises(MatchError):
        MatchStateMachine("m", [Player(0, "a", "A")])
    dup = [Player(0, "a", "A"), Player(0, "b", "B"), Player(2, "c", "C"), Player(3, "d", "D")]
    with pytest.raises(MatchError):
        MatchStateMachine("m", dup)


def test_start_only_from_lobby() -> None:
    sm = new_match()
    assert sm.status == "LOBBY"
    sm.start()
    assert sm.status == "PLAYING"
    assert not sm.start().success  # already started


# ── round-1 opening rules ─────────────────────────────────────────────────
def test_round1_opener_must_play_highest_double() -> None:
    sm = new_match()
    sm.start()
    opener = sm.turn_seat
    assert opener is not None
    mt = sm.mandatory_tile
    assert mt is not None and mt.is_double and mt in sm.hands[opener]
    # It is the highest double across all hands.
    all_doubles = [t for h in sm.hands.values() for t in h if t.is_double]
    assert mt.high == max(d.high for d in all_doubles)
    opener_uid = sm.players[opener].user_id

    other = next(t for t in sm.hands[opener] if t != mt)
    bad = sm.play_tile(opener_uid, other.id, "right")
    assert not bad.success and "highest double" in (bad.error_message or "")

    good = sm.play_tile(opener_uid, mt.id, "right")
    assert good.success and good.event == "tile_placed"
    if mt == Tile(9, 9):
        assert "DOUBLE_9" in good.specials
    assert sm.board.open_ends() == (mt.low, mt.high)
    assert sm.turn_seat == (opener + 1) % 4


# ── turn / participant guards ─────────────────────────────────────────────
def test_turn_and_participant_guards() -> None:
    sm = new_match()
    sm.start()
    opener = sm.turn_seat
    assert opener is not None
    not_opener = sm.players[(opener + 1) % 4].user_id
    mt = sm.mandatory_tile
    assert mt is not None

    assert not sm.play_tile(not_opener, mt.id, "right").success  # not your turn
    assert not sm.play_tile("ghost", mt.id, "right").success  # not a participant
    assert sm.play_tile(sm.players[opener].user_id, mt.id, "right").success  # opener can


def test_cannot_pass_with_a_legal_move() -> None:
    sm = new_match()
    sm.start()
    opener = sm.players[sm.turn_seat].user_id  # type: ignore[index]
    r = sm.pass_turn(opener)
    assert not r.success and "legal move" in (r.error_message or "")


# ── crafted resolutions (white-box) ───────────────────────────────────────
def _enter_playing(sm: MatchStateMachine) -> None:
    sm.start()
    sm._mandatory_tile = None  # drop the round-1 opening constraint


def test_domino_scores_opponents_and_starts_next_round() -> None:
    sm = new_match()
    _enter_playing(sm)
    sm.board = Board()
    sm.board.place(Tile(3, 4), "right", by_seat=0)  # ends 3 | 4
    sm.hands = {0: [Tile(0, 1)], 1: [Tile(4, 5)], 2: [Tile(0, 2)], 3: [Tile(2, 2)]}
    sm.turn_seat = 1

    r = sm.play_tile("u1", "4-5", "right")
    assert r.success and r.event == "round_end"
    assert r.payload["winnerTeam"] == "teamB"
    # teamA (seats 0+2) holds 0-1 and 0-2 -> 1 + 2 = 3.
    assert r.payload["points"] == 3
    assert sm.scores["teamB"] == 3
    assert sm.status == "PLAYING"  # next round dealt
    assert sm.round == 2


def test_capicua_detected_on_closing_tile() -> None:
    sm = new_match()
    _enter_playing(sm)
    sm.board = Board()
    # Force both open ends to 5 so a 2-5 closes on either side.
    sm.board.place(Tile(5, 5), "right", by_seat=0)
    sm.hands = {0: [], 1: [], 2: [Tile(2, 5)], 3: []}
    sm.turn_seat = 2

    r = sm.play_tile("u2", "2-5", "left")
    assert r.success
    assert "CAPICUA" in r.specials
    assert r.payload["winnerTeam"] == "teamA"


def test_tranque_resolves_on_pass() -> None:
    sm = new_match()
    _enter_playing(sm)
    sm.board = Board()
    sm.board.place(Tile(0, 0), "right", by_seat=0)  # ends 0 | 0, no one holds a 0
    sm.hands = {0: [Tile(1, 2)], 1: [Tile(3, 4)], 2: [Tile(5, 6)], 3: [Tile(7, 8)]}
    sm.turn_seat = 0

    r = sm.pass_turn("u0")
    assert r.success and r.event == "round_end"
    assert r.payload["kind"] == "TRANQUE"
    # teamA = 1+2 + 5+6 = 14, teamB = 3+4 + 7+8 = 22 -> teamA wins, scores teamB total.
    assert r.payload["winnerTeam"] == "teamA"
    assert sm.scores["teamA"] == 22


def test_pollona_on_skunk_match_end() -> None:
    sm = MatchStateMachine(
        "m", make_players(), rng=random.Random(3), clock=lambda: 1000.0, turn_seconds=10
    )
    sm.target_score = 10
    _enter_playing(sm)
    sm.board = Board()
    sm.board.place(Tile(3, 4), "right", by_seat=0)
    sm.hands = {0: [Tile(9, 9)], 1: [Tile(4, 8)], 2: [Tile(0, 0)], 3: []}
    sm.turn_seat = 3  # seat 3 (teamB) empties -> teamB wins, teamA on 0
    # give seat 3 the closing tile instead
    sm.hands[3] = [Tile(4, 5)]
    r = sm.play_tile("u3", "4-5", "right")
    assert r.success and r.event == "match_end"
    assert "POLLONA" in r.specials
    assert sm.status == "FINISHED"
    assert r.payload["winnerTeam"] == "teamB"


# ── snapshot contract ─────────────────────────────────────────────────────
def test_snapshot_hand_privacy_and_shape() -> None:
    sm = new_match()
    sm.start()
    opener = sm.turn_seat
    assert opener is not None
    uid = sm.players[opener].user_id

    own = sm.snapshot(for_user_id=uid)
    assert sorted(own["hand"]) == sorted(t.id for t in sm.hands[opener])
    assert own["matchId"] == "m1"
    assert own["status"] == "PLAYING"
    assert own["targetScore"] == 100
    assert own["boneyardCount"] == 15
    assert len(own["players"]) == 4
    assert own["turn"] is not None and own["turn"]["seat"] == opener
    assert own["turn"]["deadline"] == 1000 * 1000 + 30_000

    spectator = sm.snapshot()
    assert spectator["hand"] == []  # private hand withheld
    other = sm.snapshot(for_user_id=sm.players[(opener + 1) % 4].user_id)
    assert set(other["hand"]).isdisjoint(own["hand"])  # hands never overlap


# ── full match terminates and stays consistent ────────────────────────────
def test_full_match_simulation_terminates() -> None:
    sm = new_match(seed=99)
    sm.start()

    for _ in range(20_000):
        if sm.status == "FINISHED":
            break
        seat = sm.turn_seat
        assert seat is not None
        uid = sm.players[seat].user_id
        moves = legal_moves(
            sm.hands[seat], sm.board, mandatory_tile=sm._mandatory_tile
        )
        if moves:
            tile, side = moves[0]
            res = sm.play_tile(uid, tile.id, side)
        else:
            res = sm.pass_turn(uid)
        assert res.success, res.error_message
    else:  # pragma: no cover - safety net
        pytest.fail("match did not terminate")

    assert sm.status == "FINISHED"
    assert max(sm.scores.values()) >= sm.target_score
    assert sm.scores["teamA"] >= 0 and sm.scores["teamB"] >= 0
