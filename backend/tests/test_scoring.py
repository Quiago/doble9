"""Point counting, round resolution, special plays."""

from src.game.scoring import (
    hand_points,
    is_pollona,
    resolve_domino,
    resolve_tranque,
    special_plays_for_move,
    team_hand_points,
)
from src.game.tile import Tile


def test_hand_and_team_points() -> None:
    hands = {
        0: [Tile(3, 4)],  # 7
        1: [Tile(1, 1), Tile(0, 2)],  # 4
        2: [Tile(5, 5)],  # 10
        3: [],
    }
    assert hand_points(hands[1]) == 4
    assert team_hand_points(hands, "teamA") == 17  # seats 0+2
    assert team_hand_points(hands, "teamB") == 4  # seats 1+3


def test_resolve_domino_scores_opponents_only() -> None:
    hands = {0: [], 1: [Tile(4, 5)], 2: [Tile(2, 2)], 3: [Tile(0, 1)]}
    out = resolve_domino(hands, winner_seat=0)
    assert out.kind == "DOMINO"
    assert out.winner_team == "teamA"
    # Only teamB (seats 1+3) counts: 9 + 1 = 10.
    assert out.points == 10


def test_resolve_tranque_lower_hand_wins() -> None:
    hands = {0: [Tile(1, 1)], 1: [Tile(6, 6)], 2: [Tile(0, 1)], 3: [Tile(5, 5)]}
    out = resolve_tranque(hands, last_placed_seat=1)
    assert out.kind == "TRANQUE"
    assert out.winner_team == "teamA"  # 3 vs 22
    assert out.points == 22


def test_resolve_tranque_tie_broken_by_closer() -> None:
    hands = {0: [Tile(2, 2)], 1: [Tile(2, 2)], 2: [], 3: []}  # 4 vs 4
    assert resolve_tranque(hands, last_placed_seat=1).winner_team == "teamB"
    assert resolve_tranque(hands, last_placed_seat=0).winner_team == "teamA"
    assert resolve_tranque(hands, last_placed_seat=None).winner_team == "teamA"


def test_special_plays() -> None:
    assert special_plays_for_move(
        Tile(9, 9), could_play_both_ends=False, hand_became_empty=False
    ) == ["DOUBLE_9"]
    assert special_plays_for_move(
        Tile(2, 5), could_play_both_ends=True, hand_became_empty=True
    ) == ["CAPICUA"]
    assert (
        special_plays_for_move(Tile(2, 5), could_play_both_ends=True, hand_became_empty=False) == []
    )
    assert special_plays_for_move(
        Tile(9, 9), could_play_both_ends=True, hand_became_empty=True
    ) == ["DOUBLE_9", "CAPICUA"]


def test_is_pollona() -> None:
    assert is_pollona(winner_score=100, loser_score=0, target_score=100)
    assert not is_pollona(winner_score=100, loser_score=5, target_score=100)
    assert not is_pollona(winner_score=90, loser_score=0, target_score=100)
