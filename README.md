# Doble 9's — Dominó Cubano Online

Real-time multiplayer Cuban double-9 domino (PWA-first). "Premium casino meets
Cuban street culture": dark + gold, Muppet-style avatars, humorous animations.
Built by 3 agents in parallel (Frontend · Backend · Architect) under a single
authoritative spec (`CLAUDE.md`).

## Status — M1 Alpha integrated & deploy-ready

`main` is a single integrated repo, validated end-to-end:

- **Backend** Blocks A–F complete; `make check` green (96 tests). Live smoke
  against real Postgres + Redis: REST (auth/matches/users/store/leaderboard) +
  WebSocket (`/game`) solo match with bots autoplaying. Containerized
  (`backend/Dockerfile`) and run-verified.
- **Frontend** Blocks A–D + all 13 screens (P0–P3). `npm run build` green;
  PWA service worker + precache generated.
- **Integration** FE↔BE contract conformance proven; the two real blockers
  found and fixed (ADR-006 WS namespace, ADR-007 WS connect auth).
- **Deploy** Frontend → Vercel (`vercel.json`); Backend → Render/Railway
  (`render.yaml` + Dockerfile). See [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Architecture (one line each)

- **Frontend** — React 19 + TypeScript + Vite. Phaser 3 renders the table;
  React renders menus/HUD. A Netflix-style **Dispatcher** (Zustand) is the only
  bridge between them (ADR-001). CSS variables + BEM, no Tailwind. PWA.
- **Backend** — FastAPI (async) + python-socketio. **Server-authoritative**
  game state machine (Cuban double-9 rules). SQLAlchemy 2.0 async + Postgres 16,
  Redis for match state, JWT auth. `uv` for deps, `make` for every op.
- **Contracts** — `contracts/openapi.yml` (REST), `contracts/websocket.yml`
  (Socket.IO), `shared/types/*.d.ts` (TypeScript). The source of truth between
  agents; a boundary change needs an ADR.

```
React UI ─┐                         ┌─ FastAPI REST ─ Postgres
          ├─ Dispatcher ─ WS ─/game ┤
Phaser  ──┘   (Zustand)             └─ Socket.IO ─ MatchRuntime ─ Redis
```

## What each agent did / does

### Architect (owns `contracts/`, `shared/`, `docs/`, infra, integration)
- Wrote the contracts and shared types; froze them as the FE↔BE source of truth.
- Set up the monorepo, `uv`+`make` backend workflow, `docker-compose` infra,
  CI, and the git-worktree topology (one working dir per agent).
- Authored all ADRs and mediates every cross-agent boundary.
- **Did the integration**: merged `be/work` + `fe/work` into `main`, ran the
  live REST/WS/SQL smokes, and fixed the integration blockers (ADR-006/007/008).
- Owns deployment: `vercel.json`, `render.yaml`, `backend/Dockerfile`, env docs.
- Does **not** write React components or game logic.

### Frontend agent (owns `frontend/`)
- All 13 screens (Splash, Landing, Menu, Solo setup, Lobby, Game table,
  Tutorial, Profile, Settings, Store, Results, League, Tournament).
- Phaser 3 table: tile drag-and-drop, board chain, Pollona/Capicúa effects.
- Dispatcher + Zustand stores, WS transport with reconnect/offline buffer,
  audio engine (Howler), PWA (manifest + service worker), responsive/touch.
- CSS design system (tokens + BEM components). MSW mocks for offline dev.
- Does **not** write backend or DB code.

### Backend agent (owns `backend/`)
- Authoritative game core: tiles/board/rules/scoring + `MatchStateMachine`.
- REST API (11 endpoints, JWT), SQLAlchemy models + Alembic migration,
  Redis match store, Socket.IO `/game` gateway + `MatchRuntime` (reconnect,
  dedup, bot substitution).
- Heuristic bot (single-player M1); RL scaffold behind the optional `[rl]`
  extra (Phase 2). Gemini avatar wrapper.
- Does **not** write React or Phaser code.

## Feature inventory

| Area | Feature | State |
|------|---------|-------|
| Game | Cuban double-9 rules (deal 10+15, highest-double opens, tranque, scoring) | ✅ authoritative, tested |
| Game | Special plays DOUBLE_9 / CAPICUA / POLLONA | ✅ detected server-side |
| Solo | Human + 3 heuristic bots, server-driven turns | ✅ live-verified |
| Realtime | Socket.IO `/game`, rooms, reconnect + delta/snapshot replay (ADR-004) | ✅ |
| Auth | Register / login / me, JWT bearer | ✅ live-verified |
| REST | matches, users (stats/history), store (items/purchase), leaderboard | ✅ live-verified |
| UI | 13 screens, Phaser table, drag-drop, effects, audio | ✅ build green |
| PWA | Installable, offline app shell, asset runtime cache | ✅ |
| Bots (RL) | PPO self-play pipeline | 🟡 scaffold only (Phase 2) |
| Multiplayer | Real seating from `match_players`, lobby matchmaking | 🟡 M2 |
| Avatars | Gemini image generation | 🟡 wrapper ready, not wired to UI |

## Run locally

**Infra + backend** (in `backend/`, `uv`+`make` only — never raw uv/uvicorn):
```bash
cp .env.example .env       # if no .env yet
make infra-up              # Postgres 16 + Redis 7
make install
make migrate               # applies 0001_initial_schema
make dev                   # FastAPI + Socket.IO on :8000
```
> ⚠️ This machine runs a **native Postgres on 5432**. Use the container on 5433:
> set `POSTGRES_PORT=5433` and `DATABASE_URL=…@localhost:5433/doble9s` in
> `backend/.env`. The compose port is parameterized.

**Frontend** (in `frontend/`):
```bash
cp .env.example .env.local # if no .env.local yet
npm install
npm run dev                # Vite on :5173 (VITE_USE_MOCKS=true → offline)
```
Set `VITE_USE_MOCKS=false` to hit the real backend.

## Deploy

Frontend → **Vercel**, Backend → **Render/Railway**. Full runbook, env vars,
and gotchas: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Decisions of record (read before touching a boundary)

| ADR | Decision |
|-----|----------|
| 001 | Netflix Dispatcher pattern (FE) |
| 002 | Game renders in Phaser 3; React-DOM bundle is the visual target |
| 003 | Heuristic bot for M1; RL is optional `[rl]` extra (Phase 2) |
| 004 | WS reconnect: Redis state + action anchor + delta/snapshot replay |
| 005 | Design bundle wins on visuals; `users.password_hash` added |
| 006 | `/game` is the Socket.IO **namespace**; Engine.IO path = `/socket.io` |
| 007 | WS connect auth handshake: `auth: { token, clientId }` |
| 008 | Deploy topology + Postgres DSN normalization + single worker |

**No agent changes another's code or a shared boundary without an ADR.**
Git worktrees: `main` (Architect), `../doble9-be` (`be/work`),
`../doble9-fe` (`fe/work`). Architect reviews and merges to `main`.

Process: every functional change ships with its `CHANGELOG.md` entry in the
same commit (`docs/plans/README.md` → "REGLA OBLIGATORIA").
