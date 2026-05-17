# ADR-005 — Design tokens reconciliation & schema additions

- **Status:** Accepted
- **Date:** 2026-05-17
- **Owner:** Architect
- **Affects:** Frontend, Backend, Architect

## Context

The Claude Design bundle (vendored `/docs/design-reference/`) is the real
visual deliverable. Its tokens diverge from `CLAUDE.md §3`. Separately, the
auth flow (`CLAUDE.md §5.4` register/login) needs a column absent from the
`CLAUDE.md §7` schema.

## Decision

1. **The design bundle wins on all visual matters.** Authoritative tokens
   are catalogued in `docs/plans/design-system.md`. Adopt verbatim:
   - `--negro #0D0D0D` (not `#000000`), `--madera #3A2416`,
     `--error #E74C3C` (not `#C0392B`).
   - Pips = 9 **spherical 3-stop** gradients `{base,highlight,shadow}`
     (not flat) — see `DominoTile.jsx`.
   - Logo = **Montserrat 900 italic + gold gradient text** (no Brush
     Script).
   - **13 screens**, not 14 (`splash-landing`, `profile-settings`,
     `results-league` each combine two).
2. **`CLAUDE.md §3` is superseded** by `docs/plans/design-system.md`.
   `CLAUDE.md` is not rewritten here (it is a single malformed blob;
   reformatting is out of scope and risky) — this ADR + design-system.md
   are the controlling references. Agents follow design-system.md.
3. **Schema addition:** `users.password_hash TEXT` added in migration
   `0001_initial_schema.py` (absent from `CLAUDE.md §7` but required for
   JWT auth, `CLAUDE.md §5.4`). Passwords stored via passlib bcrypt; never
   returned by the API (`User` schema in openapi.yml has no password field).

## Consequences

- (+) Single visual source of truth; no agent guesses tokens.
- (+) Auth is implementable without a follow-up migration.
- (−) `CLAUDE.md §3/§7` now intentionally diverges from reality; readers
  must defer to this ADR and `design-system.md`. Documented in
  `docs/plans/README.md`.
