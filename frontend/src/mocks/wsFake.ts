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
  PlacedTile,
} from "@shared/game";
import { mockSoloSnapshot, tileEnds } from "./fixtures";
import { useUiStore } from "@/store/uiStore";

class WsFakeTransport implements Transport {
  private state: GameState | null = null;

  private feed<P>(event: ServerEvent, payload: P) {
    const msg: ServerMessage<P> = {
      event,
      matchId: this.state?.matchId ?? "",
      payload,
      timestamp: Date.now(),
    };
    // Async to mimic network and avoid setState-in-render.
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
        this.feed("game_state", this.state);
        break;
      }
      case "play_tile": {
        if (!this.state) break;
        const tileId = String(p.tileId);
        const side = (p.side as "left" | "right") ?? "right";
        const ends = tileEnds(tileId);
        const board = this.state.board;
        const placed: PlacedTile = {
          id: tileId,
          ends,
          order: board.tiles.length,
          bySeat: 0,
        };
        const nextBoard: Board = {
          tiles:
            side === "left"
              ? [placed, ...board.tiles]
              : [...board.tiles, placed],
          leftEnd: side === "left" ? ends[0] : board.leftEnd ?? ends[0],
          rightEnd: side === "right" ? ends[1] : board.rightEnd ?? ends[1],
        };
        this.state = { ...this.state, board: nextBoard };
        this.feed("tile_placed", { bySeat: 0, tile: { id: tileId, ends }, side, board: nextBoard });
        if (ends[0] === 9 && ends[1] === 9)
          this.feed("special_play", { type: "POLLONA", bySeat: 0 });
        this.cycleTurn(1);
        break;
      }
      case "pass_turn":
        this.cycleTurn(1);
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

  isConnected() {
    return true;
  }
}

export const wsFake = new WsFakeTransport();
