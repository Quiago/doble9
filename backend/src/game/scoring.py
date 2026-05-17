# AGENT: Backend
"""Point counting, round resolution and special-play detection.

Scoring rule (one rule for both endings, so it stays testable):
the winning pair scores the **sum of pips still held by the opposing
pair**. The winner's partner's tiles are never counted.

Endings:
  * Domino  — a seat empties their hand. Their team wins.
  * Tranque — board blocked. Lower team-hand total wins; on an exact tie
    the team of the last seat that placed a tile wins ("el que cerró").

Special plays (`SpecialPlayType` in `shared/types/game.d.ts`):
  * DOUBLE_9 — the 9-9 was just laid (the Pollona animation trigger,
    `CLAUDE.md §4.4`).
  * CAPICUA  — the winning (hand-emptying) tile was playable on *both*
    open ends at the moment it closed the round.
  * POLLONA  — match-level skunk: the winning team hits the target while
    the losing team is still on 0. Detected at match end.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Literal

from src.game.rules import Seat, Team, opponent_team, seats_of, team_of
from src.game.tile import Tile

SpecialPlay = Literal["DOUBLE_9", "CAPICUA", "POLLONA"]

RoundEndKind = Literal["DOMINO", "TRANQUE"]


def hand_points(tiles: Sequence[Tile]) -> int:
    """Sum of pips across a hand."""
    return sum(t.pips for t in tiles)


def team_hand_points(hands: Mapping[Seat, Sequence[Tile]], team: Team) -> int:
    return sum(hand_points(hands[s]) for s in seats_of(team) if s in hands)


@dataclass(frozen=True, slots=True)
class RoundOutcome:
    kind: RoundEndKind
    winner_team: Team
    points: int


def resolve_domino(hands: Mapping[Seat, Sequence[Tile]], winner_seat: Seat) -> RoundOutcome:
    """`winner_seat` just played their last tile."""
    winner_team = team_of(winner_seat)
    losing_team = opponent_team(winner_team)
    return RoundOutcome(
        kind="DOMINO",
        winner_team=winner_team,
        points=team_hand_points(hands, losing_team),
    )


def resolve_tranque(
    hands: Mapping[Seat, Sequence[Tile]],
    last_placed_seat: Seat | None,
) -> RoundOutcome:
    """Board blocked: the lighter pair wins; tie broken by who closed."""
    a = team_hand_points(hands, "teamA")
    b = team_hand_points(hands, "teamB")
    if a < b:
        winner: Team = "teamA"
    elif b < a:
        winner = "teamB"
    else:
        winner = team_of(last_placed_seat) if last_placed_seat is not None else "teamA"
    return RoundOutcome(
        kind="TRANQUE",
        winner_team=winner,
        points=team_hand_points(hands, opponent_team(winner)),
    )


def special_plays_for_move(
    tile: Tile,
    *,
    could_play_both_ends: bool,
    hand_became_empty: bool,
) -> list[SpecialPlay]:
    """Special plays triggered by a single tile placement (excludes POLLONA,
    which is a match-end condition)."""
    specials: list[SpecialPlay] = []
    if tile.low == 9 and tile.high == 9:
        specials.append("DOUBLE_9")
    if hand_became_empty and could_play_both_ends:
        specials.append("CAPICUA")
    return specials


def is_pollona(winner_score: int, loser_score: int, target_score: int) -> bool:
    """Match-end skunk: winner reached the target, loser never scored."""
    return winner_score >= target_score and loser_score == 0
