# Doble 9's — Backend

Server-authoritative Cuban double-9 domino backend (FastAPI + async
SQLAlchemy + Redis + python-socketio). All game logic is authoritative
here; the frontend is a renderer.

## Workflow

Deps via **uv**, everything else via **make** (never raw
`uv`/`uvicorn`/`pytest`/`alembic`). See `make help`.

```bash
cp .env.example .env
make install      # create venv + install deps
make check        # ruff + mypy(strict) + pytest  (CI gate)
make dev          # FastAPI on :8000
make infra-up     # Postgres 16 + Redis
```

## Layout

| Path | What |
|------|------|
| `src/game/` | Pure game core — tile, board, rules, scoring, state machine. No I/O. |
| `src/api/` | FastAPI REST routers (follows `contracts/openapi.yml`). |
| `src/models/` | SQLAlchemy 2.0 async models (mirror `CLAUDE.md §7`). |
| `src/core/` | Config, security, middleware. |
| `src/services/` | Match service, bots, Gemini. |
| `src/bots/` | RL scaffold (optional `[rl]` extra, Phase 2). |
| `tests/` | pytest — exhaustive on `src/game`. |

The `src/game` package is network/DB-free and is the most test-critical
piece of the product (`02-backend-plan.md`).
