# ADR-012 — Deploy hardening (Render + Vercel)

- **Status:** Accepted
- **Date:** 2026-05-28
- **Owner:** Architect
- **Affects:** Backend (deploy, CORS, proxy), Frontend (build, MSW gating),
  Infra (Make/Docker parity)
- **Trigger:** Pre-flight audit of the deploy path defined in ADR-008 found
  five gaps blocking a clean first launch: CORS does not admit Vercel
  preview origins, the FastAPI app is not configured for Render's proxy,
  `make` and `docker run` diverged on Postgres port, MSW could leak into the
  prod bundle, and the consolidated `.env.example` did not mention
  `VITE_USE_MOCKS`.

## Context

ADR-008 froze the topology (FE → Vercel, BE → Render Docker, Postgres 16 +
Redis 7 managed). The artifacts exist and are wired (`render.yaml`,
`backend/Dockerfile`, `vercel.json`, `docs/DEPLOY.md`). But ADR-008 stopped
at the topology. This ADR closes the gaps surfaced when actually rehearsing
the deploy:

- Vercel issues a stable production origin (`https://<project>.vercel.app`)
  **plus** a unique origin per preview deploy
  (`https://<project>-<hash>-<scope>.vercel.app`). With a flat
  comma-separated allowlist, every preview is blocked by CORS.
- Render fronts every service with a TLS-terminating proxy. Without
  `--proxy-headers`, uvicorn sees `http://` and the request's client IP is
  the proxy's. WS upgrades and secure cookies break.
- `docs/DEPLOY.md` §"Local production-parity" used Postgres `:5433`, but
  `backend/docker-compose.yml` maps `:5432` by default. Copy-pasting the
  recipe failed for anyone without a host-native Postgres.
- `frontend/src/main.tsx` reads `VITE_USE_MOCKS`, but the root
  `.env.example` omitted the variable. New devs forking the repo built with
  mocks accidentally enabled.
- MSW is ~80 kB minified. Static-imported it would ship in every prod
  bundle even when `VITE_USE_MOCKS=false`.

## Decisions

1. **CORS admits Vercel preview globs.** `CORS_ORIGINS` becomes a
   comma-separated list of entries that are either (a) exact origins or
   (b) patterns containing `*`. The backend converts each `*` entry into
   a regex anchored to the full origin and feeds them into Starlette's
   `allow_origin_regex`; exact entries still go through `allow_origins`.
   Production value: `https://doble9s.vercel.app,https://doble9s-*.vercel.app`.
2. **Proxy headers on.** The Dockerfile CMD adds
   `--proxy-headers --forwarded-allow-ips="*"`. Render's proxy is the only
   thing in front of the container, so trusting all forwarded IPs is
   correct here; revisit if we ever put a CDN in front.
3. **Make ↔ Docker parity.** New Makefile targets `docker-build`,
   `docker-run`, `docker-smoke` mirror the DEPLOY.md recipe exactly and
   honor `${POSTGRES_PORT:-5432}` so they line up with the local compose.
   DEPLOY.md §"Local production-parity" is corrected to `:5432`.
4. **MSW is dynamically imported.** `main.tsx` gates `./mocks/browser` behind
   `if (VITE_USE_MOCKS === 'true') { await import('./mocks/browser') }` so
   the prod bundle does not ship the worker code.
5. **`VITE_USE_MOCKS` is canonical.** Both `.env.example` files document it
   (`true` for dev, `false` for prod) and `docs/DEPLOY.md` §3 lists it on
   the production checklist.

## Consequences

- A new Vercel preview can talk to the production Render backend without an
  ops change — only PR-scoped previews matching the glob are allowed.
- The WS handshake survives Render's proxy: cookies marked `Secure` are
  honored, the `wss://` upgrade completes, and `X-Forwarded-For` makes it
  through to access logs.
- `make docker-smoke` becomes the local pre-flight: build the image, boot
  it against `make infra-up`, curl `/health`, register a smoke user. CI can
  pick this up later without a deploy roundtrip.
- Removing MSW from the prod bundle shaves ~80 kB gzipped off the first
  paint. The mock layer keeps working in dev/test exactly as before.
- The single-worker constraint from ADR-008 still stands. This ADR does
  **not** touch the `MatchRegistry` topology; M2 will.

## Non-goals

- **No** changes to the WS contract, REST contract, or
  `shared/types/*`.
- **No** introduction of a CDN, edge function, or alternative deploy
  target. Render + Vercel remain the only sanctioned path.
- **No** secret rotation policy (out of scope; flagged separately to the
  owner: a real `GEMINI_API_KEY` was found in `frontend/.env.local` —
  gitignored but worth rotating).

## Rollout

1. Architect: `.env.example` files, `docs/DEPLOY.md` port fix, this ADR.
2. Backend (rama `be/deploy-hardening`): CORS glob support, proxy headers
   in Dockerfile CMD, Make targets, real smoke against `make infra-up`.
3. Frontend (rama `fe/deploy-hardening`): dynamic MSW import + bundle
   verification, build with `VITE_USE_MOCKS=false`, FE deploy README,
   `vercel.json` headers reconciled against actual `dist/` output.
4. Architect merges both into `main` after diff review.

## References

- ADR-008 (topology + DSN normalization).
- ADR-007 (WS auth handshake — Bearer token survives the proxy).
- `docs/DEPLOY.md` (operator guide; this ADR is the rationale).
- `render.yaml`, `vercel.json`, `backend/Dockerfile`.
