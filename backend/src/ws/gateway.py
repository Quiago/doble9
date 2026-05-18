# AGENT: Backend
"""Socket.IO `/game` gateway — thin transport over `MatchRuntime`.

Contract: `contracts/websocket.yml` (+ ADR-004, ADR-006). Per ADR-006
`/game` is the Socket.IO **namespace**; the Engine.IO transport path
stays the default `/socket.io`. All handlers register and all emits go
on the `/game` namespace. Every server→client message is the
`{event, matchId, payload, timestamp}` envelope the runtime builds.
"""

from __future__ import annotations

import contextlib
from typing import Any

import socketio

from src.core.config import Settings
from src.core.security import TokenError, decode_token
from src.ws.registry import MatchRegistry
from src.ws.runtime import DISCONNECT_GRACE_SECONDS, Dispatch, MatchRuntime

# ADR-006: Socket.IO namespace (NOT the Engine.IO path).
GAME_NS = "/game"


def _room(match_id: str) -> str:
    return f"match:{match_id}"


def build_gateway(registry: MatchRegistry, settings: Settings) -> socketio.AsyncServer:
    sio = socketio.AsyncServer(
        async_mode="asgi",
        cors_allowed_origins=settings.cors_origins,
    )
    sid_user: dict[str, str] = {}
    sid_match: dict[str, str] = {}

    async def _persist(rt: MatchRuntime) -> None:
        if registry._store is None:  # noqa: SLF001 - intentional internal hook
            return
        with contextlib.suppress(Exception):
            await registry._store.save(  # noqa: SLF001
                rt.match_id, dict(rt.sm.snapshot())
            )

    async def _flush(rt: MatchRuntime, disp: Dispatch, actor_sid: str) -> None:
        if disp.error is not None:
            await sio.emit("error", disp.error, to=actor_sid, namespace=GAME_NS)
            return
        room = _room(rt.match_id)
        for env in disp.public:
            await sio.emit(env["event"], env, room=room, namespace=GAME_NS)
        if disp.resend_state:
            for sid, uid in list(rt.sessions.items()):
                await sio.emit(
                    "game_state", rt.snapshot_envelope(uid), to=sid, namespace=GAME_NS
                )
        if disp.public or disp.resend_state:
            await _persist(rt)

    # ── connection (namespace /game) ─────────────────────────────────────
    @sio.on("connect", namespace=GAME_NS)
    async def connect(sid: str, environ: dict[str, Any], auth: dict[str, Any] | None) -> bool:
        token = (auth or {}).get("token")
        if not isinstance(token, str):
            return False
        try:
            payload = decode_token(token)
        except TokenError:
            return False
        sub = payload.get("sub")
        if not isinstance(sub, str):
            return False
        sid_user[sid] = sub
        return True

    @sio.on("disconnect", namespace=GAME_NS)
    async def disconnect(sid: str) -> None:
        user_id = sid_user.pop(sid, None)
        match_id = sid_match.pop(sid, None)
        if user_id is None or match_id is None:
            return
        rt = registry.get(match_id)
        if rt is None:
            return
        rt.unbind(sid)
        env = rt.disconnected_event(user_id)
        if env is None:
            return
        await sio.emit(
            "player_disconnected", env, room=_room(match_id), namespace=GAME_NS
        )
        seat = env["payload"]["seat"]

        async def _grace() -> None:
            await sio.sleep(DISCONNECT_GRACE_SECONDS)
            if any(u == user_id for u in rt.sessions.values()):
                return  # reconnected within the window
            disp = rt.substitute_bot(seat)
            await _flush(rt, disp, sid)

        sio.start_background_task(_grace)

    # ── client → server (namespace /game) ────────────────────────────────
    @sio.on("join_lobby", namespace=GAME_NS)
    async def join_lobby(sid: str, data: dict[str, Any]) -> None:
        user_id = sid_user.get(sid)
        match_id = data.get("matchId")
        if user_id is None or not isinstance(match_id, str):
            await sio.emit(
                "error", _err(match_id, "bad_request", "missing matchId"),
                to=sid, namespace=GAME_NS,
            )
            return
        rt = registry.get_or_create_solo(match_id, user_id)
        await sio.enter_room(sid, _room(match_id), namespace=GAME_NS)
        rt.bind(sid, user_id)
        sid_match[sid] = match_id
        for env in rt.join_events(user_id, data.get("sinceActionAt")):
            await sio.emit(env["event"], env, to=sid, namespace=GAME_NS)
        await sio.emit(
            "player_joined", rt.player_joined_event(user_id),
            room=_room(match_id), namespace=GAME_NS,
        )

    @sio.on("start_match", namespace=GAME_NS)
    async def start_match(sid: str, data: dict[str, Any]) -> None:
        rt, user_id = _ctx(sid, data, sid_user, registry)
        if rt is None or user_id is None:
            return
        await _flush(rt, rt.apply_start(user_id), sid)

    @sio.on("play_tile", namespace=GAME_NS)
    async def play_tile(sid: str, data: dict[str, Any]) -> None:
        rt, user_id = _ctx(sid, data, sid_user, registry)
        if rt is None or user_id is None:
            return
        disp = rt.apply_play(
            user_id, data["tileId"], data["side"], client_id=data.get("clientId")
        )
        await _flush(rt, disp, sid)

    @sio.on("pass_turn", namespace=GAME_NS)
    async def pass_turn(sid: str, data: dict[str, Any]) -> None:
        rt, user_id = _ctx(sid, data, sid_user, registry)
        if rt is None or user_id is None:
            return
        await _flush(rt, rt.apply_pass(user_id, client_id=data.get("clientId")), sid)

    @sio.on("send_chat", namespace=GAME_NS)
    async def send_chat(sid: str, data: dict[str, Any]) -> None:
        rt, user_id = _ctx(sid, data, sid_user, registry)
        if rt is None or user_id is None:
            return
        await _flush(rt, rt.apply_chat(user_id, str(data.get("message", ""))), sid)

    @sio.on("player_ready", namespace=GAME_NS)
    async def player_ready(sid: str, data: dict[str, Any]) -> None:
        # Solo M1 has no lobby gate; ack as joined. Multiplayer = M2.
        rt, user_id = _ctx(sid, data, sid_user, registry)
        if rt is None or user_id is None:
            return
        await sio.emit(
            "player_joined", rt.player_joined_event(user_id),
            room=_room(rt.match_id), namespace=GAME_NS,
        )

    @sio.on("request_tile", namespace=GAME_NS)
    async def request_tile(sid: str, data: dict[str, Any]) -> None:
        # No boneyard draw in this ruleset (pass when blocked).
        await sio.emit(
            "error",
            _err(data.get("matchId"), "unsupported", "request_tile not used"),
            to=sid, namespace=GAME_NS,
        )

    return sio


def _err(match_id: Any, code: str, message: str) -> dict[str, Any]:
    return {
        "event": "error",
        "matchId": match_id if isinstance(match_id, str) else "",
        "payload": {"code": code, "message": message},
        "timestamp": 0,
    }


def _ctx(
    sid: str,
    data: dict[str, Any],
    sid_user: dict[str, str],
    registry: MatchRegistry,
) -> tuple[MatchRuntime | None, str | None]:
    user_id = sid_user.get(sid)
    match_id = data.get("matchId")
    if user_id is None or not isinstance(match_id, str):
        return None, None
    return registry.get(match_id), user_id
