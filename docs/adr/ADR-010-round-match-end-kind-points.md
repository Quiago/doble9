# ADR-010 — `round_end` / `match_end` carry `kind` (and `points` on match end)

- **Status**: Accepted
- **Date**: 2026-05-25
- **Deciders**: Architect (gap surfaced by Backend + Frontend during integration)
- **Related**: [ADR-006](ADR-006-ws-namespace-and-integration-rulings.md),
  the over-the-wire suite (`backend/tests/integration/`)

## Context

The end-of-round / end-of-match overlays in `GameTable.tsx` need to tell the
player *how* a round was decided — a hand emptied (**DOMINO**) or the board
locked and the lower pip-count team took it (**TRANQUE**) — and, at match end,
the points of the closing round for the results screen.

The backend already produces this: `state_machine._apply_round_outcome` emits
`kind` on both `round_end` and `match_end`, plus `points` on `match_end`, and
`runtime.py` now propagates them onto the wire (verified by
`test_full_solo_game_to_match_end`). The frontend already *reads* them.

But the **contract did not declare them**: `shared/types/game.d.ts` had
`RoundEndPayload { points, winnerTeam, scores }` (no `kind`) and
`MatchEndPayload { winnerTeam, scores }` (no `kind`, no `points`). Both agents
correctly refused to edit `shared/` without an ADR (CLAUDE.md §2.3). So the
field flowed end-to-end as an **undocumented** payload member — exactly the kind
of drift the contract exists to prevent.

## Decision

Make the wire reality the documented contract:

- Add `export type RoundEndKind = "DOMINO" | "TRANQUE"`.
- `RoundEndPayload` gains `kind: RoundEndKind`.
- `MatchEndPayload` gains `kind: RoundEndKind` and `points: number`.

`winnerTeam` stays `Team` (`teamA` | `teamB`) — the backend never emits null
(a tranque resolves to the lower pip-count team; ties resolve deterministically
in `scoring.py`). The defensive `winnerTeam === null` branch in `GameTable` is
harmless but corresponds to no backend state.

The AsyncAPI `RoundEnd` / `MatchEnd` messages keep the generic `ServerEnvelope`
(payloads are canonically defined in `shared/types/game.d.ts`); a comment on
each points at the exact fields for discoverability.

### Domain of `kind`

| Value | Meaning |
|-------|---------|
| `DOMINO` | A player emptied their hand; their team scores the opponents' pips. |
| `TRANQUE` | The board is locked (no legal move for anyone); the lower total-pip team wins the round. |

`POLLONA` / `CAPICUA` / `DOUBLE_9` remain **`special_play`** events
(`SpecialPlayType`), not `kind` values — `kind` is strictly the round-resolution
reason. This keeps the two concerns separate (a round can be a `DOMINO` *and*
carry a `POLLONA` special).

## Consequences

- **Positive**: FE↔BE contract matches the wire; TS consumers get
  `kind`/`points` typed; no behavioral change (purely declarative catch-up).
- **Neutral**: no code change required in FE or BE — they already produce/consume
  these. This ADR only ratifies and documents.

## Verification

- `backend/tests/integration/test_full_solo_game_to_match_end` asserts
  `round_end` carries `{points, winnerTeam, kind}` and `match_end` carries
  `kind` over the real wire.
- Backend unit tests (Backend agent, 103 total) cover `kind`/`points`
  propagation deterministically.
