// store/dispatcher.ts — the single source of truth (ADR-001, CLAUDE.md §2.2).
// AGENT: Frontend. React and Phaser NEVER call each other — they only
// dispatch Actions and read stores / subscribe to the bus here.
import type {
  Action,
  ClientMessage,
  ServerMessage,
  Transport,
} from "./types";
import { A } from "./types";
import type {
  GameState,
  TilePlacedPayload,
  TurnChangedPayload,
  SpecialPlayPayload,
  ChatMessagePayload,
  ClientAction,
  PlayTilePayload,
} from "@shared/game";
import { useGameStore } from "./gameStore";
import { useUiStore } from "./uiStore";
import { dlog } from "@/lib/debug";

type BusListener = (payload: unknown) => void;

/** Stable per-session id for Action.meta + server-side dedup (ADR-004). */
export const CLIENT_ID = crypto.randomUUID();

/** Maps FE action types to the WS `ClientAction` verbs. UI/* are excluded. */
const SERVER_BOUND: Partial<Record<string, ClientAction>> = {
  [A.JOIN_LOBBY]: "join_lobby",
  [A.PLAYER_READY]: "player_ready",
  [A.START_MATCH]: "start_match",
  [A.TILE_PLAYED]: "play_tile",
  [A.PASS]: "pass_turn",
  [A.REQUEST_TILE]: "request_tile",
  [A.SEND_CHAT]: "send_chat",
};

class Dispatcher {
  private bus = new Map<string, Set<BusListener>>();
  private transport: Transport | null = null;

  /** websocket.ts injects the live socket here (no import cycle). */
  attachTransport(t: Transport) {
    this.transport = t;
  }

  // ── Bus: decoupled React ↔ Phaser channel ──────────────────────────────
  on(topic: string, fn: BusListener): () => void {
    const set = this.bus.get(topic) ?? new Set();
    set.add(fn);
    this.bus.set(topic, set);
    return () => set.delete(fn);
  }

  private emit(topic: string, payload: unknown) {
    this.bus.get(topic)?.forEach((fn) => fn(payload));
  }

  // ── Action router: in from UI / Phaser ─────────────────────────────────
  dispatch<T = unknown>(action: Action<T>) {
    dlog("dispatch", `↑ ${action.type}`, action.payload);
    const meta = action.meta ?? {
      clientId: CLIENT_ID,
      timestamp: Date.now(),
    };

    // Optimistic local feedback before the server confirms.
    if (action.type === A.TILE_PLAYED) {
      const p = action.payload as PlayTilePayload;
      useGameStore.getState().optimisticRemoveFromHand(p.tileId, p.side);
    }

    // Re-broadcast on the bus so Phaser/React can react to local intent.
    this.emit(action.type, action.payload);

    // Forward server-bound actions; UI/* stay client-only.
    const verb = SERVER_BOUND[action.type];
    if (!verb) return;

    const game = useGameStore.getState().game;
    const matchId = game?.matchId ?? "";
    // Wire payload stays flat per contracts/websocket.yml. `meta.clientId`
    // travels on the ClientMessage so websocket.ts can buffer/dedupe on
    // reconnect (ADR-004) without leaking into the contract payload.
    const msg: ClientMessage = {
      action: verb,
      matchId,
      payload: { matchId, ...(action.payload as object) },
    };
    msg.meta = meta;

    // websocket.ts buffers + replays when offline (ADR-004); always hand off.
    this.transport?.send(msg);
  }

  // ── Server truth: in from websocket.ts. Reconciles stores + bus ────────
  applyServerMessage(msg: ServerMessage) {
    dlog("ws", `↓ ${msg.event}`, msg.payload);
    const gs = useGameStore.getState();
    const ui = useUiStore.getState();

    switch (msg.event) {
      case "game_state":
        gs.setSnapshot(msg.payload as GameState);
        this.emit("game_state", msg.payload);
        break;

      case "tile_placed": {
        const p = msg.payload as TilePlacedPayload;
        gs.applyBoard(p.board, gs.game?.turn ?? null);
        this.emit("tile_placed", p); // Phaser animates to final position
        break;
      }

      case "turn_changed": {
        const p = msg.payload as TurnChangedPayload;
        gs.applyTurn(p.turn);
        this.emit("turn_changed", p);
        break;
      }

      case "special_play": {
        const p = msg.payload as SpecialPlayPayload;
        ui.triggerSpecialFx(p.type, p.bySeat);
        this.emit("special_play", p); // PollonaEffect / CapicuaEffect
        break;
      }

      case "chat_message": {
        const p = msg.payload as ChatMessagePayload;
        gs.pushChat({ ...p, timestamp: msg.timestamp });
        this.emit("chat_message", p);
        break;
      }

      case "round_end":
      case "match_end":
      case "player_joined":
      case "player_disconnected":
        this.emit(msg.event, msg.payload);
        break;

      case "error":
        ui.toast(
          (msg.payload as { message?: string }).message ?? "Error",
          "error",
        );
        break;
    }
  }
}

export const dispatcher = new Dispatcher();
