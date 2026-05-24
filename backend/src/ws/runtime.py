# AGENT: Backend
"""`MatchRuntime` — authoritative live match over the wire.

Wraps `MatchStateMachine`, drives bot seats, keeps the ADR-004 ordered
event buffer, and serves reconnect (delta replay or full snapshot). No
Socket.IO here — the gateway just forwards `Dispatch` results, so this is
unit-testable without a server.
"""

from __future__ import annotations

import random
import time
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from src.core.redis import RedisMatchStore
from src.game.state_machine import MatchStateMachine, Player, Result
from src.services.bot_service import BotDifficulty, bot_take_turn

Envelope = dict[str, Any]

# ADR-004: bounded per-match ordered buffer; snapshot beyond it.
BUFFER_SIZE = 100
DISCONNECT_GRACE_SECONDS = 30
# Safety bound on one bot-driving sweep. The state machine guarantees
# termination; this only guards against an unforeseen loop. Generous so a
# fully bot-substituted match can finish in a single sweep.
_MAX_BOT_STEPS = 10_000

# Public (broadcast + buffered) events. game_state is the snapshot path,
# never buffered (ADR-004: replay deltas OR send full snapshot).
_PUBLIC = {
    "tile_placed",
    "turn_changed",
    "special_play",
    "chat_message",
    "round_end",
    "match_end",
    "player_disconnected",
    "player_joined",
}


@dataclass(slots=True)
class Dispatch:
    """What the gateway must emit for one client action."""

    public: list[Envelope] = field(default_factory=list)
    error: Envelope | None = None
    # After round/match transitions every session needs a fresh private
    # snapshot (new hands). Gateway sends `game_state` per session.
    resend_state: bool = False


