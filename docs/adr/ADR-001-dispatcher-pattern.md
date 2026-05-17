# ADR-001 — Netflix-inspired Dispatcher pattern (Frontend)

- **Status:** Accepted
- **Date:** 2026-05-17
- **Owner:** Architect
- **Affects:** Frontend

## Context

The client mixes three input sources that all mutate game state: the
WebSocket server (authoritative remote changes), the Phaser engine (local
player gestures), and the React UI (menus, chat). Letting React and Phaser
talk to each other directly produces bidirectional spaghetti and race
conditions between optimistic local feedback and server truth.

## Decision

Adopt a single **Dispatcher** (variation of Netflix's Dispatcher +
Component API), implemented over Zustand in `frontend/src/store/`:

- One immutable **Store**; React subscribes to slices, Phaser scenes
  subscribe to game slices.
- All mutations flow as `Action { type, payload, meta }` through the
  Dispatcher's **Action Router**, which validates optimistically then
  forwards to the server over WS.
- The **server is authoritative**: server events reconcile/override
  optimistic state.
- React and Phaser **never call each other** — only emit Actions and read
  Store. This is the FE↔Phaser boundary (see ADR-002).

Canonical `Action`, `ClientMessage`, `ServerMessage` types live in
`shared/types/game.d.ts`.

## Consequences

- (+) Deterministic state, testable reducers, clean reconnect replay
  (ADR-004), single place to apply server truth.
- (−) Indirection overhead; every interaction is an action. Accepted —
  the decoupling is worth it for a real-time multiplayer game.
- Frontend plan Bloque A task 3 implements this before any screen.
