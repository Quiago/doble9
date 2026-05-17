# ADR-006 — WS namespace ruling + integration boundary decisions

- **Status:** Accepted
- **Date:** 2026-05-17
- **Owner:** Architect
- **Affects:** Frontend, Backend
- **Trigger:** Backend agent flagged 4 boundary questions after Blocks A–F.

## Context

`websocket.yml` conflated the Engine.IO transport **path** with the
Socket.IO **namespace** (both written as `/game`). Backend mounted `/game`
as the Engine.IO path + default namespace; Frontend connects with
`path:"/socket.io"` + namespace `/game`. As-is, **connect fails** — the
only true FE↔BE integration blocker. Three further questions were raised.

## Decisions

### 1. WS path vs namespace (BLOCKING — resolved)

`/game` is the **Socket.IO namespace**. Engine.IO path = default
`/socket.io`. Frozen in `websocket.yml`.

- **Frontend:** already correct (`io(VITE_WS_URL, {path:"/socket.io"})`
  with `VITE_WS_URL=ws://localhost:8000/game` → namespace `/game`).
  No change.
- **Backend:** change required (~small):
  - `main.py`: drop `socketio_path="game"` → use default.
  - `gateway.py`: register handlers and `emit(...)` on
    `namespace="/game"`.

### 2. Disconnect handling in `solo` (non-blocking)

ADR-004 allowed round forfeit; Backend implemented uniform **bot
substitution**. **Ruling: keep bot substitution everywhere** (better UX,
single codepath). ADR-004 is amended in spirit — no forfeit path needed
for M1.

### 3. Multiplayer seating (non-blocking)

Real seating from `match_players` is **M2 scope**. M1 stays
human + 3 bots via the registry. `join_lobby { matchId }` contract is
unchanged. No action now.

### 4. CAPICUA / POLLONA as distinct `special_play` (non-blocking)

**Ruling: keep them as distinct `special_play.type` values**
(`DOUBLE_9 | CAPICUA | POLLONA`), already in `shared/types/game.d.ts`.
`CLAUDE.md §4.4` only binds the *animation* to `DOUBLE_9`; the extra
types are additive and FE may animate them later. Contract unchanged.

## Consequences

- (+) One blocking item; FE needs no change, BE needs a small mount/
  namespace fix on `be/*`.
- (+) Points 2–4 ratified — no rework, parallel work continues.
- Contract change: `websocket.yml` servers `pathname` → `/socket.io`,
  channel doc clarified. No `shared/types` change.
