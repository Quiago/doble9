// mocks/wsFake.ts — fake WS transport for dev (no backend yet).
// AGENT: Frontend. Scripts contract-shaped server envelopes back through the
// dispatcher. Deliberately dumb: this is NOT the authoritative engine.
import { dispatcher } from "@/store/dispatcher";
import type { ClientMessage, Transport } from "@/store/types";
import type {
  GameState,
  ServerMessage,
  ServerEvent,
  Board,
  Seat,
  Pip,
  PlacedTile,
} from "@shared/game";
import { mockSoloSnapshot, tileEnds } from "./fixtures";
import { useUiStore } from "@/store/uiStore";

class WsFakeTransport implements Transport {
  private state: GameState | null = null;
  /** Per-seat remaining counts so the mock can feed ADR-011 `handCount`. */
  private counts: Record<number, number> = {};

  private feed<P>(event: ServerEvent, payload: P) {
    const msg: ServerMessage<P> = {
      event,
      matchId: this.state?.matchId ?? "",
      payload,
      timestamp: Date.now(),
    };
    // Async to mimic network and avoid setState-in-render. The bot burst is
    // fed back-to-back on purpose — the FE pacing queue is what spaces it out.
    setTimeout(() => dispatcher.applyServerMessage(msg), 60);
  }

  connect() {
    useUiStore.getState().setConn("online");
    dispatcher.attachTransport(this);
  }

  send(msg: ClientMessage) {
    const p = msg.payload as Record<string, unknown>;
    switch (msg.action) {
      case "join_lobby":
      case "start_match": {
        this.state = mockSoloSnapshot(msg.matchId || "mock-match");
        this.counts = {};
        for (const pl of this.state.players) this.counts[pl.seat] = pl.tilesCount;
        this.feed("game_state", this.state);
        break;
      }
      case "play_tile": {
        if (!this.state) break;
        const tileId = String(p.tileId);
        const side = (p.side as "left" | "right") ?? "right";
        const ends = tileEnds(tileId);
        this.place(0, tileId, ends, side);
        if (ends[0] === 9 && ends[1] === 9)
          this.feed("special_play", { type: "POLLONA", bySeat: 0 });
        this.botBurst();
        break;
      }
      case "pass_turn":
        this.botBurst();
        break;
      case "send_chat":
        this.feed("chat_message", {
          bySeat: 0,
          userId: "u-yo",
          message: String(p.message ?? ""),
        });
        break;
    }
  }

  private cycleTurn(next: Seat) {
    if (!this.state) return;
    this.feed("turn_changed", {
      turn: {
        seat: next,
        userId: this.state.players[next]?.userId ?? "bot-1",
        deadline: Date.now() + 30_000,
      },
    });
  }

  /** Lay a tile for `seat` and feed a contract-shaped `tile_placed` (ADR-011:
   *  carries the seat's remaining `handCount`). */
  private place(
    seat: Seat,
    tileId: string,
    ends: [number, number],
    side: "left" | "right",
  ) {
    if (!this.state) return;
    const board = this.state.board;
    const placed: PlacedTile = {
      id: tileId,
      ends: ends as PlacedTile["ends"],
      order: board.tiles.length,
      bySeat: seat,
    };
    const nextBoard: Board = {
      tiles:
        side === "left" ? [placed, ...board.tiles] : [...board.tiles, placed],
      leftEnd: (side === "left" ? ends[0] : board.leftEnd ?? ends[0]) as Pip,
      rightEnd: (side === "right" ? ends[1] : board.rightEnd ?? ends[1]) as Pip,
    };
    this.state = { ...this.state, board: nextBoard };
    this.counts[seat] = Math.max((this.counts[seat] ?? 1) - 1, 0);
    this.feed("tile_placed", {
      bySeat: seat,
      tile: { id: tileId, ends: ends as PlacedTile["ends"] },
      side,
      board: nextBoard,
      handCount: this.counts[seat],
    });
  }

  /** Simulate the rival seats acting back-to-back (matching an open end, or
   *  passing) so the table shows the pacing, the live counts and the "¡PASO!"
   *  before control returns to the player. */
  private botBurst() {
    if (!this.state) return;
    const seats = this.state.players.map((pl) => pl.seat).filter((s) => s !== 0);
    for (const seat of seats) {
      this.cycleTurn(seat);
      // ~1 in 4 rivals can't go → demonstrates the pass announce.
      if (Math.random() < 0.25) {
        this.feed("player_passed", { bySeat: seat });
        continue;
      }
      const open = this.state.board.rightEnd ?? this.state.board.leftEnd ?? 0;
      const other = Math.floor(Math.random() * 10);
      const ends: [number, number] = open <= other ? [open, other] : [other, open];
      this.place(seat, `${ends[0]}-${ends[1]}`, ends, "right");
    }
    this.cycleTurn(0);
  }

  isConnected() {
    return true;
  }
}

export const wsFake = new WsFakeTransport();
