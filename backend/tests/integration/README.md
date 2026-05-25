# Integration tests — real FE↔BE over the wire (Architect)

These tests drive the **live stack** the way the frontend does: a real uvicorn
server, real Postgres + Redis, the Socket.IO transport, the connect-auth
handshake (ADR-007), and the JSON envelope `{event, matchId, payload,
timestamp}`. The unit suite (`tests/`, in-process) cannot cover this boundary —
that gap is exactly where the "FE↔BE is broken" bugs live.

## Run

```bash
make infra-up     # Postgres :5433 + Redis :6379 (docker-compose)
make migrate      # create the schema in the live DB
make test-e2e     # boots a live server on a free port and drives it
```

`make check` (the CI gate) **excludes** these (`-m 'not integration'`), so it
stays hermetic and fast. The suite **self-skips** if the infra is unreachable,
so `make test-e2e` is safe to run anywhere.

## What each scenario proves

| Test | Proves |
|------|--------|
| `test_connect_rejected_without_token` | The `/game` `connect` handler refuses a socket with no JWT (ADR-007) — the contract the FE's `auth:{token,clientId}` must satisfy. |
| `test_rest_register_then_ws_snapshot` | The real boot path: REST register → JWT → WS connect → `join_lobby` → first authoritative `game_state` (10-tile hand, 4 players with `tilesCount`/`isBot`, conformant envelope). |
| `test_full_solo_game_to_match_end` | A whole solo match plays to `match_end` with a `winnerTeam`; **every** board on the wire is a valid oriented chain (the `is_flipped` orientation fix); `round_end` carries `points`/`winnerTeam`/`kind`; opponents expose `tilesCount`. |
| `test_illegal_move_emits_error` | An unheld tile is rejected with an `error` envelope — the trigger the dispatcher uses to roll back the optimistic hand (no more ghost tiles). |

The `SoloDriver` in `test_live_match_e2e.py` is a faithful mirror of the real
client model: it tracks its own hand locally (optimistic removal), reads the
board from `tile_placed`, reacts to `turn_changed`, and handles `turn: null` at
match end — so a green run means a human could actually play a match through the
UI, provided the auth gate (ADR-009) lets them in.
