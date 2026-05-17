// mocks/handlers.ts — MSW REST mocks mirroring contracts/openapi.yml.
// AGENT: Frontend. Lets screens work before the real backend exists.
import { http, HttpResponse } from "msw";
import type {
  AuthResponse,
  MatchSummary,
  LeaderboardEntry,
  StoreItem,
  PlayerStats,
  Paginated,
  MatchHistoryEntry,
} from "@shared/api";
import { MOCK_USER, mockSoloSnapshot } from "./fixtures";

const BASE = import.meta.env.VITE_API_URL;
const u = (p: string) => `${BASE}${p}`;

const auth: AuthResponse = { token: "mock.jwt.token", user: MOCK_USER };

const roomCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

export const handlers = [
  http.post(u("/auth/register"), () => HttpResponse.json(auth)),
  http.post(u("/auth/login"), () => HttpResponse.json(auth)),
  http.get(u("/auth/me"), () => HttpResponse.json(MOCK_USER)),

  http.post(u("/matches"), async () => {
    const summary: MatchSummary = {
      id: crypto.randomUUID(),
      roomCode: roomCode(),
      mode: "solo",
      status: "LOBBY",
      targetScore: 100,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(summary);
  }),

  http.get(u("/matches/:id"), ({ params }) =>
    HttpResponse.json(mockSoloSnapshot(String(params.id))),
  ),

  http.post(u("/matches/:id/join"), ({ params }) => {
    const summary: MatchSummary = {
      id: String(params.id),
      roomCode: roomCode(),
      mode: "multiplayer",
      status: "LOBBY",
      targetScore: 100,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(summary);
  }),

  http.get(u("/leaderboard"), () => {
    const rows: LeaderboardEntry[] = [
      { rank: 1, userId: "u-yo", username: "Yo", avatarUrl: null, leagueTier: "Gold", leaguePoints: 1240 },
      { rank: 2, userId: "bot-1", username: "Luisito", avatarUrl: null, leagueTier: "Silver", leaguePoints: 980 },
    ];
    return HttpResponse.json(rows);
  }),

  http.get(u("/store/items"), () => {
    const items: StoreItem[] = [
      { key: "skin-heat", type: "avatar_skin", name: "Manolito Miami Heat", description: "Jersey del Heat", priceCoins: 250, previewUrl: null, owned: false },
      { key: "board-calle", type: "board_theme", name: "Calle Cubana", description: "Mesa de barrio", priceCoins: 400, previewUrl: null, owned: false },
    ];
    return HttpResponse.json(items);
  }),

  http.post(u("/store/purchase"), async ({ request }) => {
    const { itemKey } = (await request.json()) as { itemKey: string };
    return HttpResponse.json({ itemKey, coinsRemaining: 100 });
  }),

  http.get(u("/users/:id/stats"), ({ params }) => {
    const stats: PlayerStats = {
      userId: String(params.id),
      gamesPlayed: 42, gamesWon: 27, gamesLost: 15, totalPoints: 3120,
      currentStreak: 3, bestStreak: 9, leagueTier: "Gold",
      leaguePoints: 1240, coins: 100, xp: 5400, level: 12,
    };
    return HttpResponse.json(stats);
  }),

  http.get(u("/users/:id/history"), () => {
    const page: Paginated<MatchHistoryEntry> = {
      items: [
        { matchId: crypto.randomUUID(), mode: "solo", winnerTeam: "teamA", finalScores: { teamA: 100, teamB: 72 }, playedAt: new Date().toISOString(), result: "win" },
      ],
      page: 1, pageSize: 20, total: 1,
    };
    return HttpResponse.json(page);
  }),
];
