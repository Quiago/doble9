# Plan — Agente 3: Backend

> Rol: autoridad de lógica de juego e ingeniero de infra. FastAPI + Python
> 3.12 async, SQLAlchemy 2.0, Postgres 16, Redis, python-socketio.
> **No escribes React ni Phaser.** Todo la lógica de juego es
> server-authoritative.

## Workflow OBLIGATORIO — uv + make

Gestión de librerías con **uv**. Ejecución y tests con **make**.
**Nunca** llames `uv`, `uvicorn`, `pytest`, `alembic` o `ruff` directos —
siempre vía el `Makefile` ya creado en `/backend/Makefile`:

| Acción | Comando |
|--------|---------|
| Instalar deps | `make install` |
| Añadir dep | editar `pyproject.toml` → `make lock` → `make sync` |
| Levantar API (dev) | `make dev` |
| Tests | `make test` / `make cov` |
| Lint + tipos + tests | `make check` |
| Infra local | `make infra-up` |
| Migración nueva | `make makemigration m="..."` |
| Aplicar migraciones | `make migrate` |

`pyproject.toml` y `.env.example` ya existen en `/backend`. Copia
`.env.example`→`.env`. `make help` lista todo.

## Prompt de arranque (copy-paste)

```
Eres el Backend Agent de "Doble 9's". Lee /CLAUDE.md y
/docs/plans/02-backend-plan.md. Trabajas SOLO en /backend. Gestiona deps con
uv y ejecuta TODO vía make (nunca comandos directos). Sigue los contracts en
/contracts del Architect; la lógica de juego es 100% server-authoritative.
Crea rama be/fase-1.
```

## Prerrequisitos
`contracts/openapi.yml`, `contracts/websocket.yml`, `shared/types/*` y la
migración Alembic inicial del Architect. **No te bloquees en infra**: la
lógica pura del juego (`game/`) no depende de red ni BD — empieza por ahí.

## Tareas (en orden)

### Bloque A — Núcleo del juego (sin dependencias, empieza YA)
1. `src/game/board.py`, `tile.py` — `generate_double_nine_deck()` = 55
   fichas (0-0..9-9). Representación de cadena con dos extremos.
2. `src/game/rules.py` — reparto (10 por jugador, 15 en pozo `CLAUDE.md
   §5.3`), validación de jugada legal, detección de fin de ronda/partida.
3. `src/game/scoring.py` — conteo de puntos, detección **Pollona/Doble-9**
   y **Capicúa** (alimentan `special_play`).
4. `src/game/state_machine.py` — `MatchStateMachine` con estados
   `LOBBY→DEALING→PLAYING→SCORING→FINISHED`, `play_tile()` autoritativo
   devolviendo `Result.ok/error` (`CLAUDE.md §5.3`).
5. `tests/` — pytest exhaustivo de reglas, scoring, máquina de estados.
   Esta es la pieza más crítica del producto: cobertura alta.

### Bloque B — Infra y persistencia
6. `src/core/config.py` (pydantic-settings desde `.env`), `security.py`
   (JWT PyJWT, hashing passlib), `middleware.py` (CORS desde `CORS_ORIGINS`).
7. `src/models/` SQLAlchemy 2.0 async espejando `CLAUDE.md §7`
   (user, match, inventory, player_stats, achievements). Conectar con la
   migración Alembic del Architect.
8. Conexión async Postgres (asyncpg) + Redis (estado de match TTL 24h,
   `CLAUDE.md §5.2`).

### Bloque C — API REST (`CLAUDE.md §5.4`, sigue `openapi.yml`)
9. `src/api/auth.py` — register, login, me (JWT).
10. `src/api/matches.py` — create (room code), get (reconexión),
    join by code.
11. `src/api/users.py`, `store.py`, `leaderboard.py`.

### Bloque D — Tiempo real (sigue `websocket.yml` + ADR-004)
12. `src/main.py` FastAPI + python-socketio, namespace `/game`, rooms
    `match:{id}`.
13. Handlers: join_lobby, player_ready, start_match, play_tile, pass_turn,
    request_tile, send_chat. Broadcast: game_state, tile_placed,
    turn_changed, special_play, chat_message, player_disconnected, error.
14. **Reconexión** según ADR-004: estado en Redis, replay desde
    `last_action_at`, timeout de desconexión. Coordinar con FE antes de
    implementar.

### Bloque E — Bots (Fase 2 — NO antes de que el juego funcione)
15. **Primero bot heurístico** (rule-based) en `src/services/bot_service.py`
    para M1 single-player. (`CLAUDE.md §15`.)
16. Scaffold RL: `src/bots/environment.py` (Gym `CubanDoubleNine-v0`),
    `train.py`, `agent.py`. Deps RL = extra opcional `[rl]` en pyproject
    (`uv sync --extra rl`). PPO/Stable-Baselines3, export ONNX, microservicio
    `/bot/predict` <50ms (`CLAUDE.md §5.5`).

### Bloque F — Gemini
17. `src/services/gemini_service.py` wrapper de generación de avatares
    (`CLAUDE.md §6`), key desde env, manejo de errores y coste.

## Definición de hecho
- `make check` verde (lint + mypy strict + pytest).
- `make dev` sirve FastAPI en :8000; OpenAPI generado coincide con
  `contracts/openapi.yml`.
- Reglas de dominó cubano doble-9 correctas y testeadas (reparto, jugada
  legal, scoring, Pollona, Capicúa).
- WS namespace `/game` con rooms y reconexión funcionando.
- Toda mutación de estado pasa por la máquina de estados (autoritativo).
- Bot heurístico jugable para M1.

## No hagas
- No escribir `frontend/**`.
- No llamar comandos directos — solo `make`.
- No gastar semanas en PPO antes de M1 (heurístico primero, `CLAUDE.md §15`).
- No cambiar `shared/types`/contracts sin ADR del Architect.
