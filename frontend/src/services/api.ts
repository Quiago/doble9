// services/api.ts — typed REST client (mirrors contracts/openapi.yml).
// AGENT: Frontend. Shapes from @shared/api; never assume undocumented fields.
import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  User,
  MatchCreateRequest,
  MatchSummary,
  JoinMatchRequest,
  LeaderboardEntry,
  StoreItem,
  PurchaseRequest,
  PurchaseResponse,
  PlayerStats,
  MatchHistoryEntry,
  Paginated,
  ApiError,
} from "@shared/api";
import type { GameState } from "@shared/game";
import { useUserStore } from "@/store/userStore";

const BASE = import.meta.env.VITE_API_URL;

export class ApiException extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    super(body.message);
    this.name = "ApiException";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = useUserStore.getState().token;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body: ApiError = await res
      .json()
      .catch(() => ({ code: "unknown", message: res.statusText }));
    throw new ApiException(res.status, body);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const body = (data: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(data),
});

export const api = {
  // ── Auth ──
  register: (data: RegisterRequest) =>
    request<AuthResponse>("/auth/register", body(data)),
  login: (data: LoginRequest) =>
    request<AuthResponse>("/auth/login", body(data)),
  me: () => request<User>("/auth/me"),
  updateMe: (data: { username?: string; email?: string; settings?: Record<string, unknown> }) =>
    request<User>("/users/me", { method: "PUT", body: JSON.stringify(data) }),


  // ── Matches ──
  createMatch: (data: MatchCreateRequest) =>
    request<MatchSummary>("/matches", body(data)),
  getMatch: (id: string) => request<GameState>(`/matches/${id}`),
  joinMatch: (id: string, data: JoinMatchRequest) =>
    request<MatchSummary>(`/matches/${id}/join`, body(data)),

  // ── Meta / progression ──
  leaderboard: () => request<LeaderboardEntry[]>("/leaderboard"),
  storeItems: () => request<StoreItem[]>("/store/items"),
  purchase: (data: PurchaseRequest) =>
    request<PurchaseResponse>("/store/purchase", body(data)),
  userStats: (id: string) => request<PlayerStats>(`/users/${id}/stats`),
  userHistory: (id: string, page = 1) =>
    request<Paginated<MatchHistoryEntry>>(
      `/users/${id}/history?page=${page}`,
    ),
};
