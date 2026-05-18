// hooks/useGame.ts — read game slice + dispatch player intents (optimistic;
// server is authoritative). AGENT: Frontend.
import { useGameStore } from "@/store/gameStore";
import { useUserStore } from "@/store/userStore";
import { dispatcher } from "@/store/dispatcher";
import { A } from "@/store/types";
import type { TileId, BoardSide } from "@shared/game";

export function useGame() {
  const game = useGameStore((s) => s.game);
  const meId = useUserStore((s) => s.user?.id) ?? "u-yo";

  const me = game?.players.find((p) => p.userId === meId) ?? null;
  const isMyTurn = !!game?.turn && !!me && game.turn.seat === me.seat;

  return {
    game,
    status: game?.status ?? "LOBBY",
    players: game?.players ?? [],
    board: game?.board ?? null,
    hand: game?.hand ?? [],
    turn: game?.turn ?? null,
    scores: game?.scores ?? { teamA: 0, teamB: 0 },
    mySeat: me?.seat ?? null,
    isMyTurn,

    playTile: (tileId: TileId, side: BoardSide) =>
      dispatcher.dispatch({ type: A.TILE_PLAYED, payload: { tileId, side } }),
    pass: () => dispatcher.dispatch({ type: A.PASS, payload: {} }),
    requestTile: () =>
      dispatcher.dispatch({ type: A.REQUEST_TILE, payload: {} }),
  };
}
