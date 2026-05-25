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
import { useUiStore } from "@/store/uiStore";
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

// Pacing: bots arrive in a burst (several tile_placed/turn_changed at once).
// We replay the PRESENTATION sequentially so the user SEES each rival act.
// Server state stays authoritative — we only delay the rendering (ADR-011).
const THINK_MS = 650; // "Pensando…" beat before a rival plays
const PLACE_MS = 320; // settle after a rival lays a tile
const PASS_MS = 950; // hold the "¡PASO!" announcement

/** One paced presentation step drained from the inbound event queue. */
type PacedEvent =
  | { kind: "turn"; seat: Seat }
  | { kind: "placed"; p: TilePlacedPayload }
  | { kind: "passed"; seat: Seat };

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

  // ── Presentation pacing + turn state (decoupled from the authoritative
  //    store so the canvas doesn't jump ahead of the bot burst). ──────────
  private queue: PacedEvent[] = [];
  private draining = false;
  /** Locally paced per-seat counts (BUG A render side; store is authoritative). */
  private seatCounts: Partial<Record<Seat, number>> = {};
  /** Seat whose turn the PRESENTATION is currently on (paced, not store). */
  private activeSeat: Seat | null = null;
  /** Status copy shown by the active seat ("Pensando…" / "Jugando…" / …). */
  private activeLabel = "";
  /** Pulsing markers over the legal open ends while dragging (affordance). */
  private legalGfx?: Phaser.GameObjects.Graphics;

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
        this.enqueue({ kind: "placed", p: p as TilePlacedPayload }),
      ),
      dispatcher.on("turn_changed", (p) =>
        this.enqueue({ kind: "turn", seat: (p as TurnChangedPayload).turn.seat }),
      ),
      dispatcher.on("player_passed", (p) =>
        this.enqueue({ kind: "passed", seat: (p as { bySeat: Seat }).bySeat }),
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

    // Tell the chain how much room it has so it can wrap/scale (BUG D), then
    // base drop geometry on what's actually rendered (paced) board sprite.
    this.board.setBounds(t.width - 24, t.height - 24);
    const isBoardEmpty = this.board.tileCount === 0;

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

    // Clear turn cue on the dock so the user knows when it's their move.
    const cue = this.add
      .text(
        14,
        y + 10,
        this.myTurn ? "TU TURNO · arrastra una ficha" : "Esperando tu turno…",
        {
          fontFamily: "Montserrat, sans-serif",
          fontStyle: "800",
          fontSize: "12px",
          color: this.myTurn ? "#1bd96a" : "#9a8c6a",
        },
      )
      .setOrigin(0, 0.5);
    this.dock.add(cue);

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
      // Active seat is driven by the PACED presentation, not the store, so the
      // highlight tracks what the user is actually seeing on the canvas.
      const active = this.activeSeat === s.seat;
      const count = this.seatCount(s.seat);
      const av = this.add.container(s.x, s.y);
      const disc = this.add
        .circle(0, 0, 23, Phaser.Display.Color.HexStringToColor(color).color, 0.33)
        .setStrokeStyle(2, active ? hex("--verde") : hex("--dorado"), active ? 1 : 0.4);
      if (active) disc.preFX?.addGlow(hex("--verde"), 4, 0, false, 0.1, 12);
      const ini = this.add
        .text(0, 0, p.name.charAt(0).toUpperCase(), {
          fontFamily: "Montserrat, sans-serif",
          fontStyle: "900",
          fontSize: "16px",
          color,
        })
        .setOrigin(0.5);
      const countBg = this.add.circle(0, 20, 10, 0x000000, 0.8).setStrokeStyle(1, hex("--dorado"), 0.8);
      const countTxt = this.add.text(0, 20, count.toString(), {
        fontFamily: "Montserrat, sans-serif",
        fontStyle: "700",
        fontSize: "12px",
        color: "#ffffff",
      }).setOrigin(0.5);

      av.add([disc, ini, countBg, countTxt]);

      // Turn status under the active rival ("Pensando…" / "Jugando…") so the
      // user never has to guess whose move it is (UX mandate).
      if (active && this.activeLabel && !this.myTurn) {
        const status = this.add
          .text(0, 38, this.activeLabel, {
            fontFamily: "Inter, sans-serif",
            fontStyle: "700",
            fontSize: "11px",
            color: "#1bd96a",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: { x: 6, y: 2 },
          })
          .setOrigin(0.5);
        av.add(status);
      }
      this.opponents.add(av);

      // UX: render each rival hand as N face-down backs matching the live count
      // (ADR-011), not just a number.
      const n = Math.min(count, 12);
      for (let i = 0; i < n; i++) {
        const back = this.add.image(0, 0, TILE_BACK).setDisplaySize(14, 28);
        if (s.col) back.setPosition(s.x, s.y + 52 + i * 13).setAngle(90);
        else back.setPosition(s.x - (n * 15) / 2 + i * 15, s.y + 56);
        back.setTint(0xdddddd);
        this.opponents.add(back);
      }
    }
  }

  /** Paced count for a seat; falls back to the authoritative store snapshot. */
  private seatCount(seat: Seat): number {
    if (this.seatCounts[seat] != null) return this.seatCounts[seat] as number;
    const p = useGameStore.getState().game?.players.find((pp) => pp.seat === seat);
    return p?.tilesCount ?? 0;
  }

  // ── Inbound state ───────────────────────────────────────────────────────
  private onSnapshot(g: GameState) {
    const meId = useUserStore.getState().user?.id ?? "u-yo";
    this.mySeat = g.players.find((p) => p.userId === meId)?.seat ?? 0;
    this.myTurn = g.turn?.seat === this.mySeat;
    // A fresh authoritative snapshot wins over any in-flight presentation.
    this.queue = [];
    this.draining = false;
    this.seatCounts = {};
    for (const p of g.players) this.seatCounts[p.seat] = p.tilesCount;
    this.activeSeat = g.turn?.seat ?? null;
    this.activeLabel = this.myTurn ? "TU TURNO" : g.turn ? "Pensando…" : "";
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

  // ── Pacing engine ─────────────────────────────────────────────────────────
  private enqueue(ev: PacedEvent) {
    this.queue.push(ev);
    this.drain();
  }

  /** Drain one paced event, then schedule the next so each rival action is
   *  perceivable instead of arriving in an instant burst. */
  private drain() {
    if (this.draining) return;
    const ev = this.queue.shift();
    if (!ev) return;
    this.draining = true;
    this.renderPaced(ev, () => {
      this.draining = false;
      this.drain();
    });
  }

  private after(ms: number, done: () => void) {
    this.time.delayedCall(Math.max(ms, 1), done);
  }

  private renderPaced(ev: PacedEvent, done: () => void) {
    if (ev.kind === "turn") {
      this.activeSeat = ev.seat;
      this.myTurn = ev.seat === this.mySeat;
      this.activeLabel = this.myTurn ? "TU TURNO" : "Pensando…";
      this.layoutDock();
      this.layoutOpponents();
      // My own turn hands control to the player immediately — no fake wait.
      this.after(this.myTurn ? 1 : THINK_MS, done);
      return;
    }

    if (ev.kind === "placed") {
      const { p } = ev;
      this.seatCounts[p.bySeat] = p.handCount;
      if (p.bySeat === this.mySeat) {
        this.applyMyPlacement(p);
        this.after(120, done);
      } else {
        this.activeSeat = p.bySeat;
        this.activeLabel = "Jugando…";
        this.board.sync(p.board, p.side);
        this.layoutOpponents();
        this.layout();
        this.after(PLACE_MS, done);
      }
      return;
    }

    // passed
    this.activeSeat = ev.seat;
    this.activeLabel = "¡No llevó!";
    this.layoutOpponents();
    this.showPassFx(ev.seat);
    this.after(PASS_MS, done);
  }

  /** Own tile already left the hand optimistically; reconcile board + sprite. */
  private applyMyPlacement(p: TilePlacedPayload) {
    this.board.sync(p.board, p.side);
    const idx = this.hand.findIndex((h) => h.tileId === p.tile.id);
    if (idx >= 0) {
      this.hand[idx].destroy();
      this.hand.splice(idx, 1);
      this.positionHand();
    }
    this.layout();
  }

  private showPassFx(seat: Seat) {
    let x: number | undefined;
    let y: number | undefined;

    if (seat === this.mySeat) {
      x = this.scale.gameSize.width / 2;
      y = this.scale.gameSize.height - DOCK_H - 20;
    } else {
      const t = this.tableRect;
      const players = useGameStore.getState().game?.players ?? [];
      const others = players.filter((pl) => pl.seat !== this.mySeat);
      if (others[0] && others[0].seat === seat) { x = t.centerX; y = t.y + 30; }
      else if (others[1] && others[1].seat === seat) { x = t.x + 36; y = t.centerY; }
      else if (others[2] && others[2].seat === seat) { x = t.right - 36; y = t.centerY; }
    }

    if (x !== undefined && y !== undefined) {
      const txt = this.add.text(x, y - 20, "¡PASO!", {
        fontFamily: "Montserrat, sans-serif",
        fontStyle: "900",
        fontSize: "28px",
        color: "#ff4444",
        stroke: "#000000",
        strokeThickness: 6,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: txt,
        y: y - 50,
        alpha: 1,
        duration: 300,
        ease: "Back.out",
        yoyo: true,
        hold: 1200,
        onComplete: () => txt.destroy()
      });
    }
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
      // Affordance: show which open end(s) this tile can legally connect to.
      this.highlightLegalEnds(tile);
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
      const dropHint = this.dragOver;
      this.dragOver = null;
      this.clearLegalEnds();
      this.layout();

      // BUG C: resolve the side by LEGALITY, not by the pixel the tile landed
      // on. The server already validates; this just stops the FE from sending
      // the wrong end and getting a legal move rejected.
      const side = this.myTurn && dropHint ? this.resolveLegalSide(tile, dropHint) : null;
      dlog(
        "phaser",
        `dragend ${tile.tileId} drop=${dropHint ?? "none"} → ${side ?? "snap back"}`,
      );
      if (side) {
        // Optimistic: emit intent; server `tile_placed` is authoritative.
        dispatcher.dispatch({
          type: A.TILE_PLAYED,
          payload: { tileId: tile.tileId, side },
        });
      } else if (this.myTurn && dropHint) {
        // Dropped on the board but the tile fits no open end — guide the user.
        useUiStore
          .getState()
          .toast("Esa ficha no encaja en ningún extremo abierto", "info");
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

  /** Which board side this tile legally connects to. Empty board → first tile
   *  (side is irrelevant to the server). When it fits both ends, honor where
   *  the player dropped it; when it fits one, force that end. null = no fit. */
  private resolveLegalSide(
    tile: TileSprite,
    dropHint: BoardSide | "center" | null,
  ): BoardSide | null {
    const board = useGameStore.getState().game?.board;
    if (!board) return null;
    const { leftEnd, rightEnd } = board;
    if (leftEnd == null && rightEnd == null) return "right"; // opening move
    const [a, b] = tile.ends;
    const fitsLeft = a === leftEnd || b === leftEnd;
    const fitsRight = a === rightEnd || b === rightEnd;
    if (fitsLeft && fitsRight) {
      if (dropHint === "left") return "left";
      if (dropHint === "right") return "right";
      return "right";
    }
    if (fitsLeft) return "left";
    if (fitsRight) return "right";
    return null;
  }

  private highlightLegalEnds(tile: TileSprite) {
    this.clearLegalEnds();
    const board = useGameStore.getState().game?.board;
    const g = this.add.graphics().setDepth(50);
    const mark = (x: number, y: number) => {
      g.fillStyle(hex("--verde"), 0.22).fillCircle(x, y, 30);
      g.lineStyle(2, hex("--verde"), 0.9).strokeCircle(x, y, 30);
    };
    if (!board || (board.leftEnd == null && board.rightEnd == null)) {
      const t = this.tableRect;
      mark(t.centerX, t.centerY);
    } else {
      const [a, b] = tile.ends;
      const lp = this.board.getLeftEndWorldPos();
      const rp = this.board.getRightEndWorldPos();
      if (lp && (a === board.leftEnd || b === board.leftEnd)) mark(lp.x - 36, lp.y);
      if (rp && (a === board.rightEnd || b === board.rightEnd)) mark(rp.x + 36, rp.y);
    }
    this.legalGfx = g;
    this.tweens.add({
      targets: g,
      alpha: { from: 0.45, to: 1 },
      duration: 480,
      yoyo: true,
      repeat: -1,
    });
  }

  private clearLegalEnds() {
    if (this.legalGfx) {
      this.tweens.killTweensOf(this.legalGfx);
      this.legalGfx.destroy();
      this.legalGfx = undefined;
    }
  }

  private hitDropZone(x: number, y: number): BoardSide | "center" | null {
    const isBoardEmpty = this.board.tileCount === 0;
    if (isBoardEmpty) {
      if (Phaser.Geom.Rectangle.Contains(this.dropHitboxes.center, x, y)) return "center";
      return null;
    }
    if (Phaser.Geom.Rectangle.Contains(this.dropHitboxes.left, x, y)) return "left";
    if (Phaser.Geom.Rectangle.Contains(this.dropHitboxes.right, x, y)) return "right";
    return null;
  }
}
