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
import uuid
from datetime import datetime
from typing import Any

import socketio

from src.core.config import Settings
from src.core.db import get_sessionmaker
from src.core.security import TokenError, decode_token
from src.models import Match, MatchPlayer
from src.repositories.sql import SqlMatchRepository, SqlStatsRepository
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

    async def _complete_and_save_match(rt: MatchRuntime) -> None:
        async with get_sessionmaker()() as session:
            try:
                match_repo = SqlMatchRepository(session)
                stats_repo = SqlStatsRepository(session)

                match_id = rt.match_id
                try:
                    m_uuid = uuid.UUID(match_id)
                except ValueError:
                    # Ignore non-UUID match IDs (e.g. mock-match)
                    return

                m_row = await match_repo.get_by_id(match_id)
                winner_team = "teamA" if rt.sm.scores["teamA"] >= rt.sm.target_score else "teamB"
                final_scores = dict(rt.sm.scores)

                if m_row is None:
                    # Create match and player records if they don't exist
                    m = Match(
                        id=m_uuid,
                        room_code="SOLO",
                        mode=rt.mode,
                        status="FINISHED",
                        target_score=rt.sm.target_score,
                        ended_at=datetime.utcnow(),
                        winner_team=winner_team,
                        final_scores=final_scores,
                    )
                    session.add(m)
                    await session.flush()
                    for seat, p in rt.sm.players.items():
                        if not p.is_bot:
                            try:
                                u_uuid = uuid.UUID(p.user_id)
                                session.add(
                                    MatchPlayer(
                                        match_id=m_uuid,
                                        user_id=u_uuid,
                                        team="teamA" if seat % 2 == 0 else "teamB",
                                        seat=seat,
                                        is_bot=False,
                                    )
                                )
                            except ValueError:
                                pass
                    await session.flush()
                else:
                    await match_repo.finish_match(
                        match_id,
                        winner_team=winner_team,
                        final_scores=final_scores,
                    )

                # Update stats for human players
                for seat, p in rt.sm.players.items():
                    if p.is_bot:
                        continue
                    try:
                        u_uuid = uuid.UUID(p.user_id)
                    except ValueError:
                        continue

                    player_team = "teamA" if seat % 2 == 0 else "teamB"
                    won = player_team == winner_team
                    xp_gain = 150 if won else 50
                    coins_gain = 50 if won else 15
                    lp_gain = 15 if won else 5

                    await stats_repo.update_after_match(
                        user_id=p.user_id,
                        won=won,
                        points=rt.sm.scores.get(player_team, 0),
                        xp_gain=xp_gain,
                        coins_gain=coins_gain,
                        league_points_gain=lp_gain,
                    )
                await session.commit()
            except Exception as e:
                await session.rollback()
                print(f"Error saving match {rt.match_id} results to DB: {e}")

    async def _flush(rt: MatchRuntime, disp: Dispatch, actor_sid: str) -> None:
        if disp.error is not None:
            await sio.emit("error", disp.error, to=actor_sid, namespace=GAME_NS)
            return
        room = _room(rt.match_id)
        for env in disp.public:
            await sio.emit(env["event"], env, room=room, namespace=GAME_NS)
        if disp.resend_state:
            for sid, uid in list(rt.sessions.items()):
                await sio.emit("game_state", rt.snapshot_envelope(uid), to=sid, namespace=GAME_NS)
        if disp.public or disp.resend_state:
            await _persist(rt)

        if rt.sm.status == "FINISHED":
            sio.start_background_task(_complete_and_save_match, rt)

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
        await sio.emit("player_disconnected", env, room=_room(match_id), namespace=GAME_NS)
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
                "error",
                _err(match_id, "bad_request", "missing matchId"),
                to=sid,
                namespace=GAME_NS,
            )
            return
        rt = registry.get_or_create_solo(match_id, user_id)
        await sio.enter_room(sid, _room(match_id), namespace=GAME_NS)
        rt.bind(sid, user_id)
        sid_match[sid] = match_id
        is_new_solo = rt.mode == "solo" and rt.sm.status == "LOBBY"
        for env in rt.join_events(user_id, data.get("sinceActionAt")):
            await sio.emit(env["event"], env, to=sid, namespace=GAME_NS)
        await sio.emit(
            "player_joined",
            rt.player_joined_event(user_id),
            room=_room(match_id),
            namespace=GAME_NS,
        )
        if is_new_solo:
            await _flush(rt, rt.apply_start(user_id), sid)

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
        disp = rt.apply_play(user_id, data["tileId"], data["side"], client_id=data.get("clientId"))
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
            "player_joined",
            rt.player_joined_event(user_id),
            room=_room(rt.match_id),
            namespace=GAME_NS,
        )

    @sio.on("request_tile", namespace=GAME_NS)
    async def request_tile(sid: str, data: dict[str, Any]) -> None:
        # No boneyard draw in this ruleset (pass when blocked).
        await sio.emit(
            "error",
            _err(data.get("matchId"), "unsupported", "request_tile not used"),
            to=sid,
            namespace=GAME_NS,
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
