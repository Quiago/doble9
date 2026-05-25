# Changelog

Todos los cambios notables del proyecto. Formato basado en
[Keep a Changelog](https://keepachangelog.com/). Versionado semántico.

**Proceso (obligatorio):** cada agente añade su entrada aquí **en el mismo
commit** que el cambio. Reglas completas en
`docs/plans/README.md` → "REGLA OBLIGATORIA — commit + changelog tras cada
cambio".

## [Unreleased]

### Architect

#### Added (bugs de jugabilidad — contrato, 2026-05-25)
- **ADR-011 + contrato**: `TilePlacedPayload` gana `handCount` (fichas restantes
  del asiento que jugó, autoritativo) y se formaliza `player_passed`
  (`PlayerPassedPayload {bySeat}`) en `shared/types/game.d.ts` y en el enum +
  mensajes de `contracts/websocket.yml`. Desbloquea: conteos de rivales en vivo
  y aviso de "PASO". Diagnóstico: la jugada legal rechazada (6-9 sobre extremo 6)
  **no** es bug de backend (legalidad correcta, probada por e2e) sino del render
  del tablero + resolución del lado de drop en el FE → directiva Frontend.

#### Added (cierre de integración, 2026-05-25)
- **ADR-010 + contrato**: `round_end`/`match_end` ahora declaran `kind`
  (`"DOMINO"|"TRANQUE"`) y `match_end` también `points` en
  `shared/types/game.d.ts` (+ nota en `contracts/websocket.yml`). El campo ya
  viajaba por el cable y el FE lo consumía; esto solo ratifica/documenta el
  contrato (ningún agente podía tocar `shared/` sin ADR). Verificado por la
  suite e2e.
- **ADR-009 addendum**: ratificado `/tutorial/:level` como ruta **pública**
  (embudo "VER TUTORIAL" pre-registro); públicas = `/`, `/welcome`,
  `/tutorial/:level`, el resto bajo `<RequireAuth>`.
- **Linealización `fe/work → main`** (merge limpio): trae el guard de auth
  ADR-009 (App/Landing/Setup), el fix de build de `TableScene.ts` y la UX de
  errores. Build FE verde, `make check` verde (103 tests), `make test-e2e`
  verde (4/4) en `main`.
- **Preservado trabajo FE huérfano** (`fix(fe)`): el rollback anti-ghost-tile
  (`gameStore`/`dispatcher`) y los errores inline del `AuthModal` vivían solo
  como cambios sin commitear en el working tree de `main` (ausentes de
  `fe/work`); commiteados para no perderlos. Frontend debe revisar.

#### Added (integración FE↔BE, 2026-05-25)
- **Suite de integración FE↔BE real sobre el cable**
  (`backend/tests/integration/`): arranca un uvicorn vivo y conduce
  REST→JWT→Socket.IO `/game` igual que el frontend. Escenarios: rechazo de
  conexión sin token (ADR-007), snapshot `game_state` tras `join_lobby`,
  partida solo completa hasta `match_end` (valida cadena del tablero orientada
  = fix `is_flipped`, `round_end`/`match_end` con `kind`/`points`/`winnerTeam`,
  `tilesCount` de rivales) y jugada ilegal → `error` (gatillo del rollback).
  Marcador pytest `integration` (excluido de `make check`), target
  `make test-e2e`, dep dev `aiohttp`. README en la carpeta.
- `docs/adr/ADR-009-auth-route-guard.md`: diagnóstico de "missing bearer token"
  (no es bug de backend — falta guard de ruta; el splash salta el gate de
  Landing) + parche `<RequireAuth>` propuesto al agente Frontend.

#### Findings (para los agentes)
- **Backend**: `src/game/board.py` líneas 126 y 132 superan 100 cols (E501);
  `make check` está **rojo en `main`** por esto (commit de `is_flipped` sin
  pasar el gate). Fix: envolver ambas líneas o `make format`.
- **Frontend**: `Setup.tsx` lee `err?.response?.data?.detail` (forma axios) pero
  el cliente lanza `ApiException` con `.body.message`; el mensaje real del
  backend nunca llega a la UI. Ver parche en ADR-009.
- **Contrato OK**: `winnerTeam` es `"teamA"`/`"teamB"` (consistente FE/BE/shared);
  el `us`/`them` de CLAUDE.md era ilustrativo. Nota UX: `GameTable.tsx` muestra
  "Equipo teamA" — conviene mapear a un nombre legible.

#### Added (scaffold original)
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
- **Integración M1 a `main`** (3201fee): merge `be/work` (Backend A–F +
  fix ADR-006) + `fe/work` (Frontend A–D) sin conflictos; `contracts/` y
  `shared/` intactos (agentes en territorios disjuntos).
- **Gate de integración — capa SQL validada contra Postgres real**:
  `make migrate` aplica `0001` (6 tablas + `users.password_hash`),
  idempotente. Hasta ahora solo se probaba con repos en memoria.
- `docker-compose.yml`: puerto host parametrizable
  `${POSTGRES_PORT:-5432}` — evita choque con un Postgres nativo del host
  (detectado en este entorno: PG nativo en `127.0.0.1:5432`). Documentado
  en `.env.example`.
- **Integración pantallas P1–P3** (merge `fe/work` `c1b88b0`): Tutorial,
  Profile, Settings, Store, Tournament + `molecules/DominoTile`. Las 13
  pantallas del inventario existen. Sin conflictos.
- **ADR-007 — handshake de auth WS**: el `connect` del backend exige
  `auth.token` (JWT) y rechaza la conexión sin él; el frontend mandaba solo
  `auth.clientId`. Causa raíz: `websocket.yml` nunca especificó el `auth` de
  conexión. Resuelto: `auth: { token, clientId }`. Fix aplicado en
  `frontend/src/services/websocket.ts` (lee el JWT de `userStore`); backend
  ya conforme. `contracts/websocket.yml` documenta el handshake.
- **ADR-008 — topología de deploy + normalización DSN + single worker**:
  - `backend/Dockerfile` (multi-stage uv, solo deps prod, no-root, corre
    `alembic upgrade head` y luego uvicorn 1 worker, `$PORT`) + `.dockerignore`.
    Imagen construida y arrancada OK (migra DSN sync→asyncpg, `/health` 200,
    register 201).
  - `to_async_dsn` en `core/config.py` + aplicado en `migrations/env.py`:
    reescribe `postgres://`/`postgresql://` → `postgresql+asyncpg://` para que
    el `connectionString` de Render/Railway funcione tal cual. 6 tests nuevos.
  - `vercel.json` (raíz): build `npm --prefix frontend …`, output
    `frontend/dist`, rewrites SPA, cache headers SW/assets.
  - `render.yaml`: blueprint backend + Postgres 16 + Redis.
  - `Makefile`: carga `.env` (arregla `make migrate` sin `export` manual) y
    `run` pasa a **1 worker** (el `MatchRegistry` WS es in-process hasta M2).
- **Documentación**: `README.md` reescrito (estado M1 integrado/deployable,
  arquitectura, qué hizo/hace cada agente, inventario de features, run local,
  deploy) + `docs/DEPLOY.md` (runbook Vercel + Render, env vars, checklist,
  gotchas).
- **Gate de integración en vivo**: smoke REST (register/login/me/matches/
  leaderboard/store contra Postgres real) + WS (`/game`, join_lobby,
  start_match, bots juegan solos; envelope `{event,matchId,payload,timestamp}`
  conforme al lector del FE). `make check` verde (96 tests).

### Frontend

#### Fixed (bugs de jugabilidad A–D — ADR-011, 2026-05-25)
- **BUG A · conteos de rivales en vivo**: `gameStore.setSeatTileCount(seat, n)`
  nuevo; el dispatcher, en `tile_placed`, aplica el `handCount` autoritativo
  (ADR-011) → los conteos dejan de quedarse congelados en 9/10 sin esperar un
  `game_state`.
- **BUG B · aviso de "PASO" + turnos perceptibles**: se registra
  `player_passed` en `SERVER_EVENTS` (`services/websocket.ts`) — antes el socket
  nunca lo recibía y el handler del dispatcher era código muerto. En
  `TableScene` se añade **pacing**: los eventos de jugada entrantes (turno /
  ficha / paso) se **encolan y reproducen secuencialmente** (~650 ms "Pensando…"
  antes de jugar, ~320 ms al colocar, ~950 ms el "¡PASO!"), de modo que el bot
  burst se ve jugada a jugada. Indicador de turno claro: asiento activo resaltado
  con glow + etiqueta de estado ("Pensando…"/"Jugando…"/"¡No llevó!") y cue en el
  dock ("TU TURNO · arrastra una ficha" / "Esperando tu turno…"). El estado lógico
  sigue siendo el del servidor; solo se pacea la presentación.
- **BUG C · jugada legal rechazada**: en `dragend` el lado se resuelve por
  **legalidad** (extremos abiertos `leftEnd`/`rightEnd` vs `tile.ends`), no por
  el píxel del drop (antes `center→right` mandaba el lado equivocado). Si conecta
  a un solo extremo se juega ese; a ambos, decide el drop; a ninguno, snap-back
  con toast guía ("Esa ficha no encaja en ningún extremo abierto"). Al levantar
  la ficha se **resaltan los extremos legales** (marcadores verdes pulsantes).
- **BUG D · tablero responsive con TODAS las fichas**: `BoardGroup.sync()` deja
  de truncar (`slice(-7)`) y de apilar en una fila recta; ahora renderiza el
  tablero completo en **layout serpenteante** (boustrophedon) que envuelve por
  filas y **escala** el tamaño de ficha (24→8 px/half) para que quepan hasta ~40.
  Los dobles van **perpendiculares**; la orientación se respeta desde `t.ends`
  (ADR-010/`is_flipped`), no se recalcula. `setBounds()` re-layouta en resize.
- **UX · manos rivales boca abajo por conteo**: cada rival muestra N reversos de
  ficha (sin números) igual a su `tilesCount` en vivo, no solo un número.
- **mock `wsFake`** (dev, `VITE_USE_MOCKS=true`): emite `handCount` en
  `tile_placed`, simula un bot burst (rivales que juegan o pasan) y `player_passed`
  para poder ejercitar A–D sin backend. (Backend no estaba arriba en :8000 al
  cerrar este cambio; verificación contra backend real con `VITE_USE_MOCKS=false`
  queda pendiente de infra. `tsc -b` + `npm run build` verdes; dev server arranca.)

#### Added (guard de auth + UX de errores, 2026-05-25)
- **`<RequireAuth>` en `App.tsx` (ADR-009)**: invariante de ruta — ninguna
  pantalla protegida (`/menu`, `/play/*`, `/profile/*`, `/settings`, `/store`,
  `/league`, `/tournament`, `results`, `lobby`) se renderiza sin token. Resuelve
  el `401 missing bearer token`: el splash saltaba el gate de Landing y se llegaba
  a `createMatch` sin sesión. En vez de rebotar en silencio, el guard **avisa con
  un toast** ("Inicia sesión para continuar") y redirige a `/welcome` recordando
  el `from`. Rutas públicas: `/` (Splash), `/welcome` (Landing) y `/tutorial/:level`
  (este último se deja **público a propósito** como demo pre-login / embudo de
  registro — desviación deliberada de la lista del ADR, que lo marcaba protegido).
- **`Landing.tsx`**: cuando el guard redirige aquí, **auto-abre el `AuthModal`**
  (el usuario ve el login al instante, sin buscar el botón) y, tras autenticarse,
  vuelve al `from` recordado en lugar de ir siempre a `/menu`.

#### Fixed
- **`Setup.tsx` — mensaje de error real (ADR-009)**: leía
  `err?.response?.data?.detail` (forma axios), descartando el mensaje del backend;
  ahora usa `ApiException.body.message`. Además, un `401` (sesión expirada a mitad
  de juego) hace `logout()` + toast guiado ("Tu sesión expiró…") y redirige a
  `/welcome` con `from`, en vez de mostrar el críptico "missing bearer token".
- **`TableScene.ts` — build de FE estaba rojo en `main`**: dos accesos
  `game.board.tiles` tras encadenamiento opcional (`TS2531`) y el cluster muerto
  `drawDropZone`/`strokeDashedRoundRect` sin llamadas (`TS6133`). Corregido con
  locales y eliminando el código muerto; `tsc -b` y `npm run build` verdes.
- WS connect manda el JWT en `auth` (`{ token, clientId }`) — antes solo
  `clientId`, lo que el backend rechazaba (ADR-007). Aplicado por el Architect
  durante la integración; el agente FE debe revisar el diff de `websocket.ts`.

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

#### Fixed (endurecimiento de integración, 2026-05-25)
- `src/game/board.py`: E501 en las dos líneas de `is_flipped` (la
  orientación del tablero llegó en un commit `fix(game)` sin pasar el gate)
  que dejaba **`make check` rojo en `main`**. Líneas envueltas + docstring
  de la convención de orientación (pip que toca la cadena → lado interior).
- `src/ws/runtime.py`: `round_end` ahora propaga `kind` y `match_end`
  propaga `kind` + `points` por el cable (la whitelist del runtime los
  descartaba). El frontend los usa en los overlays de fin de ronda/partida.
  **Boundary FE↔BE (para el Architect):** estos campos NO están en
  `shared/types/game.d.ts` (`RoundEndPayload`/`MatchEndPayload`); requieren
  ADR + actualización del contrato. No toco `shared/`.
- Tests nuevos (97 → 103, `make check` verde; +4 e2e verdes con
  `make test-e2e` contra Postgres/Redis vivos): orientación `is_flipped`
  (4 casos flip/no-flip por extremo, doble simétrico, cadena larga mixta,
  con aserción de continuidad de la cadena serializada) y regresión de
  `kind`/`points` en `round_end`/`match_end` sobre el runtime.

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
