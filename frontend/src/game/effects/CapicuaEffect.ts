// game/effects/CapicuaEffect.ts — CAPICUA celebration (lighter than Pollona):
// gold burst + "¡CAPICÚA!" text, auto-dismiss. AGENT: Frontend.
import Phaser from "phaser";

function ensureSpark(scene: Phaser.Scene) {
  if (scene.textures.exists("fx-spark")) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xf2d27a, 1).fillCircle(4, 4, 4);
  g.generateTexture("fx-spark", 8, 8);
  g.destroy();
}

export function playCapicua(scene: Phaser.Scene, onDone?: () => void) {
  ensureSpark(scene);
  const { width, height } = scene.scale.gameSize;
  const cx = width / 2;
  const cy = height / 2;
  const layer = scene.add.container(0, 0).setDepth(1000);

  const burst = scene.add.particles(cx, cy, "fx-spark", {
    speed: { min: 120, max: 320 },
    angle: { min: 0, max: 360 },
    lifespan: 900,
    scale: { start: 1.2, end: 0 },
    alpha: { start: 1, end: 0 },
    quantity: 40,
    emitting: false,
  });
  burst.setDepth(1001);
  layer.add(burst);
  burst.explode(40, cx, cy);

  const txt = scene.add
    .text(cx, cy, "¡CAPICÚA!", {
      fontFamily: "Montserrat, sans-serif",
      fontStyle: "italic 900",
      fontSize: "44px",
      color: "#D4AF37",
    })
    .setOrigin(0.5)
    .setScale(0.4)
    .setAlpha(0);
  txt.setShadow(2, 2, "#000000", 4, true, true);
  layer.add(txt);

  scene.tweens.add({
    targets: txt,
    scale: 1,
    alpha: 1,
    duration: 350,
    ease: "Back.out",
    onComplete: () =>
      scene.tweens.add({
        targets: txt,
        alpha: 0,
        delay: 900,
        duration: 350,
        onComplete: () => {
          layer.destroy(true);
          onDone?.();
        },
      }),
  });
}
