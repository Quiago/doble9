# Doble 9's — Dominó Cubano Online

Real-time multiplayer Cuban double-9 domino (PWA-first). Premium casino +
Cuban street culture. Built by 3 agents in parallel under a Senior Architect.

## Status: Fase 0 + 1 complete (Architect) — FE & BE unblocked

The Architect has delivered the contracts and infrastructure. Frontend and
Backend agents can now work **in parallel**.

## Repo map

| Path | Owner | What |
|------|-------|------|
| `CLAUDE.md` | Architect | Original spec. **Superseded on visuals by `docs/plans/design-system.md` (ADR-005).** |
| `docs/plans/` | Architect | Orchestration + per-agent plans + design system |
| `docs/design-reference/` | Architect | Vendored Claude Design bundle — pixel-perfect target |
| `docs/adr/` | Architect | ADR-001..005 (decisions of record) |
| `contracts/openapi.yml` | Architect | REST contract (mirrors `shared/types/api.d.ts`) |
| `contracts/websocket.yml` | Architect | Realtime AsyncAPI (mirrors `shared/types/game.d.ts`) |
| `shared/types/` | Architect | FE↔BE TypeScript contract |
| `frontend/` | Frontend agent | React 19 + Phaser 3 + CSS vars |
| `backend/` | Backend agent | FastAPI, game logic, RL bots (uv + make) |

## Start the 3 terminals (CLAUDE.md §11)

```bash
# Terminal 1 — Architect (this one): reviews PRs, guards contracts.
#   Reads docs/plans/00-architect-plan.md

# Terminal 2 — Frontend
cd frontend            # see docs/plans/01-frontend-plan.md
# (Frontend agent: npm create vite@latest . , then build)

# Terminal 3 — Backend
cd backend             # see docs/plans/02-backend-plan.md
cp .env.example .env
make infra-up          # Postgres 16 + Redis 7 (docker compose)
make install
make migrate           # applies 0001_initial_schema
make dev               # FastAPI on :8000
```

Frontend points at `http://localhost:8000` / `ws://localhost:8000/game`
(see `.env.example`).

## Architect decisions of record (read before changing a boundary)

- **ADR-001** — Netflix Dispatcher pattern (FE).
- **ADR-002** — Game renders in **Phaser 3** (user decision); the React-DOM
  bundle is the visual target, not ported as-is.
- **ADR-003** — Heuristic bot for M1; RL is an optional `[rl]` extra, Phase 2.
- **ADR-004** — WS reconnect: Redis state + action anchor + delta/snapshot
  replay. **FE & BE must implement to this; blocks M2.**
- **ADR-005** — Design bundle wins on visuals; `users.password_hash` added.

**No agent changes another's code or a shared boundary without an ADR.**
Branches: `arch/*`, `fe/*`, `be/*`; Architect reviews and merges to `main`.

## Validate contracts (Architect)

```bash
npx @redocly/cli lint contracts/openapi.yml
npx @asyncapi/cli validate contracts/websocket.yml
```

Roadmap & testing strategy: `CLAUDE.md §12–13`, milestones in
`docs/plans/README.md`.
