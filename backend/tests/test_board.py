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
