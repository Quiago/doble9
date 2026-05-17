# ADR-004 — WebSocket reconnect protocol

- **Status:** Accepted
- **Date:** 2026-05-17
- **Owner:** Architect
- **Affects:** Frontend, Backend (both must implement to this contract)
- **Blocks:** M2 (multiplayer)

## Context

`CLAUDE.md §15`: the most common multiplayer bug is "player drops for 2s
and the whole table breaks." FE and BE must agree on reconnect semantics
**before** implementing multiplayer.

## Decision

**Authoritative state in Redis, monotonic action anchor, delta-or-snapshot
replay.**

- Server keeps per-match `GameState` in Redis (`match:{id}`, TTL 24h,
  `CLAUDE.md §5.2`) with `lastActionAt` (epoch ms), bumped on every
  authoritative mutation.
- Each authoritative event the server emits carries `timestamp`
  (server clock). The client persists the highest applied `lastActionAt`.
- **On reconnect** the client emits `join_lobby { matchId, sinceActionAt }`.
  Server behaviour:
  - `sinceActionAt` present and within the retained event buffer →
    replay the missed ordered events.
  - Otherwise → send a full `game_state` snapshot (recipient's private
    `hand` included only in their own copy).
- **Optimistic client actions** are buffered locally with a `clientId`
  (in `Action.meta`); on reconnect, un-acked actions are re-sent and
  deduplicated server-side by `clientId`.
- **Disconnect grace:** server broadcasts `player_disconnected
  { seat, timeoutSeconds }`. On timeout the seat is bot-substituted (or
  the round forfeited for `solo`). Reconnect within the window restores
  the seat seamlessly.
- REST fallback: `GET /matches/{id}` returns the same `GameState` for
  cold reloads (no socket).

## Consequences

- (+) A 2s drop replays a small delta; full snapshot only when the buffer
  is exceeded.
- (+) Idempotent via `clientId` — safe action re-send.
- (−) Server must retain an ordered per-match event buffer (bounded;
  snapshot beyond it). Buffer size is a tuning parameter, default 100
  events.
- FE: `services/websocket.ts` implements buffer + anchor. BE: socket
  handlers + Redis. Contract frozen in `contracts/websocket.yml`.
