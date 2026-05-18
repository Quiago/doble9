// game/effects/PollonaEffect.ts — DOUBLE_9 / POLLONA celebration.
// camera shake + gold coin rain + pollona sprite + "¡POLLONAAAA!" + Manolito.
// Mirrors game-screen.jsx Pollona overlay + Doble 9's.html keyframes.
// AGENT: Frontend.
import Phaser from "phaser";

function ensureCoin(scene: Phaser.Scene) {
  if (scene.textures.exists("fx-coin")) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xf7e08a, 1).fillCircle(6, 6, 6);
  g.fillStyle(0xc9a227, 1).fillCircle(7, 7, 4);
  g.generateTexture("fx-coin", 12, 12);
  g.destroy();
}

export function playPollona(scene: Phaser.Scene, onDone?: () => void) {
  ensureCoin(scene);
  const { width, height } = scene.scale.gameSize;
  const layer = scene.add.container(0, 0).setDepth(1000);

  const veil = scene.add
    .rectangle(0, 0, width, height, 0x000000, 0.9)
    .setOrigin(0)
    .setInteractive();
  layer.add(veil);

  scene.cameras.main.shake(420, 0.008);

  if (scene.textures.exists("pollona")) {
    const bird = scene.add
      .image(width / 2, height / 2 - 10, "pollona")
      .setScale(0.1)
      .setAlpha(0);
    layer.add(bird);
    scene.tweens.add({
      targets: bird,
      scale: 0.55,
      alpha: 1,
      duration: 350,
      ease: "Back.out",
    });
  }
  if (scene.textures.exists("manolitoSurp")) {
    const m = scene.add
      .image(90, height - 90, "manolitoSurp")
      .setScale(0.0)
      .setAlpha(0.95);
    layer.add(m);
    scene.tweens.add({ targets: m, scale: 0.42, duration: 300, delay: 120, ease: "Back.out" });
  }

  const txt = scene.add
    .text(width / 2, height / 2 + 150, "¡POLLONAAAA!", {
      fontFamily: "Montserrat, sans-serif",
      fontStyle: "italic 900",
      fontSize: "52px",
      color: "#D4AF37",
    })
    .setOrigin(0.5)
    .setAngle(-8)
    .setScale(0.4)
    .setAlpha(0);
  txt.setShadow(3, 3, "#6B0000", 0, true, true);
  layer.add(txt);
  scene.tweens.add({
    targets: txt,
    scale: 1,
    alpha: 1,
    duration: 400,
    delay: 150,
    ease: "Back.out",
  });

  const emitter = scene.add.particles(0, -20, "fx-coin", {
    x: { min: width * 0.2, max: width * 0.8 },
    y: -20,
    lifespan: 1600,
    speedY: { min: 220, max: 360 },
    rotate: { start: 0, end: 500 },
    scale: { start: 1, end: 0.4 },
    alpha: { start: 1, end: 0 },
    frequency: 40,
    quantity: 2,
  });
  emitter.setDepth(1001);
  layer.add(emitter);

  const dismiss = () => {
    emitter.stop();
    scene.tweens.add({
      targets: layer,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        layer.destroy(true);
        onDone?.();
      },
    });
  };
  veil.once("pointerdown", dismiss);
  scene.time.delayedCall(2600, dismiss);
}
