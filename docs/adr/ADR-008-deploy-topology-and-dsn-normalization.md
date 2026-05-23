# ADR-008 — Deploy topology + Postgres DSN normalization

- **Status:** Accepted
- **Date:** 2026-05-23
- **Owner:** Architect
- **Affects:** Backend (deploy), Frontend (deploy)
- **Trigger:** Preparing the first real deploy (frontend → Vercel) surfaced
  three infra gaps: where the backend runs, the async-driver DSN footgun, and
  the single-worker constraint.

## Context

The app is split for deploy:

- **Frontend** is a static SPA + PWA → **Vercel** (CDN, instant rollbacks,
  preview deploys). Build from the repo root (`npm --prefix frontend …`) so
  the `@shared → ../shared/types` alias resolves; output `frontend/dist`.
- **Backend** holds long-lived Socket.IO connections and an **in-process**
  `MatchRegistry` → it cannot run on Vercel's serverless/edge model. It runs
  as a container (`backend/Dockerfile`) on **Render/Railway**, alongside
  managed Postgres 16 + Redis 7.

Two correctness traps were found:

1. **Async driver DSN.** Managed Postgres hands out `postgres://` /
   `postgresql://` URLs (sync drivers). SQLAlchemy's async engine *and* our
   Alembic env require `postgresql+asyncpg://`. Used as-is, the app boots but
   every DB call fails.
2. **Worker count.** `make run` previously used `--workers 4`. The WS
   `MatchRegistry` (`src/ws/registry.py`) keeps live `MatchRuntime`s in a
   per-process dict, so multiple workers fragment matches/rooms across
   processes. REST is Postgres-backed and would scale fine, but WS state is
   not shared.

## Decisions

1. **Deploy targets (frozen):** Frontend → Vercel (`/vercel.json` at repo
   root). Backend → Render/Railway via `backend/Dockerfile` (`/render.yaml`
   blueprint provided). Postgres 16 + Redis 7 are managed services.

2. **DSN normalization (`to_async_dsn`).** A single helper in
   `src/core/config.py` rewrites `postgres://` / `postgresql://` →
   `postgresql+asyncpg://` (already-async and non-Postgres URLs untouched).
   Applied in `Settings.database_url` (app) **and** `migrations/env.py`
   (Alembic, which reads raw `os.environ`). Lets a provider's
   `connectionString` be wired directly.

3. **Single worker until M2.** `make run` and the Docker `CMD` run **one**
   uvicorn worker. To scale out: move the registry behind Redis + a Socket.IO
   Redis adapter, then raise the worker/instance count. Documented inline in
   `Makefile` and `Dockerfile`.

4. **Migrations on deploy.** The container `CMD` runs `alembic upgrade head`
   before starting uvicorn, so schema is applied on every release.

## Consequences

- (+) Backend is one-command deployable; DB wiring is copy-paste safe.
- (+) Frontend builds on Vercel without the outside-root alias breaking.
- (−) Backend is single-instance for now (M1 acceptable; M2 must address it).
- Production env still requires: a strong `SECRET_KEY` (the dev default is
  15 bytes — JWT warns it is below the 32-byte HMAC minimum), `CORS_ORIGINS`
  set to the Vercel domain, and the frontend's `VITE_API_URL` / `VITE_WS_URL`
  pointed at the deployed backend with `VITE_USE_MOCKS=false`.
- Backend agent should review `config.py` / `env.py` / `Dockerfile` on next
  session (changes applied by Architect during integration; agents idle).
