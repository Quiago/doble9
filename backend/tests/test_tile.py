"""Tile model + deck invariants."""

import pytest

from src.game.tile import Tile, generate_double_nine_deck


def test_canonical_order() -> None:
    assert Tile(5, 3) == Tile(3, 5)
    t = Tile(7, 2)
    assert (t.low, t.high) == (2, 7)
    assert t.id == "2-7"
    assert t.ends == (2, 7)


def test_from_id_roundtrip() -> None:
    for t in generate_double_nine_deck():
        assert Tile.from_id(t.id) == t


@pytest.mark.parametrize("bad", ["", "9", "a-b", "1-2-3", "10-1"])
def test_from_id_rejects_garbage(bad: str) -> None:
    with pytest.raises(ValueError):
        Tile.from_id(bad)


@pytest.mark.parametrize("pair", [(-1, 3), (3, 10), (0, 99)])
def test_pip_range_enforced(pair: tuple[int, int]) -> None:
    with pytest.raises(ValueError):
        Tile(*pair)


def test_pips_double_and_values() -> None:
    assert Tile(4, 6).pips == 10
    assert Tile(9, 9).is_double
    assert not Tile(8, 9).is_double
    assert Tile(2, 5).values == frozenset({2, 5})


def test_other_end() -> None:
    assert Tile(3, 7).other_end(3) == 7
    assert Tile(3, 7).other_end(7) == 3
    # A double leaves its own value exposed.
    assert Tile(5, 5).other_end(5) == 5
    with pytest.raises(ValueError):
        Tile(3, 7).other_end(4)


def test_deck_is_full_double_nine() -> None:
    deck = generate_double_nine_deck()
    assert len(deck) == 55
    assert len(set(deck)) == 55
    assert sum(1 for t in deck if t.is_double) == 10
    assert Tile(0, 0) in deck and Tile(9, 9) in deck
