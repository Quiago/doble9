# Doble 9's — Frontend

React 19 + TypeScript + Vite + Phaser 3 SPA / PWA. See repo root
[`CLAUDE.md`](../CLAUDE.md) for the full spec and
[`docs/DEPLOY.md`](../docs/DEPLOY.md) for the complete deploy guide.

## Local development

```bash
npm ci
npm run dev       # http://localhost:5173 — uses MSW + WS-fake (.env.local)
npm run build     # tsc -b && vite build → ./dist (PWA + SW)
npm run preview   # serve ./dist locally
```

Copy `.env.example` → `.env.local`. Default is `VITE_USE_MOCKS=true` so the app
boots without the real backend.

## Deploy → Vercel (production)

The frontend ships to **Vercel** as a static SPA + PWA. Backend is a separate
Render service (ADR-008); both must be configured.

1. Vercel → **Add New** → **Project** → import this repo.
2. **Root Directory: repo root**, *not* `frontend/`. The root
   [`vercel.json`](../vercel.json) builds with
   `npm --prefix frontend ci && npm --prefix frontend run build` and outputs
   `frontend/dist`. Pointing the root at `frontend/` breaks the
   `@shared → ../shared/types` alias.
3. Environment variables (Production):

   | Var | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://<svc>.onrender.com` |
   | `VITE_WS_URL` | `wss://<svc>.onrender.com/game` |
   | `VITE_USE_MOCKS` | `false` |
   | `VITE_GEMINI_API_KEY` | (optional) |

4. Deploy. `vercel.json` SPA-rewrites all routes to `/index.html`; `sw.js`,
   `workbox-*.js`, `registerSW.js` and `manifest.webmanifest` are sent
   `no-cache`; hashed `/assets/*` and `/fonts/*` are `immutable`.

After the first deploy, add the Vercel origin to the backend's `CORS_ORIGINS`
and redeploy the backend.

See [`../docs/DEPLOY.md`](../docs/DEPLOY.md) for the full deploy checklist,
smoke tests, local production-parity build, and architecture pointers
(ADR-001/002/004/007/009).
