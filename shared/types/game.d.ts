// shared/types/game.d.ts — Cross-agent game contract (Architect owns).
// FE consumes these; BE MUST emit/accept exactly these shapes.
// Source of truth for the Dispatcher (ADR-001) and WS protocol (ADR-004).
// Any change here REQUIRES an ADR + update of contracts/websocket.yml.

/** Pip value on one half of a tile, 0..9 (double-nine set). */
export type Pip = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Canonical tile id: `"{low}-{high}"`, low <= high. e.g. "3-5", "9-9". */
export type TileId = string;

export interface Tile {
  id: TileId;
  /** [a, b] as dealt/held — render order is a FE concern. */
  ends: [Pip, Pip];
}

/** Which open end of the board chain a tile is played onto. */
export type BoardSide = "left" | "right";

export interface PlacedTile {
  id: TileId;
  ends: [Pip, Pip];
  /** Order in which it was laid (0 = first/spinner). */
  order: number;
  /** Seat that played it. */
  bySeat: Seat;
}

export interface Board {
  tiles: PlacedTile[];
  /** Open pip at the left end (what a new left tile must match). */
  leftEnd: Pip | null;
  /** Open pip at the right end. */
  rightEnd: Pip | null;
}

export type Seat = 0 | 1 | 2 | 3;
/** 2v2: seats 0&2 = teamA, seats 1&3 = teamB. */
export type Team = "teamA" | "teamB";
export type UserId = string;

export interface PublicPlayer {
  seat: Seat;
  userId: UserId;
  name: string;
  team: Team;
  /** Tiles still in hand (count only — hands are private). */
  tilesCount: number;
  isBot: boolean;
  connected: boolean;
}

export interface Scores {
  teamA: number;
  teamB: number;
}

export type MatchStatus =
  | "LOBBY"
  | "DEALING"
  | "PLAYING"
  | "SCORING"
  | "FINISHED";

export interface TurnInfo {
  seat: Seat;
  userId: UserId;
  /** Epoch ms when the turn auto-passes / times out. */
  deadline: number;
}

/** Full authoritative snapshot. BE -> `game_state`. Per-player: `hand`
 *  is present only in the recipient's own copy. */
export interface GameState {
  matchId: string;
  status: MatchStatus;
  players: PublicPlayer[];
  board: Board;
  /** Recipient's private hand. Omitted for spectators / other players. */
  hand?: TileId[];
  turn: TurnInfo | null;
  scores: Scores;
  round: number;
  targetScore: number;
  boneyardCount: number;
  /** Epoch ms of last authoritative mutation (reconnect replay anchor). */
  lastActionAt: number;
  /** True when the recipient must pass (no legal moves). */
  canPass?: boolean;
}

export type SpecialPlayType = "DOUBLE_9" | "CAPICUA" | "POLLONA";

// ── Dispatcher action (FE internal, ADR-001) ──────────────────────────────
export interface Action<T = unknown> {
  type: string;
  payload: T;
  meta?: { clientId: string; timestamp: number };
}

// ── Client -> Server (WS emits, see contracts/websocket.yml) ──────────────
export type ClientAction =
  | "join_lobby"
  | "player_ready"
  | "start_match"
  | "play_tile"
  | "pass_turn"
  | "request_tile"
  | "send_chat";

export interface PlayTilePayload {
  matchId: string;
  tileId: TileId;
  side: BoardSide;
  /** 0 | 90 — display rotation hint for doubles; BE is authoritative. */
  rotation?: 0 | 90;
}

export interface ClientMessage<P = unknown> {
  action: ClientAction;
  matchId: string;
  payload: P;
}

// ── Server -> Client (WS events) ──────────────────────────────────────────
export type ServerEvent =
  | "game_state"
  | "tile_placed"
  | "turn_changed"
  | "special_play"
  | "chat_message"
  | "player_joined"
  | "player_disconnected"
  | "round_end"
  | "match_end"
  | "error"
  | "player_passed";

export interface ServerMessage<P = unknown> {
  event: ServerEvent;
  matchId: string;
  payload: P;
  /** Epoch ms, server clock. */
  timestamp: number;
}

export interface TilePlacedPayload {
  bySeat: Seat;
  tile: Tile;
  side: BoardSide;
  board: Board;
}

export interface TurnChangedPayload {
  turn: TurnInfo;
}

export interface SpecialPlayPayload {
  type: SpecialPlayType;
  bySeat: Seat;
}

export interface ChatMessagePayload {
  bySeat: Seat;
  userId: UserId;
  message: string;
}

export interface RoundEndPayload {
  points: number;
  winnerTeam: Team;
  scores: Scores;
}

export interface MatchEndPayload {
  winnerTeam: Team;
  scores: Scores;
}

export interface PlayerDisconnectedPayload {
  seat: Seat;
  userId: UserId;
  /** Seconds before the seat is forfeited / bot-substituted. */
  timeoutSeconds: number;
}

export interface ErrorPayload {
  code: string;
  message: string;
}
