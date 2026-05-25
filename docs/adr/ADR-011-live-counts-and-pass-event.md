# ADR-011 — Conteos de fichas en vivo y evento `player_passed` en el contrato

- **Status**: Accepted
- **Date**: 2026-05-25
- **Deciders**: Architect (a raíz de bugs de juego reportados por el usuario)
- **Related**: [ADR-004](ADR-004-ws-reconnect-protocol.md) (buffer/eventos),
  [ADR-010](ADR-010-round-match-end-kind-points.md)

## Context

Tres bugs de jugabilidad observados en vivo (FE↔BE):

1. **Conteos de rivales congelados** (muestran 9/10 cuando ya jugaron). Causa:
   el payload `tile_placed` (`{bySeat, tile, side, board}`) **no lleva el conteo
   actualizado**, y el FE solo aplica el tablero — nunca decrementa
   `players[bySeat].tilesCount`. Los conteos solo se refrescan con un
   `game_state` completo (join + fin de ronda/partida), no durante el juego.

2. **No se anuncia el "PASO"**. El backend emite `player_passed`, está en la
   unión `ServerEvent` de `shared/`, **pero falta en el enum del contrato
   AsyncAPI** y —crítico— el FE no lo registra como listener de socket (el
   handler del dispatcher es código muerto). El evento se cae al piso.

3. **Jugada legal rechazada** (p. ej. 6-9 sobre un extremo abierto en 6). La
   lógica de legalidad del backend es **correcta** (la suite e2e juega partidas
   completas con ella). El síntoma es del FE: render del tablero truncado/no
   fiel + resolución del lado de drop por píxel (`center→right`) que manda el
   lado equivocado. **No es un bug de contrato**; queda como tarea Frontend.

Este ADR cubre lo que es frontera de contrato (1 y 2). El render del tablero y
el drag/drop (3) son territorio Frontend puro y van por directiva, sin contrato.

## Decision

### 1. `TilePlacedPayload` lleva `handCount`

`tile_placed` incluye `handCount: number` = fichas restantes en la mano del
asiento que jugó (`bySeat`), **autoritativo**. El FE actualiza
`players[bySeat].tilesCount = handCount`. Autoritativo > decremento local
(sobrevive a reconexión y a ráfagas de eventos de bots).

```ts
export interface TilePlacedPayload {
  bySeat: Seat;
  tile: Tile;
  side: BoardSide;
  board: Board;
  handCount: number; // ADR-011: fichas restantes de bySeat tras jugar
}
```

### 2. `player_passed` formalizado en el contrato

Ya en la unión `ServerEvent`; se añade su payload y se documenta en el AsyncAPI:

```ts
export interface PlayerPassedPayload {
  bySeat: Seat;
}
```

El FE **debe** registrarlo en `SERVER_EVENTS` (services/websocket.ts) o nunca lo
recibe. El backend ya lo emite (`runtime.py` → `_translate` rama
`player_passed`).

## Consequences

- **Backend**: añade `handCount` al envelope `tile_placed` en `runtime.py`
  (`len(self.sm.hands[seat])` tras la jugada). Cambio mínimo, +1 test.
- **Frontend**: consume `handCount`; registra `player_passed`; render de manos
  rivales boca abajo por conteo; pacing de turnos. (Directiva separada.)
- **Compat**: `handCount` es aditivo; clientes viejos lo ignoran.

## Verification

- e2e (`backend/tests/integration/`): extender
  `test_full_solo_game_to_match_end` para aseverar que cada `tile_placed`
  trae `handCount` y que decrece para un mismo asiento.
- Unit backend: `handCount == 10 - jugadas_del_asiento`.

## Addendum (2026-05-25) — `player_passed` debe bufferizarse para reconexión

Hallazgo del agente Backend durante la integración: `player_passed` se emite en
`runtime.py` pero **no está en el set `_PUBLIC`**, por lo que no entra al
`_buffer` de replay-delta de reconexión (ADR-004). Efecto: un cliente que se
reconecta justo tras un "PASO" solo lo recibe vía `game_state` completo, nunca
como delta — inconsistente con el resto de eventos de juego (`tile_placed`,
`turn_changed`, `round_end`, …) que sí se bufferizan.

**Decisión**: `player_passed` es un evento de juego autoritativo con el mismo
ciclo de vida que `tile_placed`; **debe** estar en `_PUBLIC`. No cambia el
contrato del cable (ya viajaba); solo corrige qué se reproduce en reconexión.

**Backend**: añadir `"player_passed"` a `_PUBLIC` en `src/ws/runtime.py`. Test:
tras un pase, el `_buffer` (o el delta de `replay(since=...)`) contiene el
envelope `player_passed`. `make check` verde + entrada CHANGELOG.
