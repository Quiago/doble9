// store/types.ts — FE dispatcher vocabulary (ADR-001).
// AGENT: Frontend. Canonical wire shapes live in @shared/game; this file only
// names the FE-internal Action types and the Transport boundary.
import type {
  Action,
  ClientMessage as WireClientMessage,
  ServerMessage,
  PlayTilePayload,
} from "@shared/game";

export type { Action, ServerMessage };

/** FE envelope: wire `ClientMessage` + transport-only `meta` (clientId for
 *  reconnect dedup, ADR-004). `meta` is stripped before socket.emit. */
export interface ClientMessage<P = unknown> extends WireClientMessage<P> {
  meta?: { clientId: string; timestamp: number };
}

/** FE-internal action types. `UI/*` never leave the client; the rest are
 *  optimistically applied then forwarded to the server via Transport. */
export const A = {
  // Server-bound (game)
  JOIN_LOBBY: "JOIN_LOBBY",
  PLAYER_READY: "PLAYER_READY",
  START_MATCH: "START_MATCH",
  TILE_PLAYED: "TILE_PLAYED",
  PASS: "PASS",
  REQUEST_TILE: "REQUEST_TILE",
  SEND_CHAT: "SEND_CHAT",
  // Client-only (UI)
  UI_NAVIGATE: "UI/NAVIGATE",
  UI_TOAST: "UI/TOAST",
  UI_TOGGLE_AUDIO: "UI/TOGGLE_AUDIO",
} as const;

export type ActionType = (typeof A)[keyof typeof A];

export interface TilePlayedAction extends Action<PlayTilePayload> {
  type: typeof A.TILE_PLAYED;
}

/** WS boundary. websocket.ts implements this; dispatcher depends only on the
 *  interface so it stays unit-testable and free of import cycles. */
export interface Transport {
  send(msg: ClientMessage): void;
  isConnected(): boolean;
}
