# ADR-002 — Phaser ↔ React integration & the design-bundle render decision

- **Status:** Accepted
- **Date:** 2026-05-17
- **Owner:** Architect
- **Affects:** Frontend, Architect

## Context

The Claude Design bundle (`HYXbXw8SLUoAXDmSPm3Xsg`, vendored in
`/docs/design-reference/`) implements the entire game — including the
playing table and tile drag-and-drop — in **pure React DOM with HTML5
`dataTransfer`**. `CLAUDE.md §4.2` instead mandates **Phaser 3** for the
game canvas (physics, particles, drag, the Pollona/Capicúa effects). These
conflict on how the table is rendered.

## Decision

**User decision (2026-05-17): render the game table in Phaser 3** — keep
`CLAUDE.md`. The React-DOM prototype is **not ported as-is**; it is the
**pixel-perfect visual target** the Phaser `TableScene` must reproduce.

Integration contract:

- React mounts Phaser in a `useEffect` inside `<div ref={gameContainer}>`.
  Scenes: `BootScene`, `TableScene`, `UIOverlayScene`.
- Phaser and React communicate **only via the Dispatcher** (ADR-001),
  never directly.
- Phaser reads design tokens through `getComputedStyle` so the canvas
  matches the CSS design system (`docs/plans/design-system.md`).
- Only the **`game` screen** uses canvas. The other 12 screens
  (`/docs/design-reference/screens/*`) are recreated in React/DOM.
- HTML5 drag-and-drop in the prototype → Phaser input events; emit
  `TILE_PLAYED` action; server authoritative.

## Consequences

- (+) Keeps the spec's animation/particle ceiling (Pollona, slam, coins).
- (−) Higher effort than porting DOM; the prototype's layout must be
  re-derived inside the canvas. Mitigated: `game-screen.jsx` +
  `DominoTile.jsx` are the exact visual reference.
- ADR-005 reconciles the remaining (non-render) design discrepancies.
