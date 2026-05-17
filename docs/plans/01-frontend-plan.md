# Plan — Agente 2: Frontend

> Rol: UI/UX y renderer del juego. React 19 + TS + Vite + Phaser 3 + CSS
> variables (NO Tailwind). **No escribes APIs ni queries de BD.** El backend
> es autoritativo; el FE es un renderer tonto con feedback optimista.

## Prompt de arranque (copy-paste)

```
Eres el Frontend Agent de "Doble 9's". Lee /CLAUDE.md y
/docs/plans/01-frontend-plan.md. Trabajas SOLO en /frontend. Todo estilo con
CSS variables y BEM, nunca Tailwind. El backend es autoritativo. Mientras no
exista backend real, trabaja contra mocks (MSW + WS fake) según los
contracts en /contracts. Crea rama fe/fase-1.
```

## Diseño — fuente de verdad (RESUELTO)
El bundle Claude Design ya está descargado y vendorizado:
- **`/docs/plans/design-system.md`** — tokens autoritativos (colores reales,
  pips esféricos b/h/s, Inter+Montserrat, ficha baquelita, animaciones).
  **Gana sobre `CLAUDE.md §3`** donde difiera.
- **`/docs/design-reference/`** — código fuente del prototipo (13 pantallas
  JSX + `shared.jsx`/`DominoTile.jsx`/`GamePanels.jsx` + `Doble 9's.html`).
  Es el **objetivo pixel-perfect**: recréalo, NO copies su estructura interna.
- **Assets y fuentes ya copiados** a `/frontend/public/assets/*.png` y
  `/frontend/public/fonts/*.ttf` (rutas `./assets` y `./fonts` del prototipo).
- Lee también `/docs/design-reference/chat-transcript.md` (intención real).

### Decisión de render (usuario, 2026-05-17): **Phaser 3**
La mesa de juego (`game`) se renderiza en **canvas Phaser**, no en DOM. El
prototipo `screens/game-screen.jsx` es el **objetivo visual** que la
`TableScene` debe reproducir pixel-perfect (mesa madera, cadena horizontal,
drop zones ⬅➡, dock de mano, overlay Pollona). El drag-and-drop HTML5 del
prototipo se traduce a **input de Phaser**. Las otras 12 pantallas SÍ se
hacen en React/DOM recreando los JSX de referencia. Dispatcher Netflix se
mantiene como boundary React↔Phaser.

## Prerrequisitos
Necesitas `contracts/openapi.yml`, `contracts/websocket.yml` y
`shared/types/*` del Architect. **No te bloquees**: hasta que existan,
trabaja con mocks tipados a mano y refactoriza cuando lleguen los contracts.

## Tareas (en orden)

### Bloque A — Cimientos
1. `npm create vite@latest` → React 19 + TS en `/frontend`. Vite, Lucide
   React, React Hook Form, Zustand, Phaser 3, Howler.js, plugin PWA.
2. **Design system CSS**: `src/styles/tokens.css` con los valores de
   `/docs/plans/design-system.md` (NO los de `CLAUDE.md §3` donde difieran):
   `--negro:#0D0D0D`, `--error:#E74C3C`, gradiente oro canónico, pips
   esféricos b/h/s, `@font-face` Inter+Montserrat desde `/public/fonts`.
   Arquitectura ITCSS (settings/tools/generic/elements/objects/components/
   utilities/phaser); BEM (`.c-`, `.o-`, `.u-…@mobile`). Portar los
   `@keyframes` literales de `Doble 9's.html`.
3. **Dispatcher pattern** (`CLAUDE.md §2.2`, ADR-001) en `src/store/`:
   `dispatcher.ts` (event bus + action router), `gameStore.ts`,
   `userStore.ts`, `uiStore.ts` (Zustand, slices, estado inmutable).
   Componentes React y escenas Phaser **solo** hablan con el Dispatcher.
