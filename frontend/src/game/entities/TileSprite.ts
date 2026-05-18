// game/entities/TileSprite.ts — one domino on the canvas. Uses the baked
// baquelita+pip texture; orientation via rotation. From DominoTile.jsx.
// AGENT: Frontend.
import Phaser from "phaser";
import type { TileId, Pip } from "@shared/game";
import { faceKeyForEnds } from "../textures";

export type Orientation = "vertical" | "horizontal";

export class TileSprite extends Phaser.GameObjects.Image {
  readonly tileId: TileId;
  readonly ends: [Pip, Pip];
  private selected = false;
  private baseScale = 1;

  constructor(
    scene: Phaser.Scene,
    tileId: TileId,
    ends: [Pip, Pip],
    half: number,
    orientation: Orientation = "vertical",
  ) {
    const { key, flip } = faceKeyForEnds(ends);
    super(scene, 0, 0, key);
    this.tileId = tileId;
    this.ends = ends;
    scene.add.existing(this);

    // Texture is HALF×(2·HALF) baked vertical; scale so a half == `half`px.
    this.baseScale = half / this.width;
    this.setScale(this.baseScale);
    if (flip) this.setFlipY(true);
    this.angle = orientation === "horizontal" ? -90 : 0;
  }

  /** Footprint after rotation (layout helper for hand/chain). */
  get footprint(): { w: number; h: number } {
    const w = this.displayWidth;
    const h = this.displayHeight;
    return Math.abs(this.angle) === 90 ? { w: h, h: w } : { w, h };
  }

  setSelectedState(on: boolean) {
    if (this.selected === on) return;
    this.selected = on;
    this.preFX?.clear();
    if (on) {
      // selected: translateY(-7px) scale(1.04) + green glow (DominoTile.jsx)
      this.preFX?.addGlow(0x0e7a43, 4, 0, false, 0.1, 16);
      this.scene.tweens.add({
        targets: this,
        scale: this.baseScale * 1.04,
        y: this.y - 7,
        duration: 150,
        ease: "Back.out",
      });
    } else {
      this.scene.tweens.add({
        targets: this,
        scale: this.baseScale,
        duration: 150,
        ease: "Sine.out",
      });
    }
  }

  isSelected() {
    return this.selected;
  }
}
