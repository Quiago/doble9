// game/scenes/UIOverlayScene.ts — transparent layer above TableScene that
// hosts the special_play celebrations (ADR-006 §4: DOUBLE_9|CAPICUA|POLLONA
// are distinct). AGENT: Frontend.
import Phaser from "phaser";
import type { SpecialPlayPayload } from "@shared/game";
import { dispatcher } from "@/store/dispatcher";
import { useUiStore } from "@/store/uiStore";
import { playPollona } from "../effects/PollonaEffect";
import { playCapicua } from "../effects/CapicuaEffect";

export class UIOverlayScene extends Phaser.Scene {
  private offBus: Array<() => void> = [];

  constructor() {
    super({ key: "UIOverlayScene", active: false });
  }

  create() {
    this.offBus.push(
      dispatcher.on("special_play", (p) =>
        this.onSpecial(p as SpecialPlayPayload),
      ),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.offBus.forEach((off) => off()),
    );
  }

  private onSpecial(p: SpecialPlayPayload) {
    const clear = () => useUiStore.getState().clearSpecialFx();
    if (p.type === "CAPICUA") playCapicua(this, clear);
    else playPollona(this, clear); // DOUBLE_9 + POLLONA (CLAUDE.md §4.4)
  }
}
