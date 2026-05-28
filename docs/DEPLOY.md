# Deploy guide — Doble 9's

Two targets (ADR-008):

- **Frontend** → **Vercel** (static SPA + PWA on the CDN).
- **Backend** → **Render** (or Railway): a Docker container holding long-lived
  WebSocket connections, with managed Postgres 16 + Redis 7.

The backend **cannot** run on Vercel: it keeps live `MatchRuntime`s in process
and serves persistent Socket.IO connections — incompatible with serverless.

Deploy order: **backend first** (you need its public URL for the frontend env).

---

## 1. Backend → Render (Docker, three manual services)

Files: [`backend/Dockerfile`](../backend/Dockerfile),
[`render.yaml`](../render.yaml) (reference only on the free plan, see below).

> ⚠️ **Render's Blueprint flow is a paid feature.** On the free plan you
> cannot create services from `render.yaml`; you must provision the three
> services manually from the dashboard. `render.yaml` is kept in-tree as
> documentation and for future paid migration — its values (env vars, plan,
> health check path, Docker context) are the source of truth for what to
> click in the dashboard.

Provision in this order. The DB and Redis must exist before the Web Service
so their internal connection strings are available.

### 1.1 Postgres (managed)
1. **New + → Postgres**.
2. Name: `doble9s-db` · Database: `doble9s` · User: `doble9s` · Version:
   `16` · Plan: **Free**.
3. Once it's live, copy the **Internal Database URL**
   (`postgresql://doble9s:…@dpg-….oregon-postgres.render.com/doble9s`) —
   you'll paste it as `DATABASE_URL` in the Web Service. The app normalizes
   `postgresql://` → `postgresql+asyncpg://` at runtime (ADR-008
   `to_async_dsn`).

### 1.2 Key Value (Redis)
1. **New + → Key Value**.
2. Name: `doble9s-redis` · Plan: **Free** · Maxmemory policy:
   `allkeys-lru` (default is fine) · IP allow list: empty (private only).
3. Once it's live, copy the **Internal Redis URL**
   (`redis://red-….oregon-keyvalue.render.com:6379`) — paste it as
   `REDIS_URL`.

### 1.3 Web Service (Docker)
1. **New + → Web Service** → connect this GitHub repo.
2. Settings (these matter — defaults will fail):
   - **Runtime / Language:** **Docker** *(not Python; Python would
     autodetect at the repo root where `pyproject.toml` doesn't exist)*.
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Build Context Directory:** `backend`
   - **Branch:** `main`
   - **Plan:** **Starter** (persistent instance — Free spins down and
     kills the WebSocket; Starter keeps the container hot).
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** On
3. **Environment** tab — add these env vars:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | (Internal URL from §1.1) |
   | `REDIS_URL` | (Internal URL from §1.2) |
   | `SECRET_KEY` | a random ≥32-byte string (e.g. `openssl rand -hex 32`) |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
   | `CORS_ORIGINS` | `https://doble9s.vercel.app,https://doble9s-*.vercel.app` |
   | `GEMINI_API_KEY` | (your key, or leave blank — avatars are optional) |
4. **Create Web Service.** The container runs `alembic upgrade head` then
   starts uvicorn with `--proxy-headers` (single worker — see below).
   Verify: `curl https://<svc>.onrender.com/health` → `{"status":"ok"}`.

**Single worker, on purpose.** The WS `MatchRegistry` is in-process (M1), so
multiple workers/instances would fragment matches. Keep one instance until M2
moves the registry behind Redis + a Socket.IO Redis adapter.

### Common failure modes (free-plan dashboard flow)
- **Build log says `Using Python version …` / `No pyproject.toml found`**
  → you picked the **Python** runtime instead of **Docker**. Delete the
  service and recreate, choosing **Docker** in the runtime selector.
- **Build runs but `/health` 502s** → check the Dockerfile path
  (`backend/Dockerfile`) and build context (`backend`); if either is wrong
  the image builds but doesn't expose what Render expects.
- **`asyncpg.exceptions.InvalidPasswordError` / DSN errors** → make sure
  you pasted the **Internal** URL (not the External one) into
  `DATABASE_URL`. External URLs require SSL+credentials in a different
  shape.

### Railway alternative
Same Dockerfile, same single-worker rule. In the Railway dashboard: build
from `backend/Dockerfile`, add Postgres + Redis plugins, copy their URLs
into `DATABASE_URL` / `REDIS_URL`, set `SECRET_KEY` / `CORS_ORIGINS`.

---

## 2. Frontend → Vercel

File: [`vercel.json`](../vercel.json) (at the repo root, on purpose).

> ⚠️ **Both `installCommand` and `buildCommand` are pinned in `vercel.json`**
> and both use `cd frontend && …`, not `npm --prefix frontend …`. The
> `--prefix` flag only changes where `node_modules` is installed; it does
> NOT change `npm`'s cwd, so `npm --prefix frontend ci` reads
> `package-lock.json` from `/vercel/path0` (the repo root, where no lockfile
> exists) and fails with `EUSAGE: npm ci command can only install with an
> existing package-lock.json`. `cd frontend && npm ci` actually moves into
> the directory before running, which is what we want. Do not override
> these in the Vercel dashboard.

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
# Backend container (uses the live infra on :5432/:6379 — matches the
# default port in backend/docker-compose.yml; override to :5433 only if
# you set POSTGRES_PORT=5433 to dodge a host-native Postgres).
cd backend && docker build -t doble9s-backend .
docker run --rm --network host \
  -e PORT=8010 \
  -e DATABASE_URL='postgresql://doble9s:doble9s@localhost:5432/doble9s' \
  -e REDIS_URL='redis://localhost:6379/0' \
  -e SECRET_KEY='dev-only-please-use-32+bytes-in-prod' \
  doble9s-backend

# Or via Make (ADR-012): `make docker-build && make docker-run` honors
# ${POSTGRES_PORT} from your local .env automatically.

# Frontend production build + preview
cd frontend && npm run build && npm run preview
```
