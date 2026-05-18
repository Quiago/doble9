// game/textures.ts — pixel-perfect tile textures via canvas 2D, mirroring
// design-reference/DominoTile.jsx (baquelita body + spherical pips). Real
// radial/linear gradients (Phaser Graphics can't), registered once in Boot.
// AGENT: Frontend.
import Phaser from "phaser";
import { pipColors } from "./tokens";

// Exact pip coords (% of half box) — DominoTile.jsx PIP_LAYOUTS, copied 1:1.
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 20], [72, 20], [28, 50], [72, 50], [28, 80], [72, 80]],
  7: [[22, 20], [78, 20], [22, 50], [50, 50], [78, 50], [22, 80], [78, 80]],
  8: [[20, 20], [50, 20], [80, 20], [20, 50], [80, 50], [20, 80], [50, 80], [80, 80]],
  9: [[20, 18], [50, 18], [80, 18], [20, 50], [50, 50], [80, 50], [20, 82], [50, 82], [80, 82]],
};

/** Half-tile size used to bake textures; sprites scale down crisply. */
export const HALF = 120;
const RADIUS = 10; // tokens.css --tile-radius
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHalf(
  ctx: CanvasRenderingContext2D,
  value: number,
  ox: number,
  oy: number,
  size: number,
) {
  const c = pipColors(value);
  if (!c) return;
  const pipD = Math.max(5, size * 0.192);
  for (const [xp, yp] of PIP_LAYOUTS[value] ?? []) {
    const cx = ox + (xp / 100) * size;
    const cy = oy + (yp / 100) * size;
    const r = pipD / 2;

    // box-shadow: 0 1.5px 4px rgba(0,0,0,0.6)
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;
    // radial-gradient(circle at 36% 30%, h 0%, b 52%, s 100%)
    const fx = cx - r * 0.28;
    const fy = cy - r * 0.4;
    const g = ctx.createRadialGradient(fx, fy, 0, cx, cy, r);
    g.addColorStop(0, c.h);
    g.addColorStop(0.52, c.b);
    g.addColorStop(1, c.s);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 0 0 0 1px rgba(0,0,0,0.1) ring
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Vertical tile face, top=`a`, bottom=`b`. Returns a ready canvas. */
function makeFaceCanvas(a: number, b: number): HTMLCanvasElement {
  const w = HALF;
  const h = HALF * 2;
  const cv = document.createElement("canvas");
  cv.width = w * DPR;
  cv.height = h * DPR;
  const ctx = cv.getContext("2d")!;
  ctx.scale(DPR, DPR);

  // Bakelite body — linear-gradient(158deg,#F9F0DA,#F1E3C2 55%,#E8D8AE)
  const ang = (158 * Math.PI) / 180;
  const gx = Math.cos(ang) * h;
  const gy = Math.sin(ang) * h;
  const body = ctx.createLinearGradient(0, 0, gx, gy);
  body.addColorStop(0, "#F9F0DA");
  body.addColorStop(0.55, "#F1E3C2");
  body.addColorStop(1, "#E8D8AE");
  roundRect(ctx, 0, 0, w, h, RADIUS);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, w, h);

  drawHalf(ctx, a, 0, 0, w);
  drawHalf(ctx, b, 0, w, w);

  // Central divider — rgba(50,38,22,0.2), 1.5px
  ctx.fillStyle = "rgba(50,38,22,0.2)";
  ctx.fillRect(0, h / 2 - 0.75, w, 1.5);
  ctx.restore();

  return cv;
}

function makeBackCanvas(): HTMLCanvasElement {
  const w = HALF;
  const h = HALF * 2;
  const cv = document.createElement("canvas");
  cv.width = w * DPR;
  cv.height = h * DPR;
  const ctx = cv.getContext("2d")!;
  ctx.scale(DPR, DPR);
  roundRect(ctx, 0, 0, w, h, 8);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1C1C1C");
  g.addColorStop(1, "#111");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // diagonal hatch
  ctx.strokeStyle = "rgba(255,255,255,0.022)";
  ctx.lineWidth = 1;
  for (let i = -h; i < w + h; i += 9) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h, h);
    ctx.stroke();
  }
  return cv;
}

export const tileKey = (a: number, b: number) => `tile-${a}-${b}`;
export const TILE_BACK = "tile-back";

/** Bake all 55 faces + back into the scene's texture manager (idempotent). */
export function registerTileTextures(scene: Phaser.Scene) {
  if (scene.textures.exists(TILE_BACK)) return;
  for (let a = 0; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      const key = tileKey(a, b);
      if (!scene.textures.exists(key)) {
        scene.textures.addCanvas(key, makeFaceCanvas(a, b));
      }
    }
  }
  scene.textures.addCanvas(TILE_BACK, makeBackCanvas());
}

/** Texture key for an ordered tile end pair (low-high canonical id). */
export function faceKeyForEnds(ends: [number, number]): {
  key: string;
  flip: boolean;
} {
  const [x, y] = ends;
  const a = Math.min(x, y);
  const b = Math.max(x, y);
  // Texture is baked top=a(min) bottom=b(max); flip if ends are hi→lo.
  return { key: tileKey(a, b), flip: x > y };
}
