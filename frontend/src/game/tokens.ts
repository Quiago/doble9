// game/tokens.ts — Phaser reads the CSS design tokens via getComputedStyle
// (CLAUDE.md §3, ADR-002). Single source of truth stays in tokens.css.
// AGENT: Frontend.
const root = () => getComputedStyle(document.documentElement);

export function token(name: string): string {
  return root().getPropertyValue(name).trim();
}

export function tokenNum(name: string): number {
  return parseFloat(token(name)) || 0;
}

/** `#RRGGBB` → 0xRRGGBB for Phaser tint/fill APIs. */
export function hex(name: string): number {
  const v = token(name);
  return parseInt(v.replace("#", ""), 16);
}

export interface PipColors {
  b: string;
  h: string;
  s: string;
}

/** Spherical pip palette for value 1..9 (DominoTile.jsx PIP_COLORS). */
export function pipColors(value: number): PipColors | null {
  if (value < 1 || value > 9) return null;
  return {
    b: token(`--pip-${value}-b`),
    h: token(`--pip-${value}-h`),
    s: token(`--pip-${value}-s`),
  };
}
