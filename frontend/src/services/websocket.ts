// services/websocket.ts — Socket.IO transport with reconnect + offline buffer
// + monotonic action anchor (ADR-004). AGENT: Frontend.
// Namespace `/game`; server messages are `{event,matchId,payload,timestamp}`.
import { io, type Socket } from "socket.io-client";
import { dispatcher, CLIENT_ID } from "@/store/dispatcher";
import type { ClientMessage, Transport } from "@/store/types";
import type { ServerMessage, ServerEvent } from "@shared/game";
import { useGameStore } from "@/store/gameStore";
import { useUiStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";

const SERVER_EVENTS: ServerEvent[] = [
  "game_state",
  "tile_placed",
  "turn_changed",
  "special_play",
  "chat_message",
  "player_joined",
  "player_disconnected",
  "round_end",
  "match_end",
  "error",
];

class SocketTransport implements Transport {
  private socket: Socket | null = null;
  /** Highest applied server `timestamp` — reconnect replay anchor (ADR-004). */
  private anchor = 0;
  /** Un-acked client actions, replayed (server dedupes by clientId). */
  private buffer: ClientMessage[] = [];

  connect() {
    if (this.socket) return;
    useUiStore.getState().setConn("connecting");

    // Connect-time auth handshake (ADR-007): `token` (JWT) authenticates the
    // socket — the server's `connect` handler rejects the namespace without it;
    // `clientId` is the stable reconnect/dedup anchor.
    this.socket = io(import.meta.env.VITE_WS_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token: useUserStore.getState().token, clientId: CLIENT_ID },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
    });

    this.socket.on("connect", () => {
      useUiStore.getState().setConn("online");
      this.rejoin();
      this.flush();
    });

    this.socket.io.on("reconnect_attempt", () =>
      useUiStore.getState().setConn("reconnecting"),
    );
    this.socket.on("disconnect", () =>
      useUiStore.getState().setConn("offline"),
    );

    // Server emits each event by name with a single envelope arg.
    for (const ev of SERVER_EVENTS) {
      this.socket.on(ev, (envelope: ServerMessage) => {
        if (envelope?.timestamp > this.anchor) this.anchor = envelope.timestamp;
        dispatcher.applyServerMessage(envelope);
      });
    }

    dispatcher.attachTransport(this);
  }

  /** Re-emit join with the reconnect anchor; server replays the delta or
   *  sends a fresh snapshot if the buffer was exceeded (ADR-004). */
  private rejoin() {
    const match = useGameStore.getState().game;
    if (!match) return;
    const since = Math.max(this.anchor, useGameStore.getState().sinceActionAt);
    this.socket?.emit("join_lobby", {
      matchId: match.matchId,
      sinceActionAt: since || undefined,
    });
  }

  private flush() {
    const pending = this.buffer.splice(0);
    for (const msg of pending) this.emit(msg);
  }

  private emit(msg: ClientMessage) {
    // `meta` is transport-only; the wire payload stays contract-flat.
    this.socket?.emit(msg.action, msg.payload);
  }

  // ── Transport ──
  send(msg: ClientMessage) {
    if (this.isConnected()) this.emit(msg);
    else this.buffer.push(msg);
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketTransport = new SocketTransport();
