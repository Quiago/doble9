# Changelog

Todos los cambios notables del proyecto. Formato basado en
[Keep a Changelog](https://keepachangelog.com/). Versionado semántico.

**Proceso (obligatorio):** cada agente añade su entrada aquí **en el mismo
commit** que el cambio. Reglas completas en
`docs/plans/README.md` → "REGLA OBLIGATORIA — commit + changelog tras cada
cambio".

## [Unreleased]

### Architect

#### Added
- Estructura del monorepo y scaffold inicial (`frontend/`, `backend/`,
  `contracts/`, `shared/`, `docs/`, `.github/`).
- `.gitignore` raíz + `frontend/.gitignore` + `backend/.gitignore`.
- Backend: workflow `uv` + `make` — `backend/Makefile` (único entrypoint),
  `pyproject.toml`, `.env.example`.
- Infra local: `backend/docker-compose.yml` (Postgres 16 + Redis 7,
  healthchecks).
- Contratos FE↔BE: `shared/types/game.d.ts`, `shared/types/api.d.ts`.
- `contracts/openapi.yml` (OpenAPI 3.1, 11 endpoints REST) y
  `contracts/websocket.yml` (AsyncAPI 3.0, namespace `/game`).
- Alembic async: `alembic.ini`, `migrations/env.py`, `script.py.mako`,
  `versions/0001_initial_schema.py` (6 tablas de CLAUDE.md §7 +
  `users.password_hash` para JWT).
- ADR-001..005 en `docs/adr/`.
- CI: `.github/workflows/{backend,frontend}-ci.yml`.
- `README.md` raíz, planes por agente en `docs/plans/`, design system
  autoritativo (`docs/plans/design-system.md`).
- Diseño Claude Design vendorizado en `docs/design-reference/`; assets PNG
  y fuentes en `frontend/public/{assets,fonts}`.
- `CHANGELOG.md` + regla de proceso commit-tras-cada-cambio.

#### Changed
- Render del juego fijado en **Phaser 3** (decisión del usuario, ADR-002);
  el bundle React-DOM pasa a ser objetivo visual, no se porta tal cual.
- `CLAUDE.md §3/§7` superado por `docs/plans/design-system.md` y ADR-005
  en lo visual y en el schema (no se reescribe `CLAUDE.md`, ver ADR-005).
- **Fallo ADR-006 (revisión de avance BE+FE):** `/game` es **namespace**
  Socket.IO, no path Engine.IO (default `/socket.io`). `websocket.yml`
  congelado: `servers.pathname → /socket.io` + descripción aclarada.
  Único bloqueante FE↔BE: FE ya conforme; BE requiere fix pequeño
  (`main.py` quita `socketio_path`, `gateway.py` usa `namespace="/game"`).
  Puntos 2–4 (substitución por bot, seating M2, CAPICUA/POLLONA) ratificados
  sin rework.

#### Added
- `docs/adr/ADR-006-ws-namespace-and-integration-rulings.md`.
- **Topología git worktrees** (corrige el working dir compartido que
  corrompía el HEAD): repo primario `=main` (Architect),
  `../doble9-be=be/work`, `../doble9-fe=fe/work`. Ramas mal etiquetadas
  (`arch/fase-0`, `be/fase-1`, `fe/fase-2`) eliminadas; historia integrada
  consolidada en `main` (bf2ba75 = arch + BE A–F + FE A–B + ADR-006).
  Documentado en `docs/plans/README.md` → Topología de worktrees.

### Frontend
- _Sin cambios aún._

### Backend

#### Added
- Núcleo del juego server-authoritative en `backend/src/game/` (Bloque A,
  sin deps de red/BD): `tile.py` (set doble-9 = 55 fichas, id canónico
  `low-high`), `board.py` (cadena de dos extremos, serializa al contrato
  `Board`), `rules.py` (reparto 10+15, equipos 0&2 vs 1&3, jugadas
  legales, tranque), `scoring.py` (conteo, DOUBLE_9/CAPICUA/POLLONA),
  `state_machine.py` (`MatchStateMachine` LOBBY→…→FINISHED, `play_tile`/
  `pass_turn` autoritativos, snapshot `GameState` con mano privada).
- `backend/tests/` — 44 tests de reglas/scoring/máquina de estados;
  `make check` verde (ruff + mypy strict + pytest).
- `backend/README.md` (faltaba; `pyproject.toml` lo referenciaba).
- Infra/persistencia (Bloque B): `src/core/config.py` (settings
  pydantic-settings desde `.env`), `security.py` (JWT PyJWT + hashing
  bcrypt), `middleware.py` (CORS desde `CORS_ORIGINS`), `db.py` (engine/
  sesión async asyncpg, lazy), `redis.py` (`RedisMatchStore` clave
  `match:{id}` TTL 24h, CLAUDE.md §5.2).
- Modelos SQLAlchemy 2.0 async en `src/models/` (User, PlayerStats,
  Achievement, Match, MatchPlayer, Inventory) fieles a la migración 0001;
  `migrations/env.py` ahora apunta a `Base.metadata` (handoff Architect).
- 15 tests nuevos (config/security/models/redis); total 59, `make check`
  verde.
- Bot heurístico (Bloque E, desbloquea single-player M1):
  `src/services/bot_service.py` — `choose_play` puro (mano+tablero →
  jugada|paso, respeta apertura obligatoria, dificultades EASY/NORMAL/
  HARD) y `bot_take_turn(sm, seat)` que conduce `MatchStateMachine`
  (toda jugada sigue validada por el motor autoritativo).
- Scaffold RL Fase 2 en `src/bots/` (`environment.py` Gym
  `CubanDoubleNine-v0`, `agent.py`, `train.py`) — stubs sin imports
  pesados, deps en extra opcional `[rl]`.
- `MatchStateMachine.mandatory_tile` (propiedad de solo lectura) para el
  bot/match service.
- 8 tests nuevos de bot; total 67, `make check` verde.
- API REST (Bloque C, sigue `contracts/openapi.yml`): 11 endpoints —
  `auth` (register/login/me, JWT bearer), `matches` (create/get/join,
  snapshot vía Redis), `users` (stats/history), `store` (items/purchase),
  `leaderboard`. DTOs Pydantic camelCase 1:1 con el contrato.
- Capa de repositorios (`src/repositories/`): Protocols + impl
  SQLAlchemy (prod) + impl en memoria (tests/dev M1 sin Postgres).
- `src/main.py` FastAPI app: routers, CORS, manejador de errores con
  forma `ApiError` (`{code,message}`), lifespan que cierra el engine,
  `/health`. (WS python-socketio se monta aquí en Bloque D.)
- `src/services/match_service.py` (generador de room code sin
  caracteres ambiguos).
- 9 tests de API vía `TestClient` + dependency overrides; total 76,
  `make check` verde.
- Gateway tiempo real (Bloque D, sigue `websocket.yml` + ADR-004):
  `src/ws/runtime.py` `MatchRuntime` (envuelve la máquina de estados,
  conduce bots, buffer ordenado de eventos, reconexión delta/snapshot,
  dedup por `clientId`, substitución por bot al expirar la gracia de
  desconexión), `registry.py` (runtimes solo M1), `gateway.py`
  (Socket.IO `/game`, rooms `match:{id}`, handlers finos). `main.py`
  monta ASGI combinado (Socket.IO path `/game` + FastAPI).
- 8 tests de runtime WS; total 84, `make check` verde.
- Gemini (Bloque F, `CLAUDE.md §6`): `src/services/gemini_service.py`
  wrapper async httpx para generación de avatares Muppet de Manolito
  (prompt con anclas de marca, key desde env, manejo de errores HTTP/
  respuesta, `GeneratedImage.data_url`, cliente inyectable, nota de
  coste ≈$0.04/img). 6 tests vía `httpx.MockTransport` (sin red/key);
  total 90, `make check` verde.

#### Fixed
- Salida de ronda 1: la regla "quien tiene el 9-9 abre" fallaba cuando
  el 9-9 cae en el pozo (15/55 ≈ 27%, `ValueError`). Generalizado a la
  regla cubana real: **abre el doble más alto** (`rules.opening_move`);
  9-9 es solo el tope de ese orden. Sin doble repartido → asiento 0
  abre libre. Bug del núcleo (Bloque A) detectado por los tests de D.
- ADR-006: `/game` es **namespace** Socket.IO, no path Engine.IO.
  `src/main.py` deja de pasar `socketio_path` (Engine.IO usa el default
  `/socket.io`); `src/ws/gateway.py` registra handlers y emite/`enter_room`
  con `namespace="/game"`. Conforme a `websocket.yml` congelado; FE ya
  conforme. `make check` verde (90 tests).

#### Changed
- `pyproject.toml`: overrides mypy para `socketio.*`
  (`ignore_missing_imports`) y para `src.ws.gateway`
  (`disallow_untyped_decorators=false`, decoradores de Socket.IO sin
  tipos). El resto del código sigue en strict total.
- `core/config.py`: valores por defecto (espejo de `.env.example`) en
  `DATABASE_URL`/`REDIS_URL`/`SECRET_KEY` para que la app importe sin
  `.env` en dev/CI; el entorno real sigue teniendo prioridad. Sin
  impacto en contratos.

#### Changed
- Hashing de contraseñas: `passlib[bcrypt]` → `bcrypt` directo
  (passlib 1.7.4 incompatible con bcrypt 4.x). `pyproject.toml` +
  `uv.lock` actualizados. Sin impacto en contratos.
