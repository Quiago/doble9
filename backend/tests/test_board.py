"""Board chain geometry."""

import pytest

from src.game.board import Board, IllegalPlacement
from src.game.tile import Tile


def test_first_tile_opens_both_ends() -> None:
    b = Board()
    assert b.is_empty
    b.place(Tile(3, 5), "right", by_seat=0)
    assert b.open_ends() == (3, 5)
    assert not b.is_empty


def test_first_double_nine() -> None:
    b = Board()
    b.place(Tile(9, 9), "right", by_seat=2)
    assert b.left_end == 9 and b.right_end == 9


def test_extend_both_sides() -> None:
    b = Board()
    b.place(Tile(3, 5), "right", by_seat=0)  # ends 3 | 5
    b.place(Tile(3, 1), "left", by_seat=1)  # left 3 -> 1
    b.place(Tile(5, 8), "right", by_seat=2)  # right 5 -> 8
    assert b.open_ends() == (1, 8)
    assert len(b.tiles) == 3


def test_double_keeps_end_value() -> None:
    b = Board()
    b.place(Tile(4, 6), "right", by_seat=0)  # 4 | 6
    b.place(Tile(6, 6), "right", by_seat=1)  # 6 -> 6
    assert b.right_end == 6


def test_illegal_placement_raises() -> None:
    b = Board()
    b.place(Tile(3, 5), "right", by_seat=0)
    with pytest.raises(IllegalPlacement):
        b.place(Tile(1, 2), "right", by_seat=1)
    assert not b.can_place(Tile(1, 2), "left")


def test_playable_sides() -> None:
    b = Board()
    assert b.playable_sides(Tile(0, 0)) == ["right"]  # empty board
    b.place(Tile(3, 5), "right", by_seat=0)
    assert b.playable_sides(Tile(3, 9)) == ["left"]
    assert b.playable_sides(Tile(5, 9)) == ["right"]
    assert sorted(b.playable_sides(Tile(3, 5))) == ["left", "right"]
    assert b.playable_sides(Tile(1, 2)) == []


def test_to_dict_contract_shape() -> None:
    b = Board()
    b.place(Tile(3, 5), "right", by_seat=0)
    b.place(Tile(5, 7), "right", by_seat=1)
    d = b.to_dict()
    assert d["leftEnd"] == 3 and d["rightEnd"] == 7
    assert d["tiles"][0] == {"id": "3-5", "ends": (3, 5), "order": 0, "bySeat": 0}
    assert d["tiles"][1]["bySeat"] == 1 and d["tiles"][1]["order"] == 1


# ── orientation (`is_flipped`) — the wire `ends` must read as a continuous
# left→right chain so the frontend renders dominoes connected (the bug the
# integration suite caught). `tiles` is already in spatial order.


def _assert_continuous(b: Board) -> None:
    """Adjacent serialized tiles share the touching pip; chain ends match."""
    tiles = b.to_dict()["tiles"]
    for left, right in zip(tiles, tiles[1:]):  # noqa: B905 - intentional pairing
        assert left["ends"][1] == right["ends"][0], (left, right)
    if tiles:
        assert tiles[0]["ends"][0] == b.left_end
        assert tiles[-1]["ends"][1] == b.right_end


def test_orientation_right_flips_when_high_matches() -> None:
    b = Board()
    b.place(Tile(3, 5), "right", by_seat=0)  # ends (3,5), right_end 5
    placed = b.place(Tile(2, 5), "right", by_seat=1)  # high(5)==end → flip
    assert placed.is_flipped
    assert placed.to_dict()["ends"] == (5, 2)
    assert b.right_end == 2
    _assert_continuous(b)


def test_orientation_right_no_flip_when_low_matches() -> None:
    b = Board()
    b.place(Tile(3, 5), "right", by_seat=0)  # right_end 5
    placed = b.place(Tile(5, 7), "right", by_seat=1)  # low(5)==end → no flip
    assert not placed.is_flipped
    assert placed.to_dict()["ends"] == (5, 7)
    _assert_continuous(b)


def test_orientation_left_flips_when_low_matches() -> None:
    b = Board()
    b.place(Tile(3, 5), "right", by_seat=0)  # left_end 3
    placed = b.place(Tile(3, 8), "left", by_seat=1)  # low(3)==end → flip
    assert placed.is_flipped
    assert placed.to_dict()["ends"] == (8, 3)
    assert b.left_end == 8
    _assert_continuous(b)


def test_orientation_left_no_flip_when_high_matches() -> None:
    b = Board()
    b.place(Tile(3, 5), "right", by_seat=0)  # left_end 3
    placed = b.place(Tile(1, 3), "left", by_seat=1)  # high(3)==end → no flip
    assert not placed.is_flipped
    assert placed.to_dict()["ends"] == (1, 3)
    assert b.left_end == 1
    _assert_continuous(b)


def test_orientation_double_is_symmetric() -> None:
    b = Board()
    b.place(Tile(4, 6), "right", by_seat=0)  # right_end 6
    placed = b.place(Tile(6, 6), "right", by_seat=1)  # double: flip is a no-op
    assert placed.to_dict()["ends"] == (6, 6)
    assert b.right_end == 6
    _assert_continuous(b)


def test_orientation_long_mixed_chain() -> None:
    b = Board()
    b.place(Tile(3, 5), "right", by_seat=0)
    b.place(Tile(5, 9), "right", by_seat=1)  # 5→9
    b.place(Tile(3, 7), "left", by_seat=2)  # flips: (7,3)
    b.place(Tile(7, 7), "left", by_seat=3)  # double on left
    b.place(Tile(9, 0), "right", by_seat=0)  # 9→0
    _assert_continuous(b)
    assert b.left_end == 7 and b.right_end == 0
