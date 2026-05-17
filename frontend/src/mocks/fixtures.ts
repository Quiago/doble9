// mocks/fixtures.ts — dev fixtures only. NOT game logic (backend is
// authoritative). Just enough shape to render screens against the contract.
import type {
  GameState,
  Pip,
  TileId,
  PublicPlayer,
} from "@shared/game";
import type { User } from "@shared/api";

/** Full double-nine set: 55 tiles, "{low}-{high}", 0 ≤ low ≤ high ≤ 9. */
export function fullDeck(): TileId[] {
  const deck: TileId[] = [];
  for (let a = 0; a <= 9; a++)
    for (let b = a; b <= 9; b++) deck.push(`${a}-${b}`);
  return deck;
}

export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const MOCK_USER: User = {
  id: "u-yo",
  username: "Yo",
  email: "yo@doble9s.com",
  avatarUrl: null,
  country: "CU",
  createdAt: new Date().toISOString(),
};

const NAMES = ["Yo", "Luisito", "Maritza", "El Tigre"];

export function mockSoloSnapshot(matchId: string): GameState {
  const deck = shuffled(fullDeck());
  const players: PublicPlayer[] = NAMES.map((name, i) => ({
    seat: i as 0 | 1 | 2 | 3,
    userId: i === 0 ? "u-yo" : `bot-${i}`,
    name,
    team: i % 2 === 0 ? "teamA" : "teamB",
    tilesCount: 10,
    isBot: i !== 0,
    connected: true,
  }));

  return {
    matchId,
    status: "PLAYING",
    players,
    board: { tiles: [], leftEnd: null, rightEnd: null },
    hand: deck.slice(0, 10),
    turn: {
      seat: 0,
      userId: "u-yo",
      deadline: Date.now() + 30_000,
    },
    scores: { teamA: 0, teamB: 0 },
    round: 1,
    targetScore: 100,
    boneyardCount: 15,
    lastActionAt: Date.now(),
  };
}

export function tileEnds(id: TileId): [Pip, Pip] {
  const [a, b] = id.split("-").map(Number) as [Pip, Pip];
  return [a, b];
}
