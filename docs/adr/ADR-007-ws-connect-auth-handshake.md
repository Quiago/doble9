# ADR-007 — WebSocket connect-time auth handshake

- **Status:** Accepted
- **Date:** 2026-05-23
- **Owner:** Architect
- **Affects:** Frontend, Backend
- **Trigger:** Live FE↔BE integration smoke before Vercel deploy revealed the
  Socket.IO `connect` auth shapes diverge.

## Context

`contracts/websocket.yml` documented the namespace (ADR-006) and every
message, but **never specified the connection-time `auth` payload**. Each
agent filled the gap differently:

- **Backend** (`src/ws/gateway.py` `connect`): reads `auth.token` (a JWT),
  decodes it, and **returns `False` (rejects the namespace) when the token is
  missing or invalid**.
- **Frontend** (`src/services/websocket.ts`): connected with
  `auth: { clientId }` — **no token**.

The mismatch was masked because the Frontend ran against mocks
(`VITE_USE_MOCKS=true`). Pointing the Frontend at the real backend (required
for deploy) would make every WS connection fail the namespace handshake — a
hard blocker for multiplayer/solo realtime.

This is an **Architect contract omission**, not an agent error: both
implementations were locally reasonable given an underspecified contract.

## Decision

The Socket.IO `auth` object sent on `connect` to namespace `/game` MUST be:

```ts
io(VITE_WS_URL, {
  path: "/socket.io",
  auth: {
    token: "<JWT from POST /auth/login | /auth/register>", // required
    clientId: "<stable per-device uuid>",                  // required
  },
});
```

- **`token`** (required) — authenticates the socket. The server's `connect`
  handler validates it (`decode_token`) and binds `sid → user_id`. Missing or
  invalid → connection refused.
- **`clientId`** (required) — stable per-device id, the reconnect anchor and
  the dedup key. Per-action messages continue to echo `clientId` in their
  payload (`play_tile`/`pass_turn`), which the runtime uses for idempotent
  replay (ADR-004). Carrying it in `auth` as well makes it available at
  connect time.

Frozen in `contracts/websocket.yml` (header ruling block).

## Implementation

- **Frontend** (changed): `auth: { token: useUserStore.getState().token,
  clientId: CLIENT_ID }`. The JWT already lives in `userStore` (localStorage
  key `d9.token`), set on login/register.
- **Backend** (no change): `connect` already reads `auth.token` correctly;
  validated by the live smoke (register → JWT → connect → `join_lobby` →
  `start_match` → bots autoplay, events `game_state`/`tile_placed`/
  `turn_changed` received).

## Consequences

- (+) Unblocks real-backend WS for both solo (M1) and future multiplayer.
- (+) No backend change; one small frontend change in `websocket.ts`.
- Contract change: `websocket.yml` documents the `auth` handshake. No
  `shared/types` change (auth payload is transport-level, not a domain type).
- **Applied by the Architect during integration** (agents idle). Frontend
  agent should review the `websocket.ts` diff on next session.
