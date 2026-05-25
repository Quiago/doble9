# AGENT: Architect — real over-the-wire FE↔BE integration.
"""End-to-end tests that drive the live stack exactly as the frontend does.

These exercise the boundary the unit tests cannot: the Socket.IO transport,
the connect-auth handshake (ADR-007), the JSON envelope `{event, matchId,
payload, timestamp}`, and the REST→JWT→WS solo-match flow. The driver mirrors
the real client model — it tracks its own hand locally (optimistic), reads the
board from `tile_placed`, and reacts to `turn_changed` — so a green run means a
human could actually play a match through the UI.

Run: `make test-e2e` (needs `make infra-up` + `make migrate`).
"""

from __future__ import annotations

import asyncio
import uuid

import httpx
import pytest
import socketio

pytestmark = pytest.mark.integration

NS = "/game"
ENVELOPE_KEYS = {"event", "matchId", "payload", "timestamp"}


# ── helpers ───────────────────────────────────────────────────────────────
async def _register(base: str) -> tuple[str, str]:
    """Register a fresh user over REST; return (token, user_id)."""
    suffix = uuid.uuid4().hex[:10]
    async with httpx.AsyncClient(base_url=base, timeout=10) as http:
        res = await http.post(
            "/auth/register",
            json={
                "username": f"e2e_{suffix}",
                "email": f"e2e_{suffix}@example.com",
                "password": "secret123",
            },
        )
    assert res.status_code == 201, res.text
    body = res.json()
    return body["token"], body["user"]["id"]


def _move(hand: list[str], board: dict) -> tuple[str, str] | None:
    """First legal (tileId, side) for `hand` against the open ends — the same
    pip-matching the server enforces. None ⇒ no play ⇒ pass."""
    left, right = board.get("leftEnd"), board.get("rightEnd")
    if left is None:  # empty board → the opener must lay the double-9
        if "9-9" in hand:
            return "9-9", "left"
        return (hand[0], "left") if hand else None
    for t in hand:
        a, b = (int(x) for x in t.split("-"))
        if a == left or b == left:
            return t, "left"
        if a == right or b == right:
            return t, "right"
    return None


def _assert_envelope(env: dict, event: str, match_id: str) -> None:
    assert set(env) == ENVELOPE_KEYS, env
    assert env["event"] == event
    assert env["matchId"] == match_id
    assert isinstance(env["timestamp"], int)


def _assert_chain(board: dict) -> None:
    """Orientation correctness: the wire `ends` must form a continuous chain
    and agree with the reported open ends (this is what `is_flipped` fixes —
    the FE renders straight from `ends`)."""
    tiles = board["tiles"]
    if not tiles:
        return
    for cur, nxt in zip(tiles, tiles[1:], strict=False):
        assert cur["ends"][1] == nxt["ends"][0], f"break: {cur} → {nxt}"
    assert board["leftEnd"] == tiles[0]["ends"][0]
    assert board["rightEnd"] == tiles[-1]["ends"][1]