4. **Servicios** `src/services/`: `api.ts` (cliente REST tipado con
   `shared/types`), `websocket.ts` (socket.io-client con reconexión +
   buffer según ADR-004), `gemini.ts` (wrapper avatares `CLAUDE.md §6`).
   Mocks: MSW para REST + WS fake en dev.

### Bloque B — Pantallas P0 (recrear los JSX de `/docs/design-reference`)
> Son **13** pantallas (no 14): `splash-landing.jsx`,
> `profile-settings.jsx`, `results-league.jsx` combinan dos cada una.
> Empieza recreando `shared.jsx` como atoms/molecules (GoldBtn, GhostBtn,
> GreenBtn, RedBtn, Panel, Logo, BackBtn, ScreenWrap, NavHeader, etc.).
5. Splash `/` + Landing `/welcome` (`splash-landing.jsx`), Main Menu
   `/menu` (`main-menu.jsx`) — logo = Montserrat 900 italic + gradiente oro
   (NO Brush Script).
6. Single Setup + Lobby (`setup-lobby.jsx`),
   Results + League (`results-league.jsx`).
7. Organisms de la mesa en React/DOM **solo el shell** (header, sidebars
   Score/Chat/MesaInfo/Tips de `GamePanels.jsx`); el tablero va en Phaser.

### Bloque C — Motor de juego Phaser
> **Objetivo pixel-perfect**: `/docs/design-reference/screens/game-screen.jsx`
> + `DominoTile.jsx`. La `TableScene` debe verse idéntica a ese layout
> (mesa `wood-texture.png` con borde oro y vignette, cadena de fichas
> horizontal centrada, drop zones ⬅➡ punteadas, dock inferior con borde
> verde en tu turno). La ficha en canvas replica la baquelita crema y los
> pips esféricos de `DominoTile.jsx`.
8. `src/game/GameManager.ts` montado en `useEffect` dentro de `<div ref>`
   (`CLAUDE.md §4.2`). Escenas: `BootScene`, `TableScene`, `UIOverlayScene`.
9. Entidades `TileSprite.ts` (baquelita + pips esféricos b/h/s),
   `BoardGroup.ts` (cadena). Phaser lee tokens vía `getComputedStyle`.
10. **Drag-and-drop de fichas** (`CLAUDE.md §4.4`): dragstart→drag→dragend,
    cálculo de jugada legal local (optimista), emite `TILE_PLAYED` al
    Dispatcher → WS. Animar a posición final con el `tile_placed` del server.
11. **Efectos** `PollonaEffect.ts` (camera shake + partículas oro + sprite
    pollo + burbuja "POLLONAAAA!" + cara Manolito) y `CapicuaEffect.ts`,
    disparados por `special_play`.

### Bloque D — Pulido
12. Audio (`CLAUDE.md §4.5`): Howler.js, `useAudio` hook, SFX placeholder
    desde semana 1 (clicks/beeps), barks de Manolito, audio espacial chat.
13. Hooks `useGame`, `useChat`, `useAudio`, `useAuth`.
14. PWA: `public/manifest.json`, service worker, offline, instalable.
15. Responsive + touch (móvil first).

### Pantallas P1–P3 (post-M1)
Tutorial, Profile, Settings, Store, League, Tournament.

## Definición de hecho
- `npm run dev` levanta en :5173; build PWA OK.
- Cero Tailwind; todo vía CSS variables + BEM.
- React/Phaser nunca se llaman directo — solo Dispatcher.
- Drag-and-drop emite acciones; render reacciona al estado del server.
- Splash/Landing/Menu/GameTable con colores y fuentes exactos del §3.
- Pollona y Capicúa animadas.

## No hagas
- No escribir `backend/**`, endpoints ni SQL.
- No asumir lógica de juego en cliente como autoritativa (solo optimista).
- No cambiar `shared/types` ni contracts (eso es del Architect; pídelo vía ADR).
