# Cuban Domino Game Screens

_Started 2026-05-17 12:00 UTC_

---

## User

I need React prototypes for 14 screens of my Cuban domino game "Doble 9's".
Design system: Dark backgrounds (#000000/#3A2415), gold accents (#D4AF37/#F2D27A),
crema surfaces (#F7F1E3), green actions (#0E7A43). Montserrat headings, Inter body.
Muppet puppet avatars (Manolito). Premium casino + Cuban street culture vibe.

Screens: Splash, Landing, Main Menu, Single Player Setup, Multiplayer Lobby,
Game Table (4 players, draggable tiles, chat, score, actions), Tutorial (10 levels),
Profile, Settings, Store, Results, League, Tournament.

Use uploaded assets: Manolito expressions, chicken Pollona, domino tiles, wood texture,
gold logo, avatar frame.

Create React + TypeScript + CSS components in /src/screens/ with design tokens
in /src/theme/. Include drag-and-drop for tiles, Pollona celebration animation,
responsive for mobile/desktop.

## Assistant

_[tool: update_todos]_

_[tool: list_files]_

_[tool: list_files]_

Let me explore the design system and existing assets first!

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: update_todos]_

_[tool: copy_files]_

Got it — I have everything I need. Let me build all 14 screens now.

_[tool: copy_files]_

_[tool: write_file]_

Now writing all 14 screens. Let me build them in parallel batches.

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

Now the main app file that wires all 13 screens together:

_[tool: done]_

_[tool: update_todos]_

_[tool: fork_verifier_agent]_

_[tool: snip]_

All 13 screens are live — zero console errors. Here's what was built:

---

**🎮 Doble 9's — Full Prototype**

| # | Screen | Key Features |
|---|--------|-------------|
| 1 | **Splash** | Animated logo bounce, progress bar, auto-advance |
| 2 | **Landing** | Hero layout, Manolito floating animation, social proof |
| 3 | **Main Menu** | Player HUD, quick-action grid, daily challenge widget |
| 4 | **Single Player Setup** | Player count selector, difficulty, mode, points target, live preview |
| 5 | **Multiplayer Lobby** | Room browser, search, tabs, join/create flow |
| 6 | **Game Table** | 4-player board, **drag-and-drop tiles**, drop zones, AI simulation, Pollona overlay |
| 7 | **Tutorial** | 10-step flow, interactive visuals, Manolito speech bubbles, progress dots |
| 8 | **Profile** | Gold ring avatar, stats grid, achievements, game history tabs |
| 9 | **Settings** | Audio sliders, visual quality, toggle switches, table selector |
| 10 | **Store** | Featured banner, tabbed item grid, buy/equip flow, gem/coin currencies |
| 11 | **Results** | Win/lose states, coin rain, score table, XP earned |
| 12 | **League** | Tier ladder, leaderboard with rank changes, season countdown |
| 13 | **Tournament** | Live bracket, match schedule, prize table, register flow |

**Use the gold `≡` button** (bottom-right) to jump between any screen. Drag domino tiles onto the ← → drop zones in the Game Table to play them.

_[tool: save_screenshot]_

_[tool: save_screenshot]_

_[tool: show_to_user]_

_[tool: get_webview_logs]_

The prototype is clean — only the expected Babel dev-mode warning, no errors.

The build is fully complete and ready to use. You can:

- **Click `≡`** (bottom-right gold button) to jump between any of the 13 screens
- **Splash** auto-advances to Landing after ~3 seconds  
- **Game Table** — drag tiles from your hand onto the ← → arrows on the table, or click a tile + press **JUGAR FICHA**. AI opponents take turns automatically
- **Tutorial** — click through all 10 steps with Manolito's tips
- **Store** — items can be bought/equipped with the gold coin currency

If you'd like any changes — new screens, tweaks to a specific screen's layout or copy, additional interactions, mobile responsiveness improvements, or anything else — just let me know!