class SoloDriver:
    """A minimal, faithful game client: connects, joins a solo match, and plays
    its seat to completion, recording every envelope for assertions."""

    def __init__(self, base: str, token: str, user_id: str, match_id: str) -> None:
        self.base, self.token, self.user_id, self.match_id = base, token, user_id, match_id
        self.sio = socketio.AsyncClient(reconnection=False)
        self.events: list[dict] = []
        self.boards: list[dict] = []
        self.hand: list[str] = []
        self.seat: int | None = None
        self.status = "LOBBY"
        self.my_turn = False
        self.done = asyncio.Event()
        self._lock = asyncio.Lock()
        self._register_handlers()

    def _register_handlers(self) -> None:
        for ev in (
            "game_state", "tile_placed", "turn_changed", "special_play",
            "round_end", "match_end", "player_joined", "player_disconnected",
            "player_passed", "chat_message", "error",
        ):
            self.sio.on(ev, self._make_handler(ev), namespace=NS)

    def _make_handler(self, event: str):
        async def handler(env: dict) -> None:
            self.events.append(env)
            payload = env.get("payload", {})
            if event == "game_state":
                self.status = payload.get("status", self.status)
                self.hand = list(payload.get("hand", []))
                if self.seat is None:
                    for p in payload.get("players", []):
                        if p.get("userId") == self.user_id:
                            self.seat = p["seat"]
                self.boards.append(payload["board"])
                # `turn` is null once the match is over — handle it like the FE must.
                self.my_turn = (payload.get("turn") or {}).get("seat") == self.seat
                await self._maybe_act(payload["board"])
            elif event == "tile_placed":
                self.boards.append(payload["board"])
            elif event == "turn_changed":
                self.my_turn = (payload.get("turn") or {}).get("seat") == self.seat
                board = self.boards[-1] if self.boards else {"leftEnd": None, "rightEnd": None}
                await self._maybe_act(board)
            elif event == "match_end":
                self.status = "FINISHED"
                self.done.set()

        return handler

    async def _maybe_act(self, board: dict) -> None:
        async with self._lock:
            if self.status != "PLAYING" or not self.my_turn or self.done.is_set():
                return
            self.my_turn = False  # one action per turn (FE optimistic model)
            mv = _move(self.hand, board)
            cid = uuid.uuid4().hex
            if mv is None:
                await self.sio.emit(
                    "pass_turn", {"matchId": self.match_id, "clientId": cid}, namespace=NS
                )
            else:
                tile_id, side = mv
                self.hand.remove(tile_id)  # optimistic local removal
                await self.sio.emit(
                    "play_tile",
                    {"matchId": self.match_id, "tileId": tile_id, "side": side, "clientId": cid},
                    namespace=NS,
                )

    async def connect(self) -> None:
        await self.sio.connect(
            self.base,
            auth={"token": self.token, "clientId": uuid.uuid4().hex},
            namespaces=[NS],
            wait_timeout=10,
        )

    async def join(self) -> None:
        await self.sio.emit("join_lobby", {"matchId": self.match_id}, namespace=NS)

    async def play_to_end(self, deadline: float = 60.0) -> None:
        await asyncio.wait_for(self.done.wait(), timeout=deadline)

    async def close(self) -> None:
        await self.sio.disconnect()


# ── scenarios ───────────────────────────────────────────────────────────────
async def test_connect_rejected_without_token(server: str) -> None:
    """ADR-007: the namespace `connect` handler refuses a socket with no JWT —
    the exact contract the frontend's `auth:{token,clientId}` satisfies."""
    sio = socketio.AsyncClient(reconnection=False)
    with pytest.raises(socketio.exceptions.ConnectionError):
        await sio.connect(server, auth={"clientId": "x"}, namespaces=[NS], wait_timeout=10)
    assert not sio.connected


async def test_rest_register_then_ws_snapshot(server: str) -> None:
    """The real FE boot path: REST register → JWT → WS connect → join → the
    first authoritative `game_state` snapshot, asserted against the contract."""
    token, user_id = await _register(server)
    driver = SoloDriver(server, token, user_id, f"e2e-{uuid.uuid4().hex[:8]}")
    await driver.connect()
    assert driver.sio.connected
    try:
        await driver.join()
        # Wait until the human's own hand snapshot has arrived.
        for _ in range(100):
            if driver.seat is not None and len(driver.hand) > 0:
                break
            await asyncio.sleep(0.05)
        snapshots = [e for e in driver.events if e["event"] == "game_state"]
        assert snapshots, "no game_state received"
        _assert_envelope(snapshots[0], "game_state", driver.match_id)
        payload = snapshots[-1]["payload"]
        assert len(payload["hand"]) == 10  # dealt 10 of the 55-tile double-9 set
        assert len(payload["players"]) == 4
        assert all("tilesCount" in p and "isBot" in p for p in payload["players"])
        assert payload["turn"]["seat"] is not None
    finally:
        await driver.close()


