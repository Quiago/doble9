// game/scenes/BootScene.ts — load art + bake tile textures, then hand off.
// AGENT: Frontend.
import Phaser from "phaser";
import { ASSETS } from "@/lib/constants";
import { registerTileTextures } from "../textures";

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
    this.scene.start("TableScene");
    this.scene.launch("UIOverlayScene");
  }
}
