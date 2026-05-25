# ADR-009 — Auth route guard (the real cause of "missing bearer token")

- **Status**: Accepted
- **Date**: 2026-05-25
- **Deciders**: Architect (reported by Frontend during integration testing)
- **Related**: [ADR-007](ADR-007-ws-connect-auth-handshake.md) (WS connect auth)

## Context

After the gameplay fixes, the app still failed for an unauthenticated user with:

```
POST http://localhost:8000/matches → 401 (Unauthorized)
ApiException: missing bearer token   (Setup.tsx → handleStartGame)
```

This is **not** a backend bug. The backend correctly rejects an unauthenticated
`POST /matches` (verified: `curl` with no token → `401 {"code":"unauthorized",
"message":"missing bearer token"}`). `services/api.ts` already attaches
`Authorization: Bearer <token>` whenever `userStore.token` is set. The 401
means **there was no token** — the user reached the match-creation flow without
ever authenticating.

### Root cause

Authentication is gated in exactly one place: the **Play** button on
`screens/Landing.tsx` (`handlePlay → if (!isAuthed) setShowAuth(true)`). But:

1. **Splash bypasses Landing.** Boot navigates straight to `/menu`
   (`[d9:route] → /menu` in the logs), so the Landing gate never runs.
2. **No route is guarded.** `/menu`, `/play/solo`, `/play/match/:id`,
   `/profile/*`, etc. are all directly reachable in `App.tsx` with no auth
   check. Deep links and the splash redirect both land inside the app
   unauthenticated.

So a user clicks through `/menu → /play/solo → ¡A JUGAR!`, which calls
`api.createMatch()` with `token === null` → 401.

A secondary issue compounds the confusion: `Setup.tsx`'s catch reads
`err?.response?.data?.detail` (an axios shape), but our client throws
`ApiException` with `.status` / `.body` (`{code, message}`). The real message is
discarded and the user always sees the generic *"Error al crear la partida"*.

## Decision

Introduce a **route-level `<RequireAuth>` guard** (Frontend) wrapping every
protected route. When `!isAuthed`, it does not render the screen; it presents
the `AuthModal` (or redirects to `/welcome`). Public routes stay open: `/`
(Splash) and `/welcome` (Landing). This makes authentication a property of the
route table, not of a single button — so the splash redirect, deep links, and
in-app navigation are all covered by one invariant.

`AuthBootstrap` (cold-reload `token → /auth/me` hydration) already exists and is
complementary: it restores a *valid* session; the guard handles the *absent*
one.

### Boundary note

Per CLAUDE.md, route/screen code is **Frontend territory**. This ADR is the
Architect ruling + the contract for the fix; the Frontend agent applies the
code change and adds the CHANGELOG entry in the same commit.

## Proposed patch (Frontend applies)

`App.tsx` — wrap protected routes:

```tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { isAuthed } = useAuth();
  const loc = useLocation();
  if (!isAuthed) {
    // Send the user to Landing, which owns the AuthModal; remember intent.
    return <Navigate to="/welcome" replace state={{ from: loc.pathname }} />;
  }
  return children;
}

// Protected routes become, e.g.:
<Route path="/menu" element={<RequireAuth><MainMenu /></RequireAuth>} />
<Route path="/play/solo" element={<RequireAuth><Setup /></RequireAuth>} />
<Route path="/play/match/:id" element={<RequireAuth><GameTable /></RequireAuth>} />
// …profile, settings, store, league, tournament, results, lobby, tutorial
```

`Landing.tsx` — after a successful auth, honor the remembered destination:

```tsx
const loc = useLocation();
const dest = (loc.state as { from?: string })?.from ?? "/menu";
// in AuthModal onSuccess: navigate(dest, { replace: true });
```

Also fix the error surface in `Setup.tsx` so backend messages reach the user:

```tsx
} catch (err) {
  const msg = err instanceof ApiException ? err.body.message : "Error al crear la partida";
  useUiStore.getState().toast(msg, "error");
}
```

## Consequences

- **Positive**: one enforced invariant; no protected screen is reachable
  without a token; deep links and the splash redirect are covered; real error
  messages surface.
- **Negative / follow-up**: confirm Splash's intended first stop — if Splash
  should land on `/welcome` (not `/menu`) for new users, that is a small
  additional change. The guard makes the app correct either way.

## Verification

The over-the-wire suite (`backend/tests/integration/`, `make test-e2e`)
asserts the authenticated path the guard protects: REST register → JWT → WS
`/game` connect with `auth:{token}` → solo match to `match_end`. The negative
case — connect refused without a token — is `test_connect_rejected_without_token`.
