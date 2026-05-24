// game/scenes/TableScene.ts — pixel-perfect mesa (game-screen.jsx target):
// wood table + gold border + vignette, centered chain, dashed ⬅➡ drop zones,
// opponents N/W/E, bottom hand dock (green border on your turn) + drag-drop.
// AGENT: Frontend. Phaser only reads stores + the Dispatcher bus (ADR-001/002).
import Phaser from "phaser";
import type {
  GameState,
  TilePlacedPayload,
  TurnChangedPayload,
  Seat,
  Pip,
  BoardSide,
} from "@shared/game";
import { dispatcher } from "@/store/dispatcher";
import { useGameStore } from "@/store/gameStore";
import { useUserStore } from "@/store/userStore";
import { A } from "@/store/types";
import { PLAYER_COLORS } from "@/lib/constants";
import { dlog } from "@/lib/debug";
import { hex } from "../tokens";
import { TILE_BACK } from "../textures";
import { TileSprite } from "../entities/TileSprite";
import { BoardGroup } from "../entities/BoardGroup";

const SIDE_L = 200;
const SIDE_R = 230;
const DOCK_H = 104;
const HAND_HALF = 40; // game-screen.jsx hand DominoTile size=40

export class TableScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private board!: BoardGroup;
  private dock!: Phaser.GameObjects.Container;
  private handLayer!: Phaser.GameObjects.Container;
  private opponents!: Phaser.GameObjects.Container;
  private dropZones: {
    left: Phaser.Geom.Rectangle;
    right: Phaser.Geom.Rectangle;
    center: Phaser.Geom.Rectangle;
  } = {
    left: new Phaser.Geom.Rectangle(),
    right: new Phaser.Geom.Rectangle(),
    center: new Phaser.Geom.Rectangle(),
  };
  private dropHitboxes: {
    left: Phaser.Geom.Rectangle;
    right: Phaser.Geom.Rectangle;
    center: Phaser.Geom.Rectangle;
  } = {
    left: new Phaser.Geom.Rectangle(),
    right: new Phaser.Geom.Rectangle(),
    center: new Phaser.Geom.Rectangle(),
  };
  private dragOver: BoardSide | "center" | null = null;
  private hand: TileSprite[] = [];
  private mySeat: Seat = 0;
  private myTurn = false;
  private offBus: Array<() => void> = [];

  constructor() {
    super("TableScene");
  }

  create() {
    dlog("phaser", "TableScene.create");
    this.gfx = this.add.graphics();
    this.board = new BoardGroup(this);
    this.opponents = this.add.container(0, 0);
    this.dock = this.add.container(0, 0);
    this.handLayer = this.add.container(0, 0);

    // Decoupled inbound state — never touches React (ADR-001).
    this.offBus.push(
      dispatcher.on("game_state", (p) => this.onSnapshot(p as GameState)),
      dispatcher.on("tile_placed", (p) =>
        this.onTilePlaced(p as TilePlacedPayload),
      ),
      dispatcher.on("turn_changed", (p) =>
        this.onTurnChanged(p as TurnChangedPayload),
      ),
    );

    const snap = useGameStore.getState().game;
    if (snap) this.onSnapshot(snap);

    this.scale.on("resize", this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.offBus.forEach((off) => off());
      this.scale.off("resize", this.layout, this);
    });

    this.layout();
  }

  // ── Geometry ────────────────────────────────────────────────────────────
  private get tableRect() {
    const { width, height } = this.scale.gameSize;
    const x = SIDE_L + 8;
    const y = 10;
    const w = width - SIDE_L - SIDE_R - 16;
    const h = height - DOCK_H - y - 10;
    return new Phaser.Geom.Rectangle(x, y, Math.max(w, 120), Math.max(h, 120));
  }

  private layout() {
    const { width, height } = this.scale.gameSize;
    const t = this.tableRect;
    const g = this.gfx;
    g.clear();

    // App background behind DOM sidebars.
    g.fillStyle(hex("--negro"), 1).fillRect(0, 0, width, height);

    // Wood table: rounded rect, gold border, inner vignette.
    g.fillStyle(0x000000, 0.001).fillRoundedRect(t.x, t.y, t.width, t.height, 24);
    const wood = this.ensureWood(t);
    wood.setPosition(t.centerX, t.centerY).setDisplaySize(t.width, t.height);
    g.lineStyle(2, hex("--dorado"), 0.3).strokeRoundedRect(
      t.x,
      t.y,
      t.width,
      t.height,
      24,
    );
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(t.x, t.y, t.width, 18, { tl: 24, tr: 24, bl: 0, br: 0 });
    g.fillRoundedRect(
      t.x,
      t.y + t.height - 18,
      t.width,
      18,
      { tl: 0, tr: 0, bl: 24, br: 24 },
    );

    const isBoardEmpty = !useGameStore.getState().game?.board?.tiles || useGameStore.getState().game.board.tiles.length === 0;

    if (isBoardEmpty) {
      // Draw center drop zone
      const dzW = 120;
      const dzH = 60;
      const dzX = t.centerX - dzW / 2;
      const dzY = t.centerY - dzH / 2;
      this.dropZones.center.setTo(dzX, dzY, dzW, dzH);
      // No visual dashed box for center either

      if (this.dzLabels.left) this.dzLabels.left.setVisible(false);
      if (this.dzLabels.right) this.dzLabels.right.setVisible(false);

      // Hitbox is the whole table
      this.dropHitboxes.center.setTo(t.x, t.y, t.width, t.height);
    } else {
      const dzW = 60;
      const dzH = 90;
      const leftPos = this.board.getLeftEndWorldPos();
      const rightPos = this.board.getRightEndWorldPos();

      if (leftPos && rightPos) {
        // Position visual drop zones just outside the chain ends
        const leftX = leftPos.x - dzW - 8;
        const leftY = leftPos.y - dzH / 2;
        this.dropZones.left.setTo(leftX, leftY, dzW, dzH);

        const rightX = rightPos.x + 8;
        const rightY = rightPos.y - dzH / 2;
        this.dropZones.right.setTo(rightX, rightY, dzW, dzH);

        // UI Fix: Do not draw static dashed drop zones because they overlap tiles
        // and break responsive design. The hitboxes will handle drag-and-drop.
        if (this.dzLabels.center) this.dzLabels.center.setVisible(false);
        if (this.dzLabels.left) this.dzLabels.left.setVisible(false);
        if (this.dzLabels.right) this.dzLabels.right.setVisible(false);

        // Hitboxes (detection areas around the chain ends)
        // Generous detection: left covers from table left to leftmost tile + 30px
        // right covers from rightmost tile - 30px to table right
        this.dropHitboxes.left.setTo(t.x, t.y, leftPos.x - t.x + 30, t.height);
        this.dropHitboxes.right.setTo(rightPos.x - 30, t.y, t.right - rightPos.x + 30, t.height);
      }
    }

    this.board.setCenter(t.centerX, t.centerY);
    this.layoutDock();
    this.layoutOpponents();
  }

  private woodImg?: Phaser.GameObjects.Image;
  private ensureWood(t: Phaser.Geom.Rectangle) {
    if (!this.woodImg) {
      this.woodImg = this.add.image(t.centerX, t.centerY, "wood");
      this.woodImg.setDepth(-1);
      const mask = this.add
        .graphics()
        .fillRoundedRect(t.x, t.y, t.width, t.height, 24);
      this.woodImg.setMask(mask.createGeometryMask());
      mask.setVisible(false);
    }
    return this.woodImg;
  }

  private dzLabels: {
    left?: Phaser.GameObjects.Text;
    right?: Phaser.GameObjects.Text;
    center?: Phaser.GameObjects.Text;
  } = {};
  private drawDropZone(r: Phaser.Geom.Rectangle, glyph: string, side: BoardSide | "center") {
    const active = this.dragOver === side;
    const g = this.gfx;
    if (active) g.fillStyle(hex("--dorado"), 0.15).fillRoundedRect(r.x, r.y, r.width, r.height, 8);
    g.lineStyle(2, hex("--dorado"), active ? 1 : 0.2);
    // dashed border
    this.strokeDashedRoundRect(g, r, 8, 6, 4);

    let lbl = this.dzLabels[side];
    if (!lbl) {
      lbl = this.add.text(0, 0, glyph, {
        fontSize: side === "center" ? "14px" : "18px",
        fontFamily: "Montserrat, sans-serif",
        fontStyle: "600",
        color: "#ffffff"
      }).setOrigin(0.5);
      this.dzLabels[side] = lbl;
    } else {
      lbl.setText(glyph);
      lbl.setVisible(true);
    }
    lbl.setPosition(r.centerX, r.centerY).setAlpha(active ? 1 : 0.3);
  }

  private strokeDashedRoundRect(
    g: Phaser.GameObjects.Graphics,
    r: Phaser.Geom.Rectangle,
    radius: number,
    dash: number,
    gap: number,
  ) {
    const path = new Phaser.Curves.Path();
    path.add(new Phaser.Curves.Line([r.x + radius, r.y, r.right - radius, r.y]));
    path.add(new Phaser.Curves.Line([r.right, r.y + radius, r.right, r.bottom - radius]));
    path.add(new Phaser.Curves.Line([r.right - radius, r.bottom, r.x + radius, r.bottom]));
    path.add(new Phaser.Curves.Line([r.x, r.bottom - radius, r.x, r.y + radius]));
    const len = path.getLength();
    for (let d = 0; d < len; d += dash + gap) {
      const p1 = path.getPoint(d / len);
      const p2 = path.getPoint(Math.min(d + dash, len) / len);
      if (p1 && p2) g.lineBetween(p1.x, p1.y, p2.x, p2.y);
    }
  }

  // ── Dock + hand ─────────────────────────────────────────────────────────
  private layoutDock() {
    const { width, height } = this.scale.gameSize;
    const y = height - DOCK_H;
    this.dock.removeAll(true);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.88).fillRect(0, y, width, DOCK_H);
    bg.lineStyle(2, this.myTurn ? hex("--verde") : hex("--dorado"), this.myTurn ? 1 : 0.2);
    bg.lineBetween(0, y, width, y);
    this.dock.add(bg);
    this.positionHand();
  }

  private positionHand() {
    const { width, height } = this.scale.gameSize;
    const y = height - DOCK_H / 2;
    const step = HAND_HALF + 6;
    const totalW = this.hand.length * step - 6;
    let x = width / 2 - totalW / 2 + HAND_HALF / 2;
    for (const tile of this.hand) {
      tile.setData("homeX", x);
      tile.setData("homeY", y);
      if (!tile.getData("dragging")) tile.setPosition(x, y);
      x += step;
    }
  }

  // ── Opponents (N / W / E) ───────────────────────────────────────────────
  private layoutOpponents() {
    const t = this.tableRect;
    this.opponents.removeAll(true);
    const players = useGameStore.getState().game?.players ?? [];
    const seatsByPos: Array<{ seat: Seat; x: number; y: number; col: boolean }> =
      [];
    const others = players.filter((p) => p.seat !== this.mySeat);
    if (others[0])
      seatsByPos.push({ seat: others[0].seat, x: t.centerX, y: t.y + 30, col: false });
    if (others[1])
      seatsByPos.push({ seat: others[1].seat, x: t.x + 36, y: t.centerY, col: true });
    if (others[2])
      seatsByPos.push({ seat: others[2].seat, x: t.right - 36, y: t.centerY, col: true });

    for (const s of seatsByPos) {
      const p = players.find((pp) => pp.seat === s.seat)!;
      const color = PLAYER_COLORS[s.seat % 4];
      const active = useGameStore.getState().game?.turn?.seat === s.seat;
      const av = this.add.container(s.x, s.y);
      const disc = this.add
        .circle(0, 0, 23, Phaser.Display.Color.HexStringToColor(color).color, 0.33)
        .setStrokeStyle(2, active ? hex("--verde") : hex("--dorado"), active ? 1 : 0.4);
      const ini = this.add
        .text(0, 0, p.name.charAt(0).toUpperCase(), {
          fontFamily: "Montserrat, sans-serif",
          fontStyle: "900",
          fontSize: "16px",
          color,
        })
        .setOrigin(0.5);
      av.add([disc, ini]);
      this.opponents.add(av);

      const n = Math.min(p.tilesCount, 8);
      for (let i = 0; i < n; i++) {
        const back = this.add.image(0, 0, TILE_BACK).setDisplaySize(11, 22);
        if (s.col) back.setPosition(s.x, s.y + 28 + i * 12).setAngle(90);
        else back.setPosition(s.x - (n * 13) / 2 + i * 13, s.y + 34);
        this.opponents.add(back);
      }
    }
  }

  // ── Inbound state ───────────────────────────────────────────────────────
  private onSnapshot(g: GameState) {
    const meId = useUserStore.getState().user?.id ?? "u-yo";
    this.mySeat = g.players.find((p) => p.userId === meId)?.seat ?? 0;
    this.myTurn = g.turn?.seat === this.mySeat;
    dlog(
      "phaser",
      `snapshot: seat=${this.mySeat} myTurn=${this.myTurn} hand=${
        g.hand?.length ?? 0
      } board=${g.board.tiles.length}`,
    );
    this.rebuildHand(g.hand ?? []);
    this.board.sync(g.board);
    this.layout();
  }

  private onTilePlaced(p: TilePlacedPayload) {
    this.board.sync(p.board, p.side);
    if (p.bySeat === this.mySeat) {
      const idx = this.hand.findIndex((h) => h.tileId === p.tile.id);
      if (idx >= 0) {
        this.hand[idx].destroy();
        this.hand.splice(idx, 1);
        this.positionHand();
      }
    } else {
      this.layoutOpponents();
    }
    this.layout();
  }

  private onTurnChanged(p: TurnChangedPayload) {
    this.myTurn = p.turn.seat === this.mySeat;
    this.layoutDock();
    this.layoutOpponents();
  }

  private rebuildHand(ids: string[]) {
    this.hand.forEach((h) => h.destroy());
    this.hand = ids.map((id) => {
      const ends = id.split("-").map(Number) as [Pip, Pip];
      const t = new TileSprite(this, id, ends, HAND_HALF, "vertical");
      this.handLayer.add(t);
      this.makeDraggable(t);
      return t;
    });
    this.positionHand();
  }

  // ── Drag-and-drop (CLAUDE.md §4.4) ──────────────────────────────────────
  private makeDraggable(tile: TileSprite) {
    tile.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(tile);

    tile.on("dragstart", () => {
      dlog("phaser", `dragstart ${tile.tileId} (myTurn=${this.myTurn})`);
      if (!this.myTurn) return;
      tile.setData("dragging", true);
      tile.setSelectedState(true, true);
      this.children.bringToTop(tile);
    });

    tile.on("drag", (pointer: Phaser.Input.Pointer, dx: number, dy: number) => {
      if (!this.myTurn) return;
      tile.setPosition(dx, dy);
      const over = this.hitDropZone(pointer.x, pointer.y);
      if (over !== this.dragOver) {
        this.dragOver = over;
        this.layout();
      }
    });

    tile.on("dragend", () => {
      tile.setData("dragging", false);
      tile.setSelectedState(false);
      const side = this.dragOver;
      this.dragOver = null;
      this.layout();
      dlog(
        "phaser",
        `dragend ${tile.tileId} side=${side ?? "none"} → ${
          this.myTurn && side ? "TILE_PLAYED" : "snap back"
        }`,
      );
      if (this.myTurn && side) {
        const targetSide = side === "center" ? "right" : side;
        // Optimistic: emit intent; server `tile_placed` is authoritative.
        dispatcher.dispatch({
          type: A.TILE_PLAYED,
          payload: { tileId: tile.tileId, side: targetSide },
        });
      }
      // Snap home (server removes it on confirm).
      this.tweens.add({
        targets: tile,
        x: tile.getData("homeX"),
        y: tile.getData("homeY"),
        duration: 180,
        ease: "Back.out",
      });
    });
  }

  private hitDropZone(x: number, y: number): BoardSide | "center" | null {
    const isBoardEmpty = !useGameStore.getState().game?.board?.tiles || useGameStore.getState().game.board.tiles.length === 0;
    if (isBoardEmpty) {
      if (Phaser.Geom.Rectangle.Contains(this.dropHitboxes.center, x, y)) return "center";
      return null;
    }
    if (Phaser.Geom.Rectangle.Contains(this.dropHitboxes.left, x, y)) return "left";
    if (Phaser.Geom.Rectangle.Contains(this.dropHitboxes.right, x, y)) return "right";
    return null;
  }
}
