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

#### Changed
- Hashing de contraseñas: `passlib[bcrypt]` → `bcrypt` directo
  (passlib 1.7.4 incompatible con bcrypt 4.x). `pyproject.toml` +
  `uv.lock` actualizados. Sin impacto en contratos.