class MatchRuntime:
    def __init__(
        self,
        match_id: str,
        players: list[Player],
        *,
        mode: str = "solo",
        target_score: int = 100,
        rng: random.Random | None = None,
        clock: Callable[[], float] = time.time,
        store: RedisMatchStore | None = None,
        bot_difficulty: BotDifficulty = BotDifficulty.NORMAL,
    ) -> None:
        self.match_id = match_id
        self.mode = mode
        self._rng = rng or random.Random()
        self._clock = clock
        self._store = store
        self._difficulty = bot_difficulty
        self.sm = MatchStateMachine(
            match_id,
            players,
            target_score=target_score,
            rng=self._rng,
            clock=clock,
        )
        self.sessions: dict[str, str] = {}  # sid -> user_id
        self._buffer: deque[Envelope] = deque(maxlen=BUFFER_SIZE)
        self._seen_client_ids: set[str] = set()
        self._last_ts = 0

    # ── clock / envelopes ────────────────────────────────────────────────
    def _next_ts(self) -> int:
        ts = int(self._clock() * 1000)
        if ts <= self._last_ts:
            ts = self._last_ts + 1
        self._last_ts = ts
        return ts

    def _env(self, event: str, payload: dict[str, Any]) -> Envelope:
        return {
            "event": event,
            "matchId": self.match_id,
            "payload": payload,
            "timestamp": self._next_ts(),
        }

    def _publish(self, env: Envelope) -> None:
        if env["event"] in _PUBLIC:
            self._buffer.append(env)

    # ── sessions ─────────────────────────────────────────────────────────
    def _seat_of_user(self, user_id: str) -> int | None:
        for seat, p in self.sm.players.items():
            if p.user_id == user_id:
                return seat
        return None

    def bind(self, sid: str, user_id: str) -> None:
        self.sessions[sid] = user_id
        seat = self._seat_of_user(user_id)
        if seat is not None:
            self.sm.players[seat].connected = True

    def unbind(self, sid: str) -> str | None:
        user_id = self.sessions.pop(sid, None)
        if user_id is None:
            return None
        if not any(u == user_id for u in self.sessions.values()):
            seat = self._seat_of_user(user_id)
            if seat is not None:
                self.sm.players[seat].connected = False
        return user_id

    # ── snapshots / reconnect (ADR-004) ──────────────────────────────────
    def snapshot_envelope(self, user_id: str | None) -> Envelope:
        return self._env("game_state", dict(self.sm.snapshot(for_user_id=user_id)))

    def join_events(self, user_id: str, since: int | None) -> list[Envelope]:
        """Delta replay if the anchor is still inside the buffer, else a
        full private snapshot (ADR-004)."""
        if since is not None and self._buffer and self._buffer[0]["timestamp"] <= since:
            return [e for e in self._buffer if e["timestamp"] > since]
        return [self.snapshot_envelope(user_id)]

    # ── result translation ───────────────────────────────────────────────
    def _translate(self, result: Result, acting_seat: int | None) -> tuple[list[Envelope], bool]:
        out: list[Envelope] = []
        resend = False
        ev = result.event
        payload = result.payload

        if ev == "tile_placed":
            out.append(
                self._env(
                    "tile_placed",
                    {
                        "bySeat": payload["bySeat"],
                        "tile": payload["tile"],
                        "side": payload["side"],
                        "board": payload["board"],
                    },
                )
            )
            for sp in result.specials:
                out.append(
                    self._env(
                        "special_play",
                        {
                            "type": sp,
                            "bySeat": payload["bySeat"],
                        },
                    )
                )
            out.append(self._env("turn_changed", {"turn": payload["turn"]}))
        elif ev == "turn_changed":
            out.append(self._env("turn_changed", {"turn": payload["turn"]}))
        elif ev == "player_passed":
            out.append(self._env("player_passed", {"bySeat": acting_seat}))
            out.append(self._env("turn_changed", {"turn": payload["turn"]}))
        elif ev == "round_end":
            out.append(
                self._env(
                    "round_end",
                    {
                        "points": payload["points"],
                        "winnerTeam": payload["winnerTeam"],
                        "scores": payload["scores"],
                    },
                )
            )
            for sp in result.specials:
                out.append(
                    self._env(
                        "special_play",
                        {
                            "type": sp,
                            "bySeat": acting_seat if acting_seat is not None else 0,
                        },
                    )
                )
            resend = True
        elif ev == "match_end":
            out.append(
                self._env(
                    "match_end",
                    {
                        "winnerTeam": payload["winnerTeam"],
                        "scores": payload["scores"],
                    },
                )
            )
            for sp in result.specials:
                out.append(
                    self._env(
                        "special_play",
                        {
                            "type": sp,
                            "bySeat": acting_seat if acting_seat is not None else 0,
                        },
                    )
                )
            resend = True
        elif ev == "game_state":
            resend = True  # e.g. start(): everyone needs fresh hands

        for e in out:
            self._publish(e)
        return out, resend

    def _drive_bots(self, disp: Dispatch) -> None:
        for _ in range(_MAX_BOT_STEPS):
            seat = self.sm.turn_seat
            if self.sm.status != "PLAYING" or seat is None:
                return
            if not self.sm.players[seat].is_bot:
                return
            res = bot_take_turn(self.sm, seat, difficulty=self._difficulty, rng=self._rng)
            if not res.success:  # pragma: no cover - bot never plays illegally
                return
            envs, resend = self._translate(res, acting_seat=seat)
            disp.public.extend(envs)
            disp.resend_state = disp.resend_state or resend

    # ── actions ──────────────────────────────────────────────────────────
    def _dedup(self, client_id: str | None) -> bool:
        if client_id is None:
            return False
        if client_id in self._seen_client_ids:
            return True
        self._seen_client_ids.add(client_id)
        return False

    def apply_start(self, user_id: str) -> Dispatch:
        disp = Dispatch()
        result = self.sm.start()
        if not result.success:
            disp.error = self._env(
                "error",
                {
                    "code": "bad_state",
                    "message": result.error_message or "cannot start",
                },
            )
            return disp
        _, resend = self._translate(result, acting_seat=None)
        disp.resend_state = resend
        self._drive_bots(disp)
        return disp

    def apply_play(
        self, user_id: str, tile_id: str, side: str, *, client_id: str | None = None
    ) -> Dispatch:
        disp = Dispatch()
        if self._dedup(client_id):
            return disp  # idempotent re-send (ADR-004)
        seat = self._seat_of_user(user_id)
        result = self.sm.play_tile(user_id, tile_id, side)  # type: ignore[arg-type]
        if not result.success:
            disp.error = self._env(
                "error",
                {
                    "code": "illegal_move",
                    "message": result.error_message or "illegal move",
                },
            )
            return disp
        envs, resend = self._translate(result, acting_seat=seat)
        disp.public.extend(envs)
        disp.resend_state = resend
        self._drive_bots(disp)
        return disp

    def apply_pass(self, user_id: str, *, client_id: str | None = None) -> Dispatch:
        disp = Dispatch()
        if self._dedup(client_id):
            return disp
        seat = self._seat_of_user(user_id)
        result = self.sm.pass_turn(user_id)
        if not result.success:
            disp.error = self._env(
                "error",
                {
                    "code": "illegal_move",
                    "message": result.error_message or "cannot pass",
                },
            )
            return disp
        envs, resend = self._translate(result, acting_seat=seat)
        disp.public.extend(envs)
        disp.resend_state = resend
        self._drive_bots(disp)
        return disp

    def apply_chat(self, user_id: str, message: str) -> Dispatch:
        disp = Dispatch()
        seat = self._seat_of_user(user_id)
        if seat is None:
            disp.error = self._env(
                "error",
                {
                    "code": "forbidden",
                    "message": "not a participant",
                },
            )
            return disp
        env = self._env(
            "chat_message",
            {
                "bySeat": seat,
                "userId": user_id,
                "message": message[:240],
            },
        )
        self._publish(env)
        disp.public.append(env)
        return disp

    def player_joined_event(self, user_id: str) -> Envelope:
        seat = self._seat_of_user(user_id)
        env = self._env("player_joined", {"seat": seat, "userId": user_id})
        self._publish(env)
        return env

    def disconnected_event(self, user_id: str) -> Envelope | None:
        seat = self._seat_of_user(user_id)
        if seat is None:
            return None
        env = self._env(
            "player_disconnected",
            {
                "seat": seat,
                "userId": user_id,
                "timeoutSeconds": DISCONNECT_GRACE_SECONDS,
            },
        )
        self._publish(env)
        return env

    def substitute_bot(self, seat: int) -> Dispatch:
        """Disconnect grace expired: the seat is taken over by a bot
        (ADR-004). Solo or multiplayer alike — keeps the table alive.

        NOTE (Architect review): ADR-004 says solo MAY forfeit the round;
        we bot-substitute uniformly for table continuity. Flag if forfeit
        is preferred for `solo`.
        """
        disp = Dispatch()
        player = self.sm.players.get(seat)
        if player is None:
            return disp
        player.is_bot = True
        player.connected = False
        self._drive_bots(disp)
        return disp
