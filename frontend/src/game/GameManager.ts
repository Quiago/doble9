// game/GameManager.ts — owns the Phaser.Game lifecycle. Mounted by React in
// a useEffect inside a <div ref> (CLAUDE.md §4.2). The boundary between React
// and Phaser is the Dispatcher only (ADR-001/002) — no direct calls.
// AGENT: Frontend.
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TableScene } from "./scenes/TableScene";
import { UIOverlayScene } from "./scenes/UIOverlayScene";

export class GameManager {
  private game: Phaser.Game;

  constructor(container: HTMLElement) {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      backgroundColor: "#0D0D0D",
      scene: [BootScene, TableScene, UIOverlayScene],
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: { antialias: true, powerPreference: "high-performance" },
    });
    if (typeof window !== "undefined") {
      (window as any).phaserGame = this.game;
    }
  }

  private destroyed = false;

  destroy() {
    if (this.destroyed) return; // idempotente: evita doble-destroy en remontes
    this.destroyed = true;
    if (typeof window !== "undefined" && (window as any).phaserGame === this.game) {
      (window as any).phaserGame = undefined;
    }
    this.game.destroy(true);
  }
}
