# Design System — AUTORITATIVO (extraído del bundle Claude Design)

Fuente: bundle real `api.anthropic.com/v1/design/h/HYXbXw8SLUoAXDmSPm3Xsg`
(13 pantallas JSX + design system). Código fuente vendorizado en
`/docs/design-reference/` (recrear **pixel-perfect**, no copiar la estructura
interna del prototipo). Assets y fuentes ya en `/frontend/public/`.

> ⚠️ **Estos valores ganan sobre `CLAUDE.md §3`** donde difieran (ver §
> Discrepancias). El prototipo es la verdad visual.

## Colores (de `Doble 9's.html` `:root` + `shared.jsx` `C`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--negro` | `#0D0D0D` | fondo app (NO `#000000`) |
| `--madera` | `#3A2416` | madera |
| `--dorado` | `#D4AF37` | acento principal |
| `--dorado-claro` | `#F2D27A` | highlight oro |
| `--dorado-dark` | `#A8892A` | oro oscuro |
| `--crema` | `#F7F1E3` | texto/superficies claras |
| `--verde` | `#0E7A43` | acciones / turno activo |
| `--verde-light` | `#12A356` | hover verde |
| `--error` | `#E74C3C` | destructivo (NO `#C0392B`) |
| `--panel` | `rgba(0,0,0,0.72)` | paneles glass |
| `--border-gold` | `rgba(212,175,55,0.25)` | bordes panel |

Gradiente oro canónico (logo/botón):
`linear-gradient(135deg,#C9A227 0%,#F7E08A 40%,#C9A227 70%,#F2D27A 100%)`.

## Pips — gradiente esférico 3 stops (de `DominoTile.jsx`)

No son colores planos. Cada valor 1–9 = `{ base, highlight, shadow }`,
render `radial-gradient(circle at 36% 30%, h 0%, b 52%, s 100%)`:

| # | base | highlight | shadow | nombre |
|---|------|-----------|--------|--------|
| 1 | `#CC3828` | `#E06055` | `#9E2A1E` | Rojo |
| 2 | `#2A7EC0` | `#50A0D8` | `#1A5C96` | Azul |
| 3 | `#22A850` | `#40BF6A` | `#168038` | Verde |
| 4 | `#D88810` | `#ECB040` | `#A8680A` | Naranja |
| 5 | `#7E3E9E` | `#9C5CB8` | `#5C2878` | Morado |
| 6 | `#C86018` | `#E08840` | `#9A4810` | Naranja+ |
| 7 | `#129880` | `#2CB89A` | `#0C7060` | Teal |
| 8 | `#C41450` | `#DC4474` | `#98103C` | Rosa |
| 9 | `#273848` | `#3C5060` | `#182430` | Gris osc |

Layouts de pips 0–9 = coords `%` en `DominoTile.jsx` `PIP_LAYOUTS`
(copiar exacto). `pipD = max(5, size*0.192)`.

## Tipografía

- **Inter** (variable 100–900, normal+italic) → body. Archivos en
  `/frontend/public/fonts/Inter-*.ttf`.
- **Montserrat** (variable, normal+italic) → headings, logo, botones.
- **NO hay Brush Script.** El logo "Doble 9's" es Montserrat 900 *italic*
  con `WebkitBackgroundClip:text` sobre el gradiente oro (ver `Logo` en
  `shared.jsx`). Tamaños logo: sm28 md44 lg72 xl96.

## Ficha (de `DominoTile.jsx`)

- Cuerpo baquelita crema: `linear-gradient(158deg,#F9F0DA 0%,#F1E3C2 55%,#E8D8AE 100%)`,
  `border-radius:10`, **sin borde oro**.
- Vertical `w=size, h=size*2`; horizontal invertido. Divisor central
  `rgba(50,38,22,0.2)` 1.5px.
- Seleccionada: `translateY(-7px) scale(1.04)` + glow verde.
- `FaceDownTile`: `linear-gradient(150deg,#1C1C1C,#111)` + hatch diagonal.

## Animaciones (keyframes en `Doble 9's.html`, copiar literal)

`screenFadeIn`, `splashLogo`, `float`, `turnPulse`, `pollonaShake`,
`pollonaFadeIn`, `pollonaTextIn`, `coinFall`, `resultSlideIn`, `shimmer`.

## Componentes compartidos (`shared.jsx` → atoms/molecules)

`GoldBtn` (gradiente pill, Montserrat 900 uppercase, sizes sm/md/lg),
`GhostBtn`, `GreenBtn` (+disabled), `RedBtn`, `Panel` (glass blur(12)),
`Logo`, `BackBtn`, `ScreenWrap`, `NavHeader`, `Divider`, `OnlineDot`.
Paneles de juego (`GamePanels.jsx`): `PlayerAvatar`, `ScorePanel`,
`ChatPanel`, `TipsPanel` (Manolito), `MesaInfoPanel`.

## Pantallas reales: 13 (no 14)

`SCREEN_MAP` agrupa: splash, landing, menu, setup, lobby, game, tutorial,
profile, settings, store, results, league, tournament. Archivos combinan:
`splash-landing.jsx`, `profile-settings.jsx`, `results-league.jsx`.
Layout de `game` (mesa): header → sidebar izq (Score+Chat) → centro
(oponente N, O/E, superficie de madera con drop zones ⬅➡ y cadena
horizontal) → sidebar der (MesaInfo+Tips) → dock inferior (avatar + mano
draggable + JUGAR FICHA / PASAR TURNO) + overlay Pollona.

## Discrepancias con `CLAUDE.md §3` (resolver vía ADR del Architect)

| Tema | CLAUDE.md §3 | Bundle real (gana) |
|------|--------------|--------------------|
| Negro | `#000000` | `#0D0D0D` |
| Madera | `#3A2415` | `#3A2416` |
| Peligro | `#C0392B` | `#E74C3C` |
| Pips | 9 planos | 9 esféricos b/h/s |
| Logo font | Brush Script MT | Montserrat 900 italic + gradient |
| Pantallas | 14 | 13 (3 combinadas) |
| **Render del juego** | **Phaser 3 canvas** | React DOM + HTML5 DnD |

### Decisión cerrada (usuario, 2026-05-17)

**Render del juego = Phaser 3** (se mantiene `CLAUDE.md`). El prototipo
React-DOM en `/docs/design-reference/` **NO se porta tal cual**: es el
**objetivo visual pixel-perfect** que la `TableScene` de Phaser debe
reproducir (mesa de madera, cadena de fichas, drop zones ⬅➡, dock de mano,
overlay Pollona). React/DOM solo para shell, menús y las 12 pantallas que
no son la mesa; la mesa (`game`) se renderiza en canvas Phaser vía el
dispatcher Netflix. Las demás discrepancias (colores, fuente del logo,
13 pantallas) se adoptan del bundle: **el bundle gana en lo visual**.
El Architect formaliza esto en `ADR-002` y corrige `CLAUDE.md §3`.
