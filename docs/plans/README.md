# Doble 9's — Plan de ejecución multi-agente

3 agentes, 3 terminales, 3 sesiones de Claude Code en paralelo. Fuente de
verdad: `/CLAUDE.md`. Estos planes lo aterrizan en tareas accionables.

## Estado del archivo de diseño Claude Design — RESUELTO

> ✅ Bundle descargado y vendorizado (link
> `HYXbXw8SLUoAXDmSPm3Xsg`). Fuentes de verdad de diseño:
> - `/docs/plans/design-system.md` — tokens autoritativos (gana sobre
>   `CLAUDE.md §3`).
> - `/docs/design-reference/` — 13 pantallas JSX + design system, objetivo
>   pixel-perfect a recrear (no portar tal cual).
> - Assets/fuentes ya en `/frontend/public/{assets,fonts}`.
>
> **Decisión usuario (2026-05-17):** render del juego en **Phaser 3** (se
> mantiene `CLAUDE.md`); el prototipo React-DOM es solo referencia visual.
> Formalizar en `ADR-002` y `ADR-005`.

## Orden de arranque (evita bloqueos)

```
Fase 0 (Architect SOLO, ~día 1)
  └─ contracts/openapi.yml + contracts/websocket.yml + shared/types/*
     + docker-compose.yml + ADR-001..004
        │
        ▼  (en cuanto los contracts existan)
Fase 1 (Frontend ‖ Backend en paralelo)
  Frontend ── trabaja contra MOCKS del contrato (MSW + WS fake)
  Backend  ── implementa el contrato real
        │
        ▼
Fase 2 (Integración, mediada por Architect)
  Frontend apunta al backend real, Architect revisa boundaries
```

**Regla de oro:** ningún agente toca código de otro. Cambios de boundary →
ADR en `/docs/adr/` + update de `/contracts/` + update de `/CLAUDE.md`.

## Git

### Topología de worktrees (OBLIGATORIO — 1 dir por agente)

Las 3 sesiones **NO comparten working directory** (eso corrompía el HEAD).
Cada agente trabaja SOLO en su worktree y SOLO en su rama:

| Terminal | Directorio | Rama | Quién |
|----------|-----------|------|-------|
| Architect | `/home/quiala/Datos/Proyectos/doble9` | `main` | integra/revisa |
| Backend | `/home/quiala/Datos/Proyectos/doble9-be` | `be/work` | Backend |
| Frontend | `/home/quiala/Datos/Proyectos/doble9-fe` | `fe/work` | Frontend |

- Ningún agente hace `git checkout` de otra rama ni `cd` a otro worktree.
  Git impide que dos worktrees usen la misma rama (seguridad nativa).
- Setup por worktree (deps están gitignored, no se copian): Backend
  `cp .env.example .env && make install`; Frontend
  `cp .env.example .env.local && npm install`.
- Integración: cada agente commitea en su rama; el **Architect** hace
  `git merge be/work` / `git merge fe/work` en `main` desde el repo
  primario, revisando boundaries y contratos.
- `main` protegida (solo merges del Architect). Commits convencionales:
  `feat(fe): …`, `feat(be): …`, `chore(arch): …`. Mensaje termina con la
  línea Co-Authored-By.

### REGLA OBLIGATORIA — commit + changelog tras cada cambio

Cada agente, **después de cada cambio funcional** (no acumular trabajo sin
versionar):

1. **Actualiza `/CHANGELOG.md`** — añade una entrada bajo `[Unreleased]`
   en la sección de tu agente (`Architect` / `Frontend` / `Backend`),
   formato *Keep a Changelog* (`Added` / `Changed` / `Fixed` / `Removed`),
   una línea por cambio, en presente y concreto.
2. **Haz un commit** que incluya el código + la entrada de changelog en el
   mismo commit. Mensaje:
   ```
   <tipo>(<agente>): <resumen imperativo en una línea>

   - qué cambió y por qué (1–4 bullets)
   - boundaries/contratos afectados (o "ninguno")
   - ADR relacionado si aplica (ADR-00X)

   Changelog: <copia la línea añadida a CHANGELOG.md>
   Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
   ```
   `<tipo>` ∈ `feat|fix|chore|docs|refactor|test`.
   `<agente>` ∈ `arch|fe|be`.
3. Si el cambio toca una **frontera cross-agent**: además ADR en
   `/docs/adr/` + update de `/contracts/` o `/shared/types/` **en el mismo
   commit**, y avisa al Architect en el PR.

> Regla de oro: ningún cambio funcional sin su commit y su línea de
> changelog. El Architect rechaza PRs que violen esto.

## Definición de "Fase 0 lista" (desbloquea a FE y BE)

- [ ] `contracts/openapi.yml` válido (lint con redocly/spectral)
- [ ] `contracts/websocket.yml` con todos los eventos de `CLAUDE.md §5.4`
- [ ] `shared/types/game.d.ts` y `api.d.ts` generados/escritos
- [ ] `docker-compose.yml` levanta Postgres 16 + Redis
- [ ] ADR-001 (Dispatcher), ADR-002 (Phaser↔React), ADR-004 (reconexión WS)

## Hitos (alineados con `CLAUDE.md §13`)

| Hito | Contenido | Agentes |
|------|-----------|---------|
| M1 Alpha | Single-player vs bot heurístico, tutorial, sin red | FE+BE |
| M2 Beta  | Multiplayer WS, lobby, chat, auth JWT, PWA | FE+BE+Arch |
| M3 Launch| Ligas, store, bots RL, resultados | todos |

Planes individuales: `00-architect-plan.md`, `01-frontend-plan.md`,
`02-backend-plan.md`.
