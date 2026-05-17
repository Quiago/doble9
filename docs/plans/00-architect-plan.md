# Plan — Agente 1: Architect

> Rol: diseñador de sistema y guardián de la integración. **No escribes
> componentes React ni lógica de juego.** Dueño de `/CLAUDE.md`,
> `/contracts/`, `/docs/adr/`, `/shared/`, infra y CI/CD.

## Prompt de arranque (copy-paste)

```
Eres el Architect Agent de "Doble 9's". Lee /CLAUDE.md completo y
/docs/plans/00-architect-plan.md. Trabajas en la raíz del repo. Ejecuta el
plan en orden. No escribas React, Phaser ni lógica de juego. Tu salida son
contratos, infra e integración. Crea rama arch/fase-0.
```

## Prerrequisitos
Ninguno. **Eres el cuello de botella inicial**: FE y BE están bloqueados
hasta que termines Fase 0. Prioriza contracts + docker-compose por encima
de todo.

## Tareas (en orden)

### Fase 0 — Desbloquear al equipo (PRIORIDAD MÁXIMA)
1. **`docker-compose.yml`** en raíz: servicios `db` (postgres:16, user/pass
   `doble9s`, db `doble9s`, volumen `pgdata`) y `redis` (redis:7, volumen
   `redisdata`). Healthchecks. Puertos 5432/6379. (El `backend/Makefile`
   ya espera `docker compose up -d db redis`.)
2. **`contracts/openapi.yml`** — todos los endpoints REST de `CLAUDE.md §5.4`:
   auth (register/login/me), matches (create/get/join), leaderboard,
   store (items/purchase), users (stats/history). Schemas de request/response,
   códigos de error, auth Bearer JWT. Validar con spectral/redocly.
3. **`contracts/websocket.yml`** — namespace `/game`, todos los `emit` y `on`
   de `CLAUDE.md §5.4`: join_lobby, player_ready, start_match, play_tile,
   pass_turn, request_tile, send_chat → game_state, tile_placed, turn_changed,
   special_play, chat_message, player_disconnected, error. Payload de cada uno.
4. **`shared/types/game.d.ts`** y **`shared/types/api.d.ts`** — tipos TS que
   FE consume y BE respeta: `Tile`, `Board`, `GameState`, `Action`,
   `ServerMessage`, `ClientMessage`, `Player`, `Scores`. Espejo exacto de los
   contracts. Esta es la frontera FE↔BE.
5. **Migración Alembic inicial** — `backend/migrations/` con `alembic.ini` y
   `env.py` async; primera revisión desde el schema SQL de `CLAUDE.md §7`
   (users, player_stats, matches, match_players, achievements, inventory).
   *(Solo el scaffold de migración y el SQL — el BE conecta los modelos.)*
6. **ADRs**:
   - `ADR-001-dispatcher-pattern.md` — por qué Dispatcher estilo Netflix.
   - `ADR-002-phaser-react-integration.md` — boundary Phaser↔React vía
     Dispatcher. **Documentar la decisión del usuario (2026-05-17)**: el
     bundle Claude Design es React-DOM pero el render del juego se hace en
     **Phaser 3** (se mantiene `CLAUDE.md`); el prototipo
     `/docs/design-reference/` es el objetivo visual pixel-perfect, no se
     porta tal cual. Solo la mesa va en canvas; las otras 12 pantallas en DOM.
   - `ADR-003-rl-bot-training.md` — pipeline RL, por qué Fase 2, heurístico primero.
   - `ADR-004-ws-reconnect-protocol.md` — **crítico** (`CLAUDE.md §15`):
     buffer de acciones cliente, replay desde `last_action_at`, timeout de
     desconexión, reanudación de estado vía `GET /matches/:id`. FE y BE
     deben acordar esto **antes** de implementar multiplayer.
   - `ADR-005-design-tokens-reconciliation.md` — adoptar los tokens reales
     de `/docs/plans/design-system.md` (negro `#0D0D0D`, error `#E74C3C`,
     pips esféricos, logo Montserrat, 13 pantallas) y **corregir
     `CLAUDE.md §3`** para que deje de divergir del bundle.

### Fase 1 — CI/CD y entorno (mientras FE/BE trabajan)
7. `.github/workflows/backend-ci.yml` — `cd backend && make check`
   (lint+typecheck+test) sobre matriz con Postgres+Redis services.
8. `.github/workflows/frontend-ci.yml` — `cd frontend && npm ci && npm run
   lint && npm run test && npm run build`.
9. `.env.example` raíz consolidando `CLAUDE.md §10` (FE + BE). El de backend
   ya existe en `backend/.env.example`.
10. `README.md` raíz: cómo levantar las 3 terminales (`CLAUDE.md §11`).

### Fase 2 — Guardián de integración
11. Revisar PRs de `fe/*` y `be/*` contra los contracts. Rechazar cualquier
    drift no documentado en ADR.
12. Mantener `/CLAUDE.md` y `/shared/types` sincronizados con cada cambio
    de boundary aprobado.

## Definición de hecho
- `docker compose up -d db redis` levanta infra sana.
- `openapi.yml` y `websocket.yml` pasan linters y cubren 100% de `§5.4`.
- `shared/types/*` compila y es consumible por FE.
- 4 ADRs escritos; ADR-004 acordado por FE+BE antes de M2.
- Ambos workflows CI verdes en un PR de prueba.

## No hagas
- No escribir `frontend/src/**` ni `backend/src/game/**`.
- No elegir librerías del FE/BE más allá de lo fijado en `CLAUDE.md`.
