// game/entities/BoardGroup.ts — the played chain. Renders the FULL authoritative
// board as a serpentine (boustrophedon) layout that wraps to new rows and scales
// the tile size so every tile fits the available table area (BUG D / ADR-011).
// Doubles render perpendicular (vertical) to the chain; orientation comes from
// the server via `ends` (ADR-010 is_flipped) — we never recompute it.
// AGENT: Frontend. Server-authoritative board; rebuilds on `tile_placed`.
import Phaser from "phaser";
import type { Board, BoardSide, Pip } from "@shared/game";
import { TileSprite } from "./TileSprite";

const GAP = 4;
const MAX_HALF = 24; // biggest a tile-half gets when there's plenty of room
const MIN_HALF = 8; // smallest before we just accept overflow

export class BoardGroup {
  private container: Phaser.GameObjects.Container;
  private lastBoard: Board | null = null;
  private maxWidth = 600;
  private maxHeight = 360;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
  }

  setCenter(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  /** Available area for the chain; re-lays out if it changed (resize). */
  setBounds(width: number, height: number) {
    const w = Math.max(width, 120);
    const h = Math.max(height, 120);
    if (w === this.maxWidth && h === this.maxHeight) return;
    this.maxWidth = w;
    this.maxHeight = h;
    if (this.lastBoard) this.render(this.lastBoard);
  }

  get tileCount(): number {
    return this.lastBoard?.tiles.length ?? 0;
  }

  getLeftEndWorldPos(): { x: number; y: number } | null {
    if (this.container.list.length === 0) return null;
    const first = this.container.list[0] as Phaser.GameObjects.Container;
    return { x: this.container.x + first.x, y: this.container.y + first.y };
  }

  getRightEndWorldPos(): { x: number; y: number } | null {
    if (this.container.list.length === 0) return null;
    const last = this.container.list[
      this.container.list.length - 1
    ] as Phaser.GameObjects.Container;
    return { x: this.container.x + last.x, y: this.container.y + last.y };
  }

  /** Rebuild from authoritative board; pop the tile just laid on `side`. */
  sync(board: Board, justPlacedSide?: BoardSide) {
    this.lastBoard = board;
    this.render(board, justPlacedSide);
  }

  /** Pick the largest tile-half so all `n` tiles fit in maxWidth×maxHeight. */
  private fitHalf(n: number): { half: number; cols: number; rows: number } {
    for (let half = MAX_HALF; half >= MIN_HALF; half--) {
      const cell = half * 2 + GAP; // advance per tile along a row
      const rowH = half * 2 + GAP; // row pitch
      const cols = Math.max(1, Math.floor(this.maxWidth / cell));
      const rows = Math.ceil(n / cols);
      if (rows * rowH <= this.maxHeight) return { half, cols, rows };
    }
    // Floor: accept the densest layout we allow.
    const cell = MIN_HALF * 2 + GAP;
    const cols = Math.max(1, Math.floor(this.maxWidth / cell));
    return { half: MIN_HALF, cols, rows: Math.ceil(n / cols) };
  }

  private render(board: Board, justPlacedSide?: BoardSide) {
    this.container.removeAll(true);
    const tiles = board.tiles;
    if (tiles.length === 0) return;

    const { half, cols, rows } = this.fitHalf(tiles.length);
    const cell = half * 2 + GAP;
    const rowH = half * 2 + GAP;
    const gridH = rows * rowH;
    const startY = -gridH / 2 + rowH / 2;

    tiles.forEach((t, i) => {
      const row = Math.floor(i / cols);
      const inRow = i % cols;
      // Center EACH row by its own occupancy so a short/last row (and the
      // common single-row case) sits centered instead of bunched to the left
      // (V1 — otherwise the first tile overruns the lateral avatar).
      const tilesInRow = Math.min(cols, tiles.length - row * cols);
      const rowStartX = -((tilesInRow - 1) * cell) / 2;
      // Serpentine: even rows L→R, odd rows R→L so the chain "snakes".
      const col = row % 2 === 0 ? inRow : tilesInRow - 1 - inRow;
      const x = rowStartX + col * cell;
      const y = startY + row * rowH;

      const isDouble = t.ends[0] === t.ends[1];
      const sprite = new TileSprite(
        this.scene,
        t.id,
        t.ends as [Pip, Pip],
        half,
        isDouble ? "vertical" : "horizontal", // doubles sit perpendicular
      );
      sprite.setPosition(x, y);
      this.container.add(sprite);

      // Pop-in only the tile that was just laid on an open end.
      const isEdge =
        (justPlacedSide === "left" && i === 0) ||
        (justPlacedSide === "right" && i === tiles.length - 1);
      if (isEdge) {
        const target = sprite.scale;
        sprite.setScale(target * 0.4).setAlpha(0);
        this.scene.tweens.add({
          targets: sprite,
          scale: target,
          alpha: 1,
          duration: 220,
          ease: "Back.out",
        });
      }
    });
  }

  clear() {
    this.container.removeAll(true);
    this.lastBoard = null;
  }

  destroy() {
    this.container.destroy();
  }
}
