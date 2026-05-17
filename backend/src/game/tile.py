# AGENT: Backend
"""Domino tile model and the double-nine deck.

Contract (`shared/types/game.d.ts`):
  * `Pip` = 0..9
  * `TileId` = `"{low}-{high}"` with `low <= high` (canonical, e.g. "3-5", "9-9")

A tile is value-typed and canonicalised on construction so that "3-5" and
"5-3" are the same object and hash/compare equal. Render orientation is a
frontend concern and is intentionally NOT modelled here.
"""

from __future__ import annotations

from dataclasses import dataclass

# A pip value on one half of a tile. Kept as plain int (mypy-strict friendly);
# range is enforced in `Tile.__post_init__`.
Pip = int

MIN_PIP = 0
MAX_PIP = 9


@dataclass(frozen=True, slots=True, order=True)
class Tile:
    """An immutable double-nine domino tile, stored canonically (low <= high)."""

    low: Pip
    high: Pip

    def __post_init__(self) -> None:
        a, b = self.low, self.high
        if not (MIN_PIP <= a <= MAX_PIP) or not (MIN_PIP <= b <= MAX_PIP):
            raise ValueError(f"pip out of range 0..9: ({a}, {b})")
        if a > b:
            # Frozen dataclass: rewrite fields to keep the canonical invariant.
            object.__setattr__(self, "low", b)
            object.__setattr__(self, "high", a)

    @classmethod
    def of(cls, a: Pip, b: Pip) -> Tile:
        """Build a tile from two pips in any order."""
        return cls(min(a, b), max(a, b))

    @classmethod
    def from_id(cls, tile_id: str) -> Tile:
        """Parse a canonical `"{low}-{high}"` id."""
        try:
            a_str, b_str = tile_id.split("-")
            return cls.of(int(a_str), int(b_str))
        except (ValueError, AttributeError) as exc:
            raise ValueError(f"invalid TileId: {tile_id!r}") from exc

    @property
    def id(self) -> str:
        """Canonical contract id, e.g. `"3-5"`, `"9-9"`."""
        return f"{self.low}-{self.high}"

    @property
    def ends(self) -> tuple[Pip, Pip]:
        """`[a, b]` for the contract `Tile.ends`. Canonical (low, high)."""
        return (self.low, self.high)

    @property
    def pips(self) -> int:
        """Total pip value — what hands are scored by."""
        return self.low + self.high

    @property
    def is_double(self) -> bool:
        return self.low == self.high

    @property
    def values(self) -> frozenset[Pip]:
        return frozenset((self.low, self.high))

    def matches(self, pip: Pip) -> bool:
        """True if this tile can connect to an open end showing `pip`."""
        return pip in (self.low, self.high)

    def other_end(self, pip: Pip) -> Pip:
        """Given the connecting pip, the value left exposed on the chain.

        For a double both halves equal `pip`, so the exposed value is `pip`.
        """
        if not self.matches(pip):
            raise ValueError(f"{self.id} does not contain pip {pip}")
        return self.high if self.low == pip else self.low

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"Tile({self.id})"


def generate_double_nine_deck() -> list[Tile]:
    """The full double-nine set: every unordered pair 0..9 → 55 tiles.

    C(10, 2) + 10 doubles = 45 + 10 = 55 (`CLAUDE.md §5.3`).
    """
    return [Tile(low, high) for low in range(MAX_PIP + 1) for high in range(low, MAX_PIP + 1)]
