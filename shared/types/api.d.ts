// shared/types/api.d.ts — Cross-agent REST contract (Architect owns).
// Mirrors contracts/openapi.yml exactly. FE consumes; BE implements.
// Any change REQUIRES an ADR + update of contracts/openapi.yml.

import type { Scores, MatchStatus, Team } from "./game";

export type UUID = string;
/** ISO-8601 UTC timestamp. */
export type Timestamp = string;

export interface User {
  id: UUID;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  country: string | null;
  createdAt: Timestamp;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  /** username or email. */
  identifier: string;
  password: string;
}

export type LeagueTier =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond";

export interface PlayerStats {
  userId: UUID;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  leagueTier: LeagueTier;
  leaguePoints: number;
  coins: number;
  xp: number;
  level: number;
}

export type MatchMode = "solo" | "multiplayer" | "tournament";

export interface MatchCreateRequest {
  mode: MatchMode;
  targetScore?: number;
  /** Fill empty seats with bots (solo / quick play). */
  fillWithBots?: boolean;
}

export interface MatchSummary {
  id: UUID;
  roomCode: string;
  mode: MatchMode;
  status: MatchStatus;
  targetScore: number;
  createdAt: Timestamp;
}

export interface JoinMatchRequest {
  roomCode: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: UUID;
  username: string;
  avatarUrl: string | null;
  leagueTier: LeagueTier;
  leaguePoints: number;
}

export type StoreItemType = "avatar_skin" | "board_theme" | "tile_set" | "emote";

export interface StoreItem {
  key: string;
  type: StoreItemType;
  name: string;
  description: string;
  priceCoins: number;
  previewUrl: string | null;
  owned: boolean;
}

export interface PurchaseRequest {
  itemKey: string;
}

export interface PurchaseResponse {
  itemKey: string;
  coinsRemaining: number;
}

export interface MatchHistoryEntry {
  matchId: UUID;
  mode: MatchMode;
  winnerTeam: Team | null;
  finalScores: Scores;
  playedAt: Timestamp;
  result: "win" | "loss";
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
