// game/scenes/BootScene.ts — load art + bake tile textures, then hand off.
// AGENT: Frontend.
import Phaser from "phaser";
import { ASSETS } from "@/lib/constants";
import { chromaCanvas } from "@/lib/chroma";
import { registerTileTextures } from "../textures";

// Manolito/Pollona ship as raw greenscreen; key them before use.
const GREEN_KEYED = ["manolitoHold", "manolitoSurp", "pollona"];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("wood", ASSETS.wood);
    this.load.image("manolitoHold", ASSETS.manolitoHold);
    this.load.image("manolitoSurp", ASSETS.manolitoSurp);
    this.load.image("pollona", ASSETS.pollona);
  }

  create() {
    registerTileTextures(this);
    for (const key of GREEN_KEYED) {
      if (!this.textures.exists(key)) continue;
      const src = this.textures.get(key).getSourceImage() as
        | HTMLImageElement
        | HTMLCanvasElement;
      const cv = chromaCanvas(src, src.width, src.height);
      this.textures.remove(key);
      this.textures.addCanvas(key, cv);
    }
    this.scene.start("TableScene");
    this.scene.launch("UIOverlayScene");
  }
}
