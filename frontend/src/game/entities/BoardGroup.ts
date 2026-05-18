// game/entities/BoardGroup.ts — the played chain: horizontal, centered.
// AGENT: Frontend. Server-authoritative board; rebuilds on `tile_placed`.
import Phaser from "phaser";
import type { Board, BoardSide } from "@shared/game";
import { TileSprite } from "./TileSprite";

const CHAIN_HALF = 26; // DominoTile size≈32 in game-screen.jsx, tuned to fit
const GAP = 3;
const VISIBLE = 7; // game-screen.jsx visibleChain = chain.slice(-7)

export class BoardGroup {
  private container: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
  }

  setCenter(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  /** Rebuild from authoritative board; pop the tile just laid on `side`. */
  sync(board: Board, justPlacedSide?: BoardSide) {
    this.container.removeAll(true);
    const tiles = board.tiles.slice(-VISIBLE);
    if (tiles.length === 0) return;

    const step = CHAIN_HALF * 2 + GAP;
    const totalW = tiles.length * step - GAP;
    let x = -totalW / 2 + CHAIN_HALF;

    tiles.forEach((t, i) => {
      const sprite = new TileSprite(
        this.scene,
        t.id,
        t.ends,
        CHAIN_HALF,
        "horizontal",
      );
      sprite.setPosition(x, 0);
      this.container.add(sprite);

      const isEdge =
        (justPlacedSide === "left" && i === 0) ||
        (justPlacedSide === "right" && i === tiles.length - 1);
      if (isEdge) {
        sprite.setScale(sprite.scale * 0.4);
        sprite.setAlpha(0);
        this.scene.tweens.add({
          targets: sprite,
          scale: sprite.scale / 0.4,
          alpha: 1,
          duration: 220,
          ease: "Back.out",
        });
      }
      x += step;
    });
  }

  clear() {
    this.container.removeAll(true);
  }

  destroy() {
    this.container.destroy();
  }
}
