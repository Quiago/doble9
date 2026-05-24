# AGENT: Backend
"""`MatchStateMachine` — the single authoritative owner of a match.

Every state mutation flows through here (`CLAUDE.md §5.3`); the network
layer only translates WS messages into method calls and broadcasts the
returned `Result`. Snapshots match `GameState` in
`shared/types/game.d.ts` exactly.

States: LOBBY → DEALING → PLAYING → SCORING → (PLAYING | FINISHED).
"""

from __future__ import annotations

import random
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Literal, TypedDict

from src.game.board import Board
from src.game.rules import (
    DEFAULT_TARGET_SCORE,
    DOUBLE_NINE,
    NUM_PLAYERS,
    Seat,
    Team,
    deal,
    has_legal_move,
    is_blocked,
    next_seat,
    opening_move,
    opponent_team,
    seats_of,
    team_of,
)
from src.game.scoring import (
    SpecialPlay,
    is_pollona,
    resolve_domino,
    resolve_tranque,
)
from src.game.tile import Tile

MatchStatus = Literal["LOBBY", "DEALING", "PLAYING", "SCORING", "FINISHED"]
BoardSide = Literal["left", "right"]

TURN_SECONDS = 30


# ── Result ────────────────────────────────────────────────────────────────
@dataclass(frozen=True, slots=True)
class Result:
    """Outcome of an authoritative action. `event` mirrors the WS event the
    gateway should broadcast (`shared/types/game.d.ts` `ServerEvent`)."""

    success: bool
    event: str | None = None
    payload: dict[str, object] = field(default_factory=dict)
    error_message: str | None = None
    specials: tuple[SpecialPlay, ...] = ()

    @classmethod
    def ok(
        cls,
        event: str,
        payload: dict[str, object] | None = None,
        specials: tuple[SpecialPlay, ...] = (),
    ) -> Result:
        return cls(True, event=event, payload=payload or {}, specials=specials)

    @classmethod
    def error(cls, message: str) -> Result:
        return cls(False, event="error", error_message=message)


# ── Players / snapshot shapes ─────────────────────────────────────────────
@dataclass(slots=True)
class Player:
    seat: Seat
    user_id: str
    name: str
    is_bot: bool = False
    connected: bool = True


class PublicPlayerDict(TypedDict):
    seat: Seat
    userId: str
    name: str
    team: Team
    tilesCount: int
    isBot: bool
    connected: bool


class TurnInfoDict(TypedDict):
    seat: Seat
    userId: str
    deadline: int


class GameStateDict(TypedDict):
    matchId: str
    status: MatchStatus
    players: list[PublicPlayerDict]
    board: object
    hand: list[str]
    turn: TurnInfoDict | None
    scores: dict[str, int]
    round: int
    targetScore: int
    boneyardCount: int
    lastActionAt: int
    canPass: bool


class MatchError(Exception):
    """Domain error surfaced as a failed `Result`, never an HTTP 500."""