async def test_full_solo_game_to_match_end(server: str) -> None:
    """Drive a whole solo match over the wire; assert it reaches `match_end`
    with a winner, that every board on the wire is a valid oriented chain, and
    that opponent tile counts are surfaced for the UI."""
    token, user_id = await _register(server)
    driver = SoloDriver(server, token, user_id, f"e2e-{uuid.uuid4().hex[:8]}")
    await driver.connect()
    try:
        await driver.join()
        await driver.play_to_end(deadline=90)

        end = next(e for e in driver.events if e["event"] == "match_end")
        _assert_envelope(end, "match_end", driver.match_id)
        assert end["payload"]["winnerTeam"] in {"teamA", "teamB"}
        assert "kind" in end["payload"]  # propagated by runtime.py (reviewed diff)

        placed = [e for e in driver.events if e["event"] == "tile_placed"]
        assert placed, "no tiles were placed"
        for env in placed:
            _assert_chain(env["payload"]["board"])

        # ADR-011: every tile_placed carries the post-play hand count of the
        # seat that played, authoritative. It decreases monotonically per seat
        # *within a round*; a fresh round (board reset to just the opener) deals
        # 10 again, so the per-seat counts reset there too.
        last_count: dict[int, int] = {}
        for env in placed:
            p = env["payload"]
            board = p["board"]
            if len(board["tiles"]) == 1 and board["tiles"][0]["order"] == 0:
                last_count.clear()  # opener of a new round → counts reset
            seat, hc = p["bySeat"], p["handCount"]
            assert isinstance(hc, int) and 0 <= hc <= 10, p
            if seat in last_count:
                assert hc <= last_count[seat], f"seat {seat} count grew: {p}"
            last_count[seat] = hc

        # ADR-011: any pass surfaced over the wire is a well-formed envelope the
        # FE listener (now registered in SERVER_EVENTS) can render as "PASO".
        for env in (e for e in driver.events if e["event"] == "player_passed"):
            _assert_envelope(env, "player_passed", driver.match_id)
            assert env["payload"]["bySeat"] in {0, 1, 2, 3}

        # round_end carries the scoring summary the FE overlay renders.
        for env in (e for e in driver.events if e["event"] == "round_end"):
            assert {"points", "winnerTeam", "kind"} <= set(env["payload"])

        snap = next(e for e in driver.events if e["event"] == "game_state")["payload"]
        opponents = [p for p in snap["players"] if p["userId"] != user_id]
        assert len(opponents) == 3
        assert all(isinstance(p["tilesCount"], int) for p in opponents)
    finally:
        await driver.close()


async def test_illegal_move_emits_error(server: str) -> None:
    """A move the player does not hold is rejected with an `error` envelope —
    the trigger the dispatcher uses to roll back the optimistic hand."""
    token, user_id = await _register(server)
    driver = SoloDriver(server, token, user_id, f"e2e-{uuid.uuid4().hex[:8]}")
    # Suppress the auto-player so our deliberate bad move is the only action.
    driver._maybe_act = lambda board: asyncio.sleep(0)  # type: ignore[assignment]
    await driver.connect()
    try:
        await driver.join()
        for _ in range(100):
            if driver.seat is not None and driver.status == "PLAYING":
                break
            await asyncio.sleep(0.05)
        await driver.sio.emit(
            "play_tile",
            {"matchId": driver.match_id, "tileId": "0-0", "side": "left",
             "clientId": uuid.uuid4().hex},
            namespace=NS,
        )
        for _ in range(100):
            if any(e["event"] == "error" for e in driver.events):
                break
            await asyncio.sleep(0.05)
        err = next(e for e in driver.events if e["event"] == "error")
        _assert_envelope(err, "error", driver.match_id)
        assert "message" in err["payload"]
    finally:
        await driver.close()
