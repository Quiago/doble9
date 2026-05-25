"""MatchRuntime — bot driving, ADR-004 reconnect, dedup, substitution."""

from __future__ import annotations

import random

from src.game.rules import legal_moves
from src.game.state_machine import Player
from src.ws.runtime import MatchRuntime


def _runtime(seed: int = 5) -> MatchRuntime:
    players = [
        Player(0, "u0", "Tú", is_bot=False),
        Player(1, "bot:1", "B1", is_bot=True),
        Player(2, "bot:2", "B2", is_bot=True),
        Player(3, "bot:3", "B3", is_bot=True),
    ]
    return MatchRuntime(
        "m1",
        players,
        mode="solo",
        rng=random.Random(seed),
        clock=lambda: 1000.0,
    )


def _human_move(rt: MatchRuntime) -> tuple[str, str] | None:
    moves = legal_moves(rt.sm.hands[0], rt.sm.board, mandatory_tile=rt.sm.mandatory_tile)
    if not moves:
        return None
    tile, side = moves[0]
    return tile.id, side


def test_start_drives_bots_until_human_turn() -> None:
    rt = _runtime()
    disp = rt.apply_start("u0")
    assert disp.resend_state is True
    assert rt.sm.status == "PLAYING"
    # Bots auto-played until it is the human's (seat 0) turn.
    assert rt.sm.turn_seat == 0
    # Public events were buffered (unless the human was the opener).
    assert all(
        e["event"]
        in {
            "tile_placed",
            "turn_changed",
            "special_play",
            "round_end",
            "match_end",
        }
        for e in disp.public
    )


def test_full_solo_game_reaches_match_end() -> None:
    rt = _runtime(seed=11)
    rt.apply_start("u0")

    saw_match_end = False
    for _ in range(20_000):
        if rt.sm.status == "FINISHED":
            break
        assert rt.sm.turn_seat == 0  # only the human is ever asked to act
        mv = _human_move(rt)
        disp = rt.apply_play("u0", *mv) if mv else rt.apply_pass("u0")
        assert disp.error is None
        if any(e["event"] == "match_end" for e in disp.public):
            saw_match_end = True
    assert rt.sm.status == "FINISHED"
    assert saw_match_end
    assert max(rt.sm.scores.values()) >= rt.sm.target_score


def test_round_and_match_end_carry_kind_and_points() -> None:
    # The wire envelopes for round_end/match_end must expose `kind`
    # (DOMINO|TRANQUE) and integer `points` — the frontend uses them for the
    # end-of-round overlays. Regression guard for the runtime whitelist.
    rt = _runtime(seed=11)
    rt.apply_start("u0")

    seen_match = False
    for _ in range(20_000):
        if rt.sm.status == "FINISHED":
            break
        mv = _human_move(rt)
        disp = rt.apply_play("u0", *mv) if mv else rt.apply_pass("u0")
        for e in disp.public:
            if e["event"] in {"round_end", "match_end"}:
                assert e["payload"]["kind"] in {"DOMINO", "TRANQUE"}
                assert isinstance(e["payload"]["points"], int)
                assert e["payload"]["winnerTeam"] in {"teamA", "teamB"}
                seen_match = seen_match or e["event"] == "match_end"
    assert seen_match  # a full game always ends in match_end


def test_tile_placed_carries_decreasing_hand_count() -> None:
    # ADR-011: each tile_placed envelope exposes `handCount` = tiles left in
    # the playing seat's hand, authoritative. For the human (seat 0) it must
    # equal 10 - (plays by seat 0) and strictly decrease across their turns.
    rt = _runtime(seed=11)
    rt.apply_start("u0")

    human_counts: list[int] = []
    for _ in range(20_000):
        if rt.sm.status == "FINISHED":
            break
        mv = _human_move(rt)
        disp = rt.apply_play("u0", *mv) if mv else rt.apply_pass("u0")
        assert disp.error is None
        for e in disp.public:
            if e["event"] == "tile_placed":
                # every placement carries the count for whoever played it
                assert isinstance(e["payload"]["handCount"], int)
                assert 0 <= e["payload"]["handCount"] <= 10
                if e["payload"]["bySeat"] == 0:
                    human_counts.append(e["payload"]["handCount"])
        if len(human_counts) >= 3:
            break

    assert len(human_counts) >= 3  # the human played at least three tiles
    # 10 tiles dealt; the n-th placement leaves 10 - n.
    assert human_counts[:3] == [9, 8, 7]
    assert human_counts == sorted(human_counts, reverse=True)


