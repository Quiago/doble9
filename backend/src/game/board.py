# AGENT: Backend
"""The domino chain (board) with its two open ends.

Authoritative geometry only — no turn/seat policy lives here (that is
`rules.py` / `state_machine.py`). Serialises to the contract `Board`
shape (`shared/types/game.d.ts`): `{ tiles, leftEnd, rightEnd }` where
each `PlacedTile` is `{ id, ends, order, bySeat }`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, TypedDict

from src.game.tile import Pip, Tile

BoardSide = Literal["left", "right"]
Seat = int  # 0..3, validated by rules/state machine.


class PlacedTileDict(TypedDict):
    id: str
    ends: tuple[Pip, Pip]
    order: int
    bySeat: Seat


class BoardDict(TypedDict):
    tiles: list[PlacedTileDict]
    leftEnd: Pip | None
    rightEnd: Pip | None


@dataclass(frozen=True, slots=True)
class PlacedTile:
    """A tile committed to the chain, with provenance for the contract."""

    tile: Tile
    order: int
    by_seat: Seat

    def to_dict(self) -> PlacedTileDict:
        return {
            "id": self.tile.id,
            "ends": self.tile.ends,
            "order": self.order,
            "bySeat": self.by_seat,
        }


class IllegalPlacement(ValueError):
    """Raised when a tile cannot legally connect to the requested side."""


@dataclass(slots=True)
class Board:
    """Mutable two-ended domino chain. The first tile is the spinner."""

    _tiles: list[PlacedTile] = field(default_factory=list)
    _left_end: Pip | None = None
    _right_end: Pip | None = None

    @property
    def is_empty(self) -> bool:
        return not self._tiles

    @property
    def left_end(self) -> Pip | None:
        return self._left_end

    @property
    def right_end(self) -> Pip | None:
        return self._right_end

    @property
    def tiles(self) -> tuple[PlacedTile, ...]:
        return tuple(self._tiles)

    def open_ends(self) -> tuple[Pip, Pip] | None:
        """The two pips currently exposed, or None if the board is empty."""
        if self._left_end is None or self._right_end is None:
            return None
        return (self._left_end, self._right_end)

    def can_place(self, tile: Tile, side: BoardSide) -> bool:
        """True if `tile` may legally connect to `side`.

        On an empty board the first tile is always legal (either side); the
        chosen side is irrelevant since both ends open up.
        """
        if self.is_empty:
            return True
        end = self._left_end if side == "left" else self._right_end
        assert end is not None  # non-empty board always has both ends set
        return tile.matches(end)

    def playable_sides(self, tile: Tile) -> list[BoardSide]:
        """Sides where `tile` can be placed (deduped: a double matching one
        end is playable, the side is a render choice)."""
        if self.is_empty:
            return ["right"]
        sides: tuple[BoardSide, BoardSide] = ("left", "right")
        return [s for s in sides if self.can_place(tile, s)]

    def place(self, tile: Tile, side: BoardSide, by_seat: Seat) -> PlacedTile:
        """Commit `tile` to the chain. Raises `IllegalPlacement` if illegal."""
        if not self.can_place(tile, side):
            raise IllegalPlacement(
                f"{tile.id} cannot connect to {side} end "
                f"(ends: left={self._left_end}, right={self._right_end})"
            )

        placed = PlacedTile(tile=tile, order=len(self._tiles), by_seat=by_seat)

        if self.is_empty:
            self._left_end = tile.low
            self._right_end = tile.high
            self._tiles.append(placed)
            return placed

        if side == "left":
            assert self._left_end is not None
            self._left_end = tile.other_end(self._left_end)
            self._tiles.insert(0, placed)
        else:
            assert self._right_end is not None
            self._right_end = tile.other_end(self._right_end)
            self._tiles.append(placed)
        return placed

    def to_dict(self) -> BoardDict:
        return {
            "tiles": [p.to_dict() for p in self._tiles],
            "leftEnd": self._left_end,
            "rightEnd": self._right_end,
        }
