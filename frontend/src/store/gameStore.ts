// store/gameStore.ts — authoritative game slice (immutable, Zustand v5).
// AGENT: Frontend. The server is authoritative; optimistic mutations here are
// always overwritten by the next snapshot/event (ADR-001, ADR-004).
import { create } from "zustand";
import type {
  GameState,
  Board,
  TileId,
  BoardSide,
  TurnInfo,
  Scores,
  ChatMessagePayload,
} from "@shared/game";

export interface ChatEntry extends ChatMessagePayload {
  timestamp: number;
}

interface GameSlice {
  game: GameState | null;
  chat: ChatEntry[];
  /** Highest applied server `lastActionAt` — reconnect replay anchor (ADR-004). */
  sinceActionAt: number;

  /** Replace with a full authoritative snapshot (`game_state`). */
  setSnapshot: (g: GameState) => void;
  /** Reconcile board after authoritative `tile_placed`. */
  applyBoard: (board: Board, turn: TurnInfo | null) => void;
  applyTurn: (turn: TurnInfo) => void;
  applyScores: (scores: Scores) => void;
  /** Optimistic local feedback — removes tile from own hand pre-confirmation. */
  optimisticRemoveFromHand: (tileId: TileId, side: BoardSide) => void;
  pushChat: (entry: ChatEntry) => void;
  reset: () => void;
}

export const useGameStore = create<GameSlice>((set) => ({
  game: null,
  chat: [],
  sinceActionAt: 0,

  setSnapshot: (g) =>
    set({ game: g, sinceActionAt: Math.max(g.lastActionAt, 0) }),

  applyBoard: (board, turn) =>
    set((s) =>
      s.game ? { game: { ...s.game, board, turn } } : s,
    ),

  applyTurn: (turn) =>
    set((s) => (s.game ? { game: { ...s.game, turn } } : s)),

  applyScores: (scores) =>
    set((s) => (s.game ? { game: { ...s.game, scores } } : s)),

  optimisticRemoveFromHand: (tileId) =>
    set((s) => {
      if (!s.game?.hand) return s;
      return {
        game: { ...s.game, hand: s.game.hand.filter((t) => t !== tileId) },
      };
    }),

  pushChat: (entry) => set((s) => ({ chat: [...s.chat, entry] })),

  reset: () => set({ game: null, chat: [], sinceActionAt: 0 }),
}));

if (typeof window !== "undefined") {
  (window as any).useGameStore = useGameStore;
}