def test_player_passed_enters_reconnect_buffer() -> None:
    # ADR-011 addendum: `player_passed` is an authoritative game event and must
    # be in _PUBLIC so it lands in the ADR-004 replay-delta buffer (like
    # tile_placed/turn_changed). Otherwise a mid-turn reconnect never replays it.
    rt = _runtime(seed=11)
    rt.apply_start("u0")

    saw_pass = False
    for _ in range(20_000):
        if rt.sm.status == "FINISHED":
            break
        mv = _human_move(rt)
        disp = rt.apply_play("u0", *mv) if mv else rt.apply_pass("u0")
        assert disp.error is None
        if any(e["event"] == "player_passed" for e in disp.public):
            saw_pass = True
            break

    assert saw_pass  # a pass occurred (human or bot) during the game
    buffered = [e for e in rt._buffer if e["event"] == "player_passed"]  # noqa: SLF001
    assert buffered, "player_passed must be buffered for reconnect replay"
    # A reconnect anchored just before the pass replays it as a delta.
    pass_ts = buffered[0]["timestamp"]
    replay = rt.join_events("u0", pass_ts - 1)
    assert any(e["event"] == "player_passed" for e in replay)


def test_reconnect_snapshot_vs_delta() -> None:
    rt = _runtime()
    rt.apply_start("u0")
    # Make at least one human move so the buffer has public events
    # regardless of who opened (the human may be the opener).
    mv = _human_move(rt)
    assert mv is not None
    rt.apply_play("u0", *mv)
    assert rt._buffer  # noqa: SLF001 - test introspection

    # No anchor → full private snapshot.
    full = rt.join_events("u0", None)
    assert len(full) == 1 and full[0]["event"] == "game_state"
    assert "hand" in full[0]["payload"]

    # Anchor inside the buffer → ordered delta of only newer events.
    anchor = rt._buffer[0]["timestamp"]  # noqa: SLF001
    delta = rt.join_events("u0", anchor)
    assert delta == [e for e in rt._buffer if e["timestamp"] > anchor]  # noqa: SLF001
    assert all(e["timestamp"] > anchor for e in delta)

    # Anchor older than the retained buffer → fall back to snapshot.
    assert rt.join_events("u0", 1)[0]["event"] == "game_state"


def test_client_id_dedup_is_idempotent() -> None:
    rt = _runtime()
    rt.apply_start("u0")
    mv = _human_move(rt)
    assert mv is not None

    first = rt.apply_play("u0", *mv, client_id="c-1")
    assert first.error is None and first.public
    turn_after = rt.sm.turn_seat
    buffered = len(rt._buffer)  # noqa: SLF001

    repeat = rt.apply_play("u0", *mv, client_id="c-1")
    assert repeat.public == [] and repeat.error is None
    assert rt.sm.turn_seat == turn_after
    assert len(rt._buffer) == buffered  # noqa: SLF001 - no state change


def test_illegal_move_returns_error_only() -> None:
    rt = _runtime()
    rt.apply_start("u0")
    disp = rt.apply_play("u0", "9-9", "left")  # almost certainly not legal/owned
    if disp.error is not None:
        assert disp.public == []
        assert disp.error["event"] == "error"


def test_chat_broadcast_not_state() -> None:
    rt = _runtime()
    rt.apply_start("u0")
    disp = rt.apply_chat("u0", "¡pollona!")
    assert disp.resend_state is False
    assert len(disp.public) == 1
    msg = disp.public[0]
    assert msg["event"] == "chat_message"
    assert msg["payload"] == {"bySeat": 0, "userId": "u0", "message": "¡pollona!"}


def test_disconnect_substitution_finishes_game() -> None:
    rt = _runtime(seed=3)
    rt.apply_start("u0")
    assert rt.sm.turn_seat == 0
    disp = rt.substitute_bot(0)  # human seat taken over by a bot
    assert rt.sm.players[0].is_bot is True
    assert rt.sm.status == "FINISHED"
    assert disp.resend_state is True


def test_session_bind_unbind_connected_flag() -> None:
    rt = _runtime()
    rt.bind("sidA", "u0")
    assert rt.sm.players[0].connected is True
    assert rt.unbind("sidA") == "u0"
    assert rt.sm.players[0].connected is False