class MatchStateMachine:
    def __init__(
        self,
        match_id: str,
        players: list[Player],
        *,
        target_score: int = DEFAULT_TARGET_SCORE,
        rng: random.Random | None = None,
        clock: Callable[[], float] = time.time,
        turn_seconds: int = TURN_SECONDS,
    ) -> None:
        if len(players) != NUM_PLAYERS:
            raise MatchError(f"need exactly {NUM_PLAYERS} players, got {len(players)}")
        seats = sorted(p.seat for p in players)
        if seats != [0, 1, 2, 3]:
            raise MatchError(f"seats must be exactly 0..3, got {seats}")

        self.match_id = match_id
        self.players: dict[Seat, Player] = {p.seat: p for p in players}
        self.target_score = target_score
        self._rng = rng or random.Random()
        self._clock = clock
        self._turn_ms = turn_seconds * 1000

        self.status: MatchStatus = "LOBBY"
        self.round = 0
        self.scores: dict[str, int] = {"teamA": 0, "teamB": 0}
        self.board = Board()
        self.hands: dict[Seat, list[Tile]] = {}
        self.boneyard: list[Tile] = []
        self.turn_seat: Seat | None = None
        self._mandatory_tile: Tile | None = None
        self._last_placed_seat: Seat | None = None
        self._passes_in_row = 0
        self.last_action_at: int = self._now_ms()

    # ── clock helpers ────────────────────────────────────────────────────
    def _now_ms(self) -> int:
        return int(self._clock() * 1000)

    def _touch(self) -> None:
        self.last_action_at = self._now_ms()

    def _turn_deadline(self) -> int:
        return self._now_ms() + self._turn_ms

    @property
    def mandatory_tile(self) -> Tile | None:
        """The tile a move is currently forced to (round-1 opening 9-9),
        else None. Read-only view for the bot/match service."""
        return self._mandatory_tile

    def _seat_of(self, user_id: str) -> Seat | None:
        for seat, p in self.players.items():
            if p.user_id == user_id:
                return seat
        return None

    # ── lifecycle ────────────────────────────────────────────────────────
    def start(self) -> Result:
        """LOBBY → first round. Round 1 opener holds & must play the 9-9."""
        if self.status != "LOBBY":
            return Result.error(f"cannot start from {self.status}")
        self.round = 0
        self._begin_round(opener=None)
        return Result.ok("game_state", {"state": self.snapshot()})

    def _begin_round(self, opener: Seat | None) -> None:
        self.status = "DEALING"
        self.round += 1
        self.board = Board()
        self.hands, self.boneyard = deal(self._rng)
        self._passes_in_row = 0
        self._last_placed_seat = None
        if self.round == 1:
            self.turn_seat, self._mandatory_tile = opening_move(self.hands)
        else:
            assert opener is not None
            self.turn_seat = opener
            self._mandatory_tile = None
        self.status = "PLAYING"
        self._touch()

    # ── actions ──────────────────────────────────────────────────────────
    def play_tile(self, user_id: str, tile_id: str, side: BoardSide) -> Result:
        if self.status != "PLAYING":
            return Result.error(f"not accepting moves in state {self.status}")
        seat = self._seat_of(user_id)
        if seat is None:
            return Result.error("not a participant in this match")
        if seat != self.turn_seat:
            return Result.error("not your turn")

        try:
            tile = Tile.from_id(tile_id)
        except ValueError as exc:
            return Result.error(str(exc))
        if tile not in self.hands[seat]:
            return Result.error(f"tile {tile_id} not in hand")
        if self._mandatory_tile is not None and tile != self._mandatory_tile:
            return Result.error(
                f"opening move must be the highest double ({self._mandatory_tile.id})"
            )
        if not self.board.can_place(tile, side):
            return Result.error(f"illegal move: {tile_id} cannot connect to {side}")

        could_play_both_ends = len(self.board.playable_sides(tile)) == 2 and not self.board.is_empty

        self.board.place(tile, side, seat)
        self.hands[seat].remove(tile)
        self._last_placed_seat = seat
        self._passes_in_row = 0
        self._mandatory_tile = None
        self._touch()

        hand_empty = not self.hands[seat]
        specials: list[SpecialPlay] = []
        if tile == DOUBLE_NINE:
            specials.append("DOUBLE_9")
        if hand_empty and could_play_both_ends:
            specials.append("CAPICUA")

        if hand_empty:
            outcome = resolve_domino(self.hands, seat)
            return self._apply_round_outcome(
                outcome.winner_team, outcome.points, "DOMINO", tuple(specials)
            )

        if is_blocked(self.hands, self.board):
            outcome = resolve_tranque(self.hands, self._last_placed_seat)
            return self._apply_round_outcome(
                outcome.winner_team, outcome.points, "TRANQUE", tuple(specials)
            )

        self.turn_seat = next_seat(seat)
        return Result.ok(
            "tile_placed",
            {
                "bySeat": seat,
                "tile": {"id": tile.id, "ends": list(tile.ends)},
                "side": side,
                "board": self.board.to_dict(),
                "turn": self._turn_info(),
            },
            tuple(specials),
        )

    def pass_turn(self, user_id: str) -> Result:
        if self.status != "PLAYING":
            return Result.error(f"not accepting moves in state {self.status}")
        seat = self._seat_of(user_id)
        if seat is None:
            return Result.error("not a participant in this match")
        if seat != self.turn_seat:
            return Result.error("not your turn")
        if has_legal_move(self.hands[seat], self.board, mandatory_tile=self._mandatory_tile):
            return Result.error("you have a legal move; cannot pass")

        self._passes_in_row += 1
        self._touch()

        if is_blocked(self.hands, self.board):
            outcome = resolve_tranque(self.hands, self._last_placed_seat)
            return self._apply_round_outcome(outcome.winner_team, outcome.points, "TRANQUE", ())

        self.turn_seat = next_seat(seat)
        return Result.ok("player_passed", {"turn": self._turn_info()})

    # ── round / match resolution ─────────────────────────────────────────
    def _apply_round_outcome(
        self,
        winner_team: Team,
        points: int,
        kind: Literal["DOMINO", "TRANQUE"],
        specials: tuple[SpecialPlay, ...],
    ) -> Result:
        self.status = "SCORING"
        self.scores[winner_team] += points
        self.turn_seat = None
        self._touch()

        winner_score = self.scores[winner_team]
        loser_team = opponent_team(winner_team)
        loser_score = self.scores[loser_team]

        if winner_score >= self.target_score:
            self.status = "FINISHED"
            if is_pollona(winner_score, loser_score, self.target_score):
                specials = (*specials, "POLLONA")
            return Result.ok(
                "match_end",
                {
                    "winnerTeam": winner_team,
                    "scores": dict(self.scores),
                    "kind": kind,
                    "points": points,
                    "state": self.snapshot(),
                },
                specials,
            )

        next_opener = seats_of(winner_team)[0]
        result = Result.ok(
            "round_end",
            {
                "winnerTeam": winner_team,
                "points": points,
                "kind": kind,
                "scores": dict(self.scores),
            },
            specials,
        )
        self._begin_round(opener=next_opener)
        return result

    # ── snapshots ────────────────────────────────────────────────────────
    def _turn_info(self) -> TurnInfoDict | None:
        if self.turn_seat is None:
            return None
        return {
            "seat": self.turn_seat,
            "userId": self.players[self.turn_seat].user_id,
            "deadline": self._turn_deadline(),
        }

    def _public_players(self) -> list[PublicPlayerDict]:
        return [
            {
                "seat": seat,
                "userId": p.user_id,
                "name": p.name,
                "team": team_of(seat),
                "tilesCount": len(self.hands.get(seat, [])),
                "isBot": p.is_bot,
                "connected": p.connected,
            }
            for seat, p in sorted(self.players.items())
        ]

    def snapshot(self, for_user_id: str | None = None) -> GameStateDict:
        """Authoritative `GameState`. Private `hand` is only the recipient's
        own tiles (empty list for spectators / other players)."""
        hand: list[str] = []
        can_pass = False
        if for_user_id is not None:
            seat = self._seat_of(for_user_id)
            if seat is not None:
                hand = [t.id for t in self.hands.get(seat, [])]
                # canPass: it's my turn AND I have no legal move
                if (
                    self.status == "PLAYING"
                    and self.turn_seat == seat
                    and not has_legal_move(
                        self.hands[seat], self.board,
                        mandatory_tile=self._mandatory_tile,
                    )
                ):
                    can_pass = True
        return {
            "matchId": self.match_id,
            "status": self.status,
            "players": self._public_players(),
            "board": self.board.to_dict(),
            "hand": hand,
            "turn": self._turn_info(),
            "scores": dict(self.scores),
            "round": self.round,
            "targetScore": self.target_score,
            "boneyardCount": len(self.boneyard),
            "lastActionAt": self.last_action_at,
            "canPass": can_pass,
        }
