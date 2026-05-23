# Deploy guide — Doble 9's

Two targets (ADR-008):

- **Frontend** → **Vercel** (static SPA + PWA on the CDN).
- **Backend** → **Render** (or Railway): a Docker container holding long-lived
  WebSocket connections, with managed Postgres 16 + Redis 7.

The backend **cannot** run on Vercel: it keeps live `MatchRuntime`s in process
and serves persistent Socket.IO connections — incompatible with serverless.

Deploy order: **backend first** (you need its public URL for the frontend env).

---

## 1. Backend → Render (Docker)

Files: [`backend/Dockerfile`](../backend/Dockerfile),
[`render.yaml`](../render.yaml).

1. Push the repo to GitHub.
2. Render → **New +** → **Blueprint** → select the repo. Render reads
   `render.yaml` and provisions:
   - `doble9s-backend` (Docker web service, `healthCheckPath: /health`),
   - `doble9s-db` (Postgres 16),
   - `doble9s-redis` (Key Value / Redis).
3. Set the two `sync: false` env vars in the dashboard:
   - `CORS_ORIGINS` = your Vercel URL, e.g. `https://doble9s.vercel.app`
     (comma-separated for multiple).
   - `GEMINI_API_KEY` = your key (or leave blank; avatars are optional).
4. Deploy. The container runs `alembic upgrade head` then starts uvicorn
   (single worker — see below). Verify: `curl https://<svc>.onrender.com/health`
   → `{"status":"ok"}`.

Auto-wired env: `DATABASE_URL` (from the DB), `REDIS_URL` (from Redis),
`SECRET_KEY` (`generateValue: true`). The app normalizes the DB URL's
`postgresql://` to the `+asyncpg` driver at runtime (ADR-008 `to_async_dsn`),
so the provider's connection string works as-is.

**Single worker, on purpose.** The WS `MatchRegistry` is in-process (M1), so
multiple workers/instances would fragment matches. Keep one instance until M2
moves the registry behind Redis + a Socket.IO Redis adapter.

### Railway alternative
No blueprint file; set in the dashboard: build from `backend/Dockerfile`, add
Postgres + Redis plugins, copy their URLs into `DATABASE_URL` / `REDIS_URL`,
set `SECRET_KEY` / `CORS_ORIGINS`. Same Dockerfile, same single-worker rule.

---

## 2. Frontend → Vercel

File: [`vercel.json`](../vercel.json) (at the repo root, on purpose).

1. Vercel → **Add New** → **Project** → import the repo.
2. **Root Directory: leave as the repo root** (do *not* set it to `frontend/`).
   `vercel.json` builds with `npm --prefix frontend ci && npm --prefix frontend
   run build` and outputs `frontend/dist`. Building from the root keeps the
   `@shared → ../shared/types` alias resolvable; pointing the root at
   `frontend/` would break that import.
3. Environment variables (Production):
   | Var | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://<svc>.onrender.com` |
   | `VITE_WS_URL` | `wss://<svc>.onrender.com/game` |
   | `VITE_USE_MOCKS` | `false` |
   | `VITE_GEMINI_API_KEY` | (optional) |
4. Deploy. `vercel.json` rewrites all unmatched routes to `/index.html` (SPA
   deep links); static files (SW, assets, manifest) are served first. The
   service worker and `workbox-*.js` are sent `no-cache`; hashed `/assets/*`
   are `immutable`.

After the frontend URL exists, make sure it is in the backend's
`CORS_ORIGINS`, then redeploy the backend if you changed it.

---

## 3. Production checklist

- [ ] `SECRET_KEY` is strong (≥32 bytes). The dev default
      `change-me-in-production` is 15 bytes — PyJWT warns it is below the
      HMAC-SHA256 minimum. Render's `generateValue` handles this.
- [ ] `CORS_ORIGINS` = exact Vercel origin(s), no trailing slash.
- [ ] `VITE_WS_URL` uses `wss://` (not `ws://`) and ends in `/game`.
- [ ] `VITE_USE_MOCKS=false` in production.
- [ ] Backend `/health` returns 200; `/openapi.json` lists 11 endpoints.
- [ ] WS connects: browser console shows the socket online on the Game screen.
- [ ] Single backend instance (WS state is in-process until M2).
- [ ] 55 MB of art lives in `frontend/public/assets/` — consider **Git LFS**
      before the repo grows further (flagged; not blocking).

## 4. Smoke after deploy

```bash
API=https://<svc>.onrender.com
curl -s $API/health
# register → returns a JWT
curl -s -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d '{"username":"smoke","email":"smoke@x.co","password":"secret123"}'
```
Then open the Vercel URL, start a solo match, and confirm bots play
(WebSocket online, tiles placed).

---

## Local production-parity build

```bash
# Backend container (uses the live infra on :5433/:6379)
cd backend && docker build -t doble9s-backend .
docker run --rm --network host \
  -e PORT=8010 \
  -e DATABASE_URL='postgresql://doble9s:doble9s@localhost:5433/doble9s' \
  -e REDIS_URL='redis://localhost:6379/0' \
  -e SECRET_KEY='dev-only-please-use-32+bytes-in-prod' \
  doble9s-backend

# Frontend production build + preview
cd frontend && npm run build && npm run preview
```
