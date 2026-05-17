dame esto como un markdown bien formateado: # Doble 9's — Technical Specification & Multi-Agent Guide> **Project**: Doble 9's — Dominó Cubano Online  > **Version**: 1.0  > **Date**: May 2026  > **Owner**: Carlos Quiala  > **Agents**: Architect | Frontend | Backend  ---## 1. Executive SummaryDoble 9's is a real-time multiplayer Cuban double-9 domino game for web and mobile (PWA first). It supports single-player vs. RL-trained bots, multiplayer 4-player tables (2v2 partnerships), tutorial mode, social features (chat, taunts), and a Duolingo-style retention system (streaks, leagues, XP). The visual identity is "premium casino meets Cuban street culture": dark backgrounds, gold accents, Muppet-style puppet avatars, and humorous animations.**Key architectural decision**: The frontend uses a Netflix-inspired dispatcher pattern for all game state and UI updates, decoupling the Phaser 3 game engine from the React UI layer. The backend is authoritative over all game logic; the frontend is a dumb renderer with optimistic local feedback.---## 2. Architecture Overview### 2.1 High-Level Diagram
+-----------------CLIENT------------------+
| +--------+ +--------+ +---------+ |
| | React | | Phaser | | Audio | |
| | UI |<-| Canvas |<-| Engine | |

+---^----+ +---^----+ +---------++---v----------v-----------------+Dispatcher (Netflix)- Event Bus (Pub/Sub)- State Store (Immutable)- Action Router+---^-----------------------------++---v--------------------------+WebSocket Client(reconnection + buffer)+---^--------------------------+
+------|---------------------------------+
| WebSocket
v
+---------------BACKEND-----------------+
| +--------+ +--------+ +----------+ |
| | FastAPI | | Game | | RL | |
| | Gateway | | State | | Bot | |
| | HTTP+WS | |Machine | | Agent | |

+---^----+ +---^----+ +----^----++---v----+ +---v----+ +---v----+RedisPostgreSQLPubSubPlayersStateGames+--------+ +--------+ +--------+
+---------------------------------------+

text
### 2.2 Netflix-Inspired Dispatcher Pattern (Frontend)We adopt a variation of Netflix's Dispatcher + Component API pattern adapted for games:- **The Dispatcher** is the single source of truth. It receives actions from:  - WebSocket server (remote state changes)  - Phaser engine (local player inputs)  - React UI (menu clicks, chat sends)- **The Store** holds immutable game state. React components subscribe to slices. Phaser scenes subscribe to relevant state (tile positions, player turns).- **Action Router** validates actions locally (optimistically) then sends to server. Server is authoritative.- **Components** (React and Phaser) never talk directly to each other. They only emit actions to the Dispatcher and react to state updates.```typescriptinterface Action {  type: string;  payload: unknown;  meta?: { clientId: string; timestamp: number };}dispatcher.dispatch({  type: 'TILE_PLAYED',  payload: { tileId: 'd5-3', position: 'left', rotation: 0 },  meta: { clientId: 'user-123', timestamp: Date.now() }});```### 2.3 Communication Protocol (Between Agents)All three agents read this `claude.md` file. When an agent makes a decision that affects another agent's boundary, they must:1. Document it in an `ADR-XXX.md` (Architecture Decision Record) in `/docs/adr/`2. Update the API contract in `/contracts/`3. Comment in the code with `// AGENT: [Frontend|Backend|Architect]`**No agent should change another agent's code without discussion.** The Architect mediates conflicts.---## 3. Design System (CSS-First)We use **CSS custom properties (variables)** for all tokens, not Tailwind. This ensures runtime theming, media query support, and consistency between React and Phaser (Phaser can read CSS var values via `getComputedStyle`).### 3.1 CSS Variables (`src/styles/tokens.css`)```css:root {  /* Colors */  --color-carbon: #000000;  --color-mahogany: #3A2415;  --color-gold: #D4AF37;  --color-gold-light: #F2D27A;  --color-cream: #F7F1E3;  --color-green: #0E7A43;  --color-danger: #C0392B;    /* Pips (colored dots) */  --pip-1: #E74C3C; --pip-2: #3498DB; --pip-3: #2ECC71;  --pip-4: #F39C12; --pip-5: #9B59B6; --pip-6: #E67E22;  --pip-7: #1ABC9C; --pip-8: #E91E63; --pip-9: #34495E;    /* Typography */  --font-heading: 'Montserrat', sans-serif;  --font-body: 'Inter', sans-serif;  --font-logo: 'Brush Script MT', cursive;    /* Spacing (8px grid) */  --space-unit: 8px;  --space-1: 4px; --space-2: 8px; --space-3: 12px;  --space-4: 16px; --space-6: 24px; --space-8: 32px;  --space-12: 48px; --space-16: 64px;    /* Border Radius */  --radius-sm: 4px; --radius-md: 8px;  --radius-lg: 16px; --radius-pill: 9999px;    /* Shadows */  --shadow-card: 0 4px 12px rgba(0,0,0,0.5);  --shadow-tile: 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2);  --shadow-gold-glow: 0 0 20px rgba(212,175,55,0.4);    /* Tile Dimensions */  --tile-width: 60px;  --tile-height: 120px;  --tile-radius: 6px;}```### 3.2 CSS Architecture (ITCSS + BEM)
src/styles/
├── settings/ # CSS variables, fonts
├── tools/ # Mixins (media queries, animations)
├── generic/ # Reset, box-sizing
├── elements/ # Base elements (button, input)
├── objects/ # Layout patterns (grid, flex)
├── components/ # UI components (Button, Card, Tile)
├── utilities/ # Helper classes (hide, text-center)
└── phaser/ # Styles injected into Phaser canvas

text
**Naming**: BEM — `.c-button--primary`, `.o-flex--center`, `.u-hidden@mobile`### 3.3 Component Library Structure
src/components/
├── atoms/ # Smallest: Button, Icon, AvatarFrame, Pip
├── molecules/ # Combined: DominoTile, ChatBubble, ScoreRow
├── organisms/ # Complex: PlayerHand, ChatPanel, ScoreBoard
├── templates/ # Page layouts: GameLayout, LobbyLayout
└── game/ # Phaser-specific: GameCanvas, TileSprite

text
---## 4. Frontend Specification### 4.1 Tech Stack| Layer | Technology | Reason ||-------|-----------|--------|| Framework | React 19 + TypeScript | Familiar, ecosystem, Claude-friendly || State | Zustand (via Dispatcher) | Lightweight, no boilerplate, slices || Styling | CSS Modules + CSS Variables | Scoped + theming + Phaser interop || Game Engine | Phaser 3 (Canvas/WebGL) | Best 2D physics, drag-drop, particles || Build | Vite | Fast HMR, esbuild, PWA ready || Mobile | Capacitor (later) | Wrap PWA as native app || Icons | Lucide React | Consistent, tree-shakeable || Forms | React Hook Form | Minimal, performant |### 4.2 Phaser + React IntegrationReact mounts Phaser in a `useEffect` inside a `<div ref={gameContainer}>`. The Phaser scene exposes a minimal API to the Dispatcher, never to React directly.```typescriptclass GameManager {  private game: Phaser.Game;  private dispatcher: Dispatcher;    constructor(container: HTMLElement, dispatcher: Dispatcher) {    this.dispatcher = dispatcher;    this.game = new Phaser.Game({      type: Phaser.AUTO,      parent: container,      width: container.clientWidth,      height: container.clientHeight,      scene: [BootScene, TableScene, UIOverlayScene],      physics: { arcade: { gravity: { y: 0 } } },      scale: { mode: Phaser.Scale.RESIZE }    });  }}```### 4.3 Screen Inventory| Screen | Route | Priority ||--------|-------|----------|| Splash | `/` | P0 || Landing | `/welcome` | P0 || Main Menu | `/menu` | P0 || Single Setup | `/play/solo` | P0 || Multiplayer Lobby | `/play/lobby/:code` | P0 || Game Table | `/play/match/:id` | P0 || Tutorial | `/tutorial/:level` | P1 || Profile | `/profile/:userId` | P1 || Settings | `/settings` | P1 || Store | `/store` | P2 || Results | `/play/match/:id/results` | P0 || League | `/league` | P2 || Tournament | `/tournament` | P3 |### 4.4 Key Interactions**Tile Drag-and-Drop**:1. Phaser `TileSprite` listens for `dragstart`2. On `drag`, sprite follows pointer with `setPosition()`3. On `dragend`, calculate nearest legal placement4. If legal: emit `TILE_PLAYED` action to Dispatcher5. Dispatcher sends to Backend via WebSocket6. Backend validates, broadcasts `TILE_PLACED` to all clients7. Dispatcher updates Store → Phaser animates tile to final position**Pollona Animation**:1. Trigger: Backend sends `SPECIAL_PLAY: { type: 'DOUBLE_9' }`2. Phaser `TableScene` starts sequence:   - Camera shake (200ms, 4px)   - Particle emitter (gold coins, center of placed tile)   - Spawn chicken sprite bottom-right, scale-in tween   - CSS animation on React overlay for speech bubble "POLLONAAAA!"   - Manolito taunt face appears top-left for 1.5s### 4.5 Audio SystemWeb Audio API + Howler.js for cross-browser compatibility.- **SFX**: Tile place (varied pitch), tile slam, pass stamp, celebration- **Voice**: Manolito barks (pre-recorded Spanish lines)- **Music**: Ambient Cuban son (optional, low volume)- **Spatial audio**: Chat messages ping from correct direction---## 5. Backend Specification### 5.1 Tech Stack| Layer | Technology | Reason ||-------|-----------|--------|| API | FastAPI + Python 3.12 | Owner expertise, async native, type hints || WebSocket | `python-socketio` | Rooms, namespaces, fallbacks || Pub/Sub | Redis | Match state, presence, session store || Database | PostgreSQL 16 | ACID, JSONB for game states, player data || ORM | SQLAlchemy 2.0 + async | Type-safe, migrations with Alembic || Auth | JWT (PyJWT) + OAuth (Google) | Stateless, mobile-friendly || RL Bots | Stable-Baselines3 + PyTorch | Owner expertise, offline training || AI Images | Gemini API (Google) | Consistent avatar generation, prompts || Deploy | Docker + Railway/Render | Simple, scalable, affordable |### 5.2 WebSocket Architecture
Client connects -> /ws/match/{match_id}
-> Joins Socket.IO room "match:{id}"
Server maintains per-match GameState in Redis (TTL 24h):
match:123 = {
"players": [...],
"board": [...],
"turn": "player-456",
"scores": {...},
"status": "active",
"last_action_at": timestamp
}

text
**Message Protocol (JSON)**:```typescript// Client -> Serverinterface ClientMessage {  action: 'PLAY_TILE' | 'PASS' | 'REQUEST_TILE' | 'SEND_MESSAGE' | 'READY';  matchId: string;  payload: unknown;}// Server -> Clientinterface ServerMessage {  event: 'TILE_PLACED' | 'TURN_CHANGED' | 'SPECIAL_PLAY' | 'CHAT_MSG' | 'PLAYER_JOINED' | 'ERROR';  matchId: string;  payload: unknown;  timestamp: number;}```### 5.3 Game State Machine```pythonclass MatchStateMachine:    STATES = ['LOBBY', 'DEALING', 'PLAYING', 'SCORING', 'FINISHED']        def __init__(self, match_id: str, players: list[Player]):        self.state = 'LOBBY'        self.deck = generate_double_nine_deck()  # 55 tiles        self.board = Board()        self.hands = {}        self.scores = {'us': 0, 'them': 0}        self.turn_index = 0        def deal(self):        # Each player gets 10, 15 remain in boneyard        pass        def play_tile(self, player_id: str, tile: Tile, side: str) -> Result:        # Authoritative validation. Returns new state or error.        if not self.is_legal_move(player_id, tile, side):            return Result.error("Invalid move")                self.board.place(tile, side)        self.hands[player_id].remove(tile)                if self.is_round_end():            points = self.calculate_points()            self.scores[self.team_of(player_id)] += points                        if self.is_match_end():                self.state = 'FINISHED'                return Result.ok({'event': 'MATCH_END', 'winner': '...'})            else:                self.state = 'SCORING'                return Result.ok({'event': 'ROUND_END', 'points': points})                self.next_turn()        return Result.ok({'event': 'TILE_PLACED'})```### 5.4 API Endpoints (REST + WS)**REST (HTTP)**:
POST /auth/register -> { token, user }
POST /auth/login -> { token, user }
GET /auth/me -> User profile
POST /matches -> Create match (returns room code)
GET /matches/:id -> Match state (for reconnects)
POST /matches/:id/join -> Join by room code
GET /leaderboard -> Weekly league standings
GET /store/items -> Available items
POST /store/purchase -> Buy with coins
GET /users/:id/stats -> Player statistics
GET /users/:id/history -> Match history (paginated)

text
**WebSocket Events**:
// Connection
connect -> namespace: /game
// Lobby
emit('join_lobby', { match_id })
emit('player_ready', { match_id, ready: true })
emit('start_match', { match_id }) # host only
// Gameplay
emit('play_tile', { match_id, tile_id, side, rotation })
emit('pass_turn', { match_id })
emit('request_tile', { match_id, target_player, requested_tile })
emit('send_chat', { match_id, message })
// Receiving
on('game_state', { board, hands_count, scores, turn, status })
on('tile_placed', { player_id, tile, side, position })
on('turn_changed', { player_id, time_remaining })
on('special_play', { type: 'DOUBLE_9'|'CAPICUA', player_id })
on('chat_message', { player_id, message, timestamp })
on('player_disconnected', { player_id, timeout_seconds })
on('error', { code, message })

text
### 5.5 RL Bot Architecture
Bot Training Pipeline (offline):
1. Gym Environment: CubanDoubleNine-v0
- Observation: own hand (10 tiles) + board chain + opponent counts
- Action: tile_index (0-9) + placement_side (left/right) + request_flag
- Reward: +1 win, -1 lose, +0.1 per point scored, -0.01 per illegal attempt
2. Training: PPO via Stable-Baselines3
- Self-play: bot trains against previous versions
- Curriculum: 2 bots -> 4 bots -> mixed with human replays
3. Deployment: ONNX export + FastAPI microservice
- /bot/predict receives game state JSON -> returns action JSON
- Latency target: <50ms per decision

text
---## 6. AI Image Generation (Gemini API)**Problem**: Claude is poor at image generation. Gemini API (Google) excels at consistent character generation with style references.**Integration**:```typescriptclass GeminiAvatarService {  async generateAvatar(style: string, expression: string): Promise<string> {    const response = await fetch(      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent',      {        method: 'POST',        headers: {          'Content-Type': 'application/json',          'x-goog-api-key': this.apiKey        },        body: JSON.stringify({          contents: [{            parts: [{              text: `Generate a Muppet-style Cuban puppet character named Manolito.                     ${style}. ${expression}. White guayabera shirt, gold chain,                     sunglasses. Felt texture with visible stitching. Plain white                     background. High quality toy photography.`            }]          }],          generationConfig: { responseModalities: ['Text', 'Image'] }        })      }    );    return response.imageUrl;  }}```**Use Cases**:1. **Avatar customization**: Players describe their avatar, Gemini generates consistent Muppet variants2. **Item shop skins**: "Manolito wearing a Miami Heat jersey", "Manolito in formal esmoquin"3. **Board themes**: "Cuban street scene with vintage cars and domino tables"4. **Marketing materials**: Consistent social media assets with brand characters---## 7. Database Schema (PostgreSQL)```sql-- UsersCREATE TABLE users (    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    username VARCHAR(32) UNIQUE NOT NULL,    email VARCHAR(255) UNIQUE,    avatar_url TEXT,    created_at TIMESTAMPTZ DEFAULT now(),    last_login TIMESTAMPTZ,    country VARCHAR(2),    settings JSONB DEFAULT '{}');-- Player StatsCREATE TABLE player_stats (    user_id UUID PRIMARY KEY REFERENCES users(id),    games_played INT DEFAULT 0,    games_won INT DEFAULT 0,    games_lost INT DEFAULT 0,    total_points INT DEFAULT 0,    current_streak INT DEFAULT 0,    best_streak INT DEFAULT 0,    league_tier VARCHAR(20) DEFAULT 'Bronze',    league_points INT DEFAULT 0,    coins INT DEFAULT 100,    xp INT DEFAULT 0,    level INT DEFAULT 1);-- MatchesCREATE TABLE matches (    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    room_code VARCHAR(8) UNIQUE NOT NULL,    mode VARCHAR(20) NOT NULL,    status VARCHAR(20) DEFAULT 'lobby',    target_score INT DEFAULT 100,    created_at TIMESTAMPTZ DEFAULT now(),    started_at TIMESTAMPTZ,    ended_at TIMESTAMPTZ,    winner_team VARCHAR(10),    final_scores JSONB,    game_log JSONB);-- Match PlayersCREATE TABLE match_players (    match_id UUID REFERENCES matches(id),    user_id UUID REFERENCES users(id),    team VARCHAR(10) NOT NULL,    seat INT NOT NULL,    joined_at TIMESTAMPTZ DEFAULT now(),    left_at TIMESTAMPTZ,    is_bot BOOLEAN DEFAULT false,    PRIMARY KEY (match_id, user_id));-- AchievementsCREATE TABLE achievements (    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    user_id UUID REFERENCES users(id),    achievement_key VARCHAR(50) NOT NULL,    unlocked_at TIMESTAMPTZ DEFAULT now(),    UNIQUE (user_id, achievement_key));-- InventoryCREATE TABLE inventory (    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    user_id UUID REFERENCES users(id),    item_type VARCHAR(30) NOT NULL,    item_key VARCHAR(50) NOT NULL,    equipped BOOLEAN DEFAULT false,    acquired_at TIMESTAMPTZ DEFAULT now());```---## 8. Agent Roles & Responsibilities### Agent 1: Architect**You are the system designer and integration guardian.****Responsibilities**:- Own this `claude.md` file. Keep it updated as decisions change.- Define all API contracts (REST + WS) in `/contracts/`- Write ADRs for every architectural decision in `/docs/adr/`- Review cross-agent code for consistency- Define database migrations- Set up CI/CD pipeline (GitHub Actions -> Docker -> Railway)- Configure environment variables and secrets management- **You do NOT write React components or game logic directly.****Deliverables**:- `docker-compose.yml` (PostgreSQL + Redis + backend)- `contracts/openapi.yml` (REST API spec)- `contracts/websocket.yml` (WS event spec)- `/docs/adr/ADR-001-dispatcher-pattern.md`- `/docs/adr/ADR-002-phaser-react-integration.md`- `/docs/adr/ADR-003-rl-bot-training.md`- GitHub Actions workflow files### Agent 2: Frontend**You are the UI/UX engineer and game renderer.****Responsibilities**:- Build all React screens and components- Integrate Phaser 3 canvas with React lifecycle- Implement CSS design system (tokens, components, utilities)- Create animation systems (CSS keyframes + Phaser tweens)- Audio engine integration- PWA configuration (manifest, service worker, offline support)- Mobile responsiveness and touch optimization- **You do NOT write backend APIs or database queries.****Deliverables**:- `src/screens/*` — All 14 screens- `src/components/*` — Atomic component library- `src/styles/*` — CSS architecture- `src/game/*` — Phaser scenes and game manager- `src/store/*` — Zustand stores via Dispatcher- `src/hooks/*` — Custom React hooks (useGame, useChat, useAudio)- `public/manifest.json` — PWA manifest### Agent 3: Backend**You are the game logic authority and infrastructure engineer.****Responsibilities**:- FastAPI application with HTTP + WebSocket endpoints- Game state machine implementation (Cuban double-9 rules)- Authentication and authorization- Matchmaking and lobby management- Redis pub/sub for real-time state sync- PostgreSQL models and queries- RL bot training pipeline and inference API- Gemini API integration for image generation- Admin dashboard (optional)- **You do NOT write React or Phaser code.****Deliverables**:- `src/api/` — FastAPI routers- `src/game/` — State machine and rules engine- `src/models/` — SQLAlchemy models- `src/bots/` — RL agent and training scripts- `src/ai/` — Gemini API wrapper- `src/core/` — Config, auth, middleware- `migrations/` — Alembic migrations- `tests/` — Unit and integration tests- `Dockerfile` and `docker-compose.yml`---## 9. Directory Structure
doble9s/
├── claude.md # <- THIS FILE (source of truth)
├── contracts/
│ ├── openapi.yml # REST API spec
│ └── websocket.yml # WS event spec
├── docs/
│ └── adr/
│ ├── ADR-001-dispatcher-pattern.md
│ ├── ADR-002-phaser-react-integration.md
│ └── ADR-003-rl-bot-training.md
├── frontend/ # Agent 2 territory
│ ├── public/
│ │ ├── assets/
│ │ │ ├── manolito/
│ │ │ ├── chicken/
│ │ │ ├── tiles/
│ │ │ ├── sounds/
│ │ │ └── fonts/
│ │ └── manifest.json
│ ├── src/
│ │ ├── main.tsx
│ │ ├── App.tsx
│ │ ├── screens/
│ │ │ ├── Splash.tsx
│ │ │ ├── Landing.tsx
│ │ │ ├── MainMenu.tsx
│ │ │ ├── SingleSetup.tsx
│ │ │ ├── Lobby.tsx
│ │ │ ├── GameTable.tsx
│ │ │ ├── Tutorial.tsx
│ │ │ ├── Profile.tsx
│ │ │ ├── Settings.tsx
│ │ │ ├── Store.tsx
│ │ │ ├── Results.tsx
│ │ │ ├── League.tsx
│ │ │ └── Tournament.tsx
│ │ ├── components/
│ │ │ ├── atoms/
│ │ │ ├── molecules/
│ │ │ └── organisms/
│ │ ├── game/
│ │ │ ├── GameManager.ts
│ │ │ ├── scenes/
│ │ │ │ ├── BootScene.ts
│ │ │ │ ├── TableScene.ts
│ │ │ │ └── UIOverlayScene.ts
│ │ │ ├── entities/
│ │ │ │ ├── TileSprite.ts
│ │ │ │ └── BoardGroup.ts
│ │ │ └── effects/
│ │ │ ├── PollonaEffect.ts
│ │ │ └── CapicuaEffect.ts
│ │ ├── store/
│ │ │ ├── dispatcher.ts
│ │ │ ├── gameStore.ts
│ │ │ ├── userStore.ts
│ │ │ └── uiStore.ts
│ │ ├── hooks/
│ │ │ ├── useGame.ts
│ │ │ ├── useChat.ts
│ │ │ ├── useAudio.ts
│ │ │ └── useAuth.ts
│ │ ├── services/
│ │ │ ├── api.ts
│ │ │ ├── websocket.ts
│ │ │ └── gemini.ts
│ │ ├── styles/
│ │ │ ├── tokens.css
│ │ │ ├── main.css
│ │ │ ├── components/
│ │ │ └── phaser.css
│ │ └── types/
│ │ ├── game.ts
│ │ ├── api.ts
│ │ └── store.ts
│ ├── index.html
│ ├── vite.config.ts
│ ├── tsconfig.json
│ └── package.json
├── backend/ # Agent 3 territory
│ ├── src/
│ │ ├── main.py
│ │ ├── api/
│ │ │ ├── auth.py
│ │ │ ├── matches.py
│ │ │ ├── users.py
│ │ │ ├── store.py
│ │ │ └── leaderboard.py
│ │ ├── game/
│ │ │ ├── state_machine.py
│ │ │ ├── rules.py
│ │ │ ├── board.py
│ │ │ └── scoring.py
│ │ ├── models/
│ │ │ ├── user.py
│ │ │ ├── match.py
│ │ │ └── inventory.py
│ │ ├── services/
│ │ │ ├── match_service.py
│ │ │ ├── bot_service.py
│ │ │ └── gemini_service.py
│ │ ├── core/
│ │ │ ├── config.py
│ │ │ ├── security.py
│ │ │ └── middleware.py
│ │ └── bots/
│ │ ├── environment.py
│ │ ├── train.py
│ │ └── agent.py
│ ├── migrations/
│ ├── tests/
│ ├── Dockerfile
│ ├── docker-compose.yml
│ ├── requirements.txt
│ └── alembic.ini
├── shared/ # Cross-agent types (Architect owns)
│ └── types/
│ ├── game.d.ts
│ └── api.d.ts
├── .github/
│ └── workflows/
│ ├── frontend-ci.yml
│ └── backend-ci.yml
└── README.md

text
---## 10. Environment Variables```bash# Frontend (.env.local)VITE_API_URL=https://api.doble9s.comVITE_WS_URL=wss://api.doble9s.com/gameVITE_GEMINI_API_KEY=your_gemini_keyVITE_SENTRY_DSN=optional# Backend (.env)DATABASE_URL=postgresql://user:pass@db:5432/doble9sREDIS_URL=redis://redis:6379/0SECRET_KEY=your_jwt_secretALGORITHM=HS256ACCESS_TOKEN_EXPIRE_MINUTES=60GEMINI_API_KEY=your_gemini_keyCORS_ORIGINS=https://doble9s.com,https://*.doble9s.com```---## 11. Development Workflow### Option A: 3 Terminals (Recommended)**Terminal 1 — Architect**:```bashcd doble9s# Setup monorepo, Docker, contracts# Review PRs from other agents# Update claude.md and ADRs```**Terminal 2 — Frontend**:```bashcd doble9s/frontendnpm installnpm run dev  # Vite dev server on :5173```**Terminal 3 — Backend**:```bashcd doble9s/backenddocker-compose up -d db redis  # Start infrapython -m venv venv && source venv/bin/activatepip install -r requirements.txtuvicorn src.main:app --reload --port 8000```**Why 3 terminals?** Each agent works independently without context pollution. The Frontend agent doesn't need to see backend logs. The Backend agent can restart the server without affecting frontend HMR. The Architect can review code in both without mixing concerns.### Option B: 1 Terminal with Claude Code (Simpler but slower)Use Claude Code's context switching, but you'll lose parallelism. Only do this if your machine can't handle 3 Claude Code sessions.### Recommended: Hybrid- Use **3 separate Claude Code sessions** (3 terminals)- Each session loads only its agent's directory:  - Frontend agent: `claude` in `/frontend` only  - Backend agent: `claude` in `/backend` only  - Architect: `claude` in root, manages `contracts/`, `docs/`, shared types- Use `git` to sync: each agent commits to feature branches, Architect reviews and merges---## 12. Testing Strategy**Frontend**:- Vitest for unit tests (components, hooks, dispatcher)- Playwright for E2E (game flow: lobby -> match -> results)- Phaser scenes tested via headless canvas mocking**Backend**:- pytest for unit tests (state machine, rules, scoring)- pytest-asyncio for WebSocket flow tests- TestClient for FastAPI HTTP endpoint tests- Docker-compose test fixtures (PostgreSQL + Redis)---## 13. Deployment Roadmap**Phase 1 — Alpha (Month 1-2)**:- Single player vs bots only- Tutorial mode- Local storage for progress- Deploy frontend to Vercel, backend to Render (free tiers)**Phase 2 — Beta (Month 3)**:- Multiplayer lobby + WebSocket- Basic chat + taunts- Auth (JWT)- PWA installable- Open beta with Miami community**Phase 3 — Launch (Month 4-5)**:- Leagues + tournaments- Store + coins (IAP prep)- RL bots in production- Marketing push (TikTok clips)**Phase 4 — Scale (Month 6+)**:- Skill gaming license (Florida)- Real money tournaments- Native app (Capacitor)- Internationalization---## 14. Agent Prompts (Copy-Paste Ready)### To start the Architect Agent:
You are the Architect Agent for "Doble 9's", a real-time multiplayer Cuban double-9 domino game. You own the system design, API contracts, database schema, and CI/CD.
Read /claude.md for the full specification. Your immediate tasks:
Create the monorepo structure in /doble9s/
Set up docker-compose.yml with PostgreSQL + Redis
Write OpenAPI spec for REST endpoints
Write WebSocket event contract
Create initial Alembic migration from the schema in claude.md
Set up GitHub Actions CI for both frontend and backend
Create ADR-001 documenting why we use the Dispatcher pattern
Do NOT write React components or game logic. Focus on contracts, infrastructure, and cross-agent integration.

text
### To start the Frontend Agent:
You are the Frontend Agent for "Doble 9's". You build the React UI, Phaser 3 game canvas, CSS design system, and all user-facing screens.
Read /claude.md for the full specification. Your immediate tasks:
Initialize Vite + React + TypeScript project in /frontend/
Set up CSS design system with custom properties (tokens.css)
Create the Dispatcher pattern (Zustand-based) in /src/store/
Build Splash, Landing, and Main Menu screens with exact colors from the design system
Integrate Phaser 3 with a placeholder TableScene
Implement the GameTable screen layout (4 players, chat, score, hand)
Add drag-and-drop for domino tiles using Phaser input events
Use the attached design assets (Manolito, chicken, tiles, wood texture). All styling must use CSS variables, NOT Tailwind. Follow BEM naming.

text
### To start the Backend Agent:
You are the Backend Agent for "Doble 9's". You build the FastAPI server, game state machine, WebSocket handlers, database models, and RL bot pipeline.
Read /claude.md for the full specification. Your immediate tasks:
Initialize FastAPI project in /backend/ with async SQLAlchemy
Set up PostgreSQL and Redis connections
Implement the MatchStateMachine for Cuban double-9 rules
Create WebSocket namespace /game with room management
Implement REST endpoints for auth (register/login/me)
Write the game rules engine (deal, play validation, scoring)
Set up the RL bot training scaffold (Gym environment stub)
Create Gemini API wrapper for avatar generation
Follow the contracts defined by the Architect. All game logic must be server-authoritative.

text
---## 15. Notes for Carlos (Human Owner)- **Start with 3 terminals.** It feels like overkill but prevents context pollution and keeps each agent focused.- **The Architect is the bottleneck early on.** Let them set up contracts first, then Frontend and Backend can work in parallel.- **RL bots are a Phase 2 feature.** Don't let the Backend agent spend weeks on PPO training before the game works. Start with heuristic bots (rule-based).- **Gemini API costs**: Image generation is ~$0.04/image with Gemini Flash. Budget $20/month for dev/testing.- **WebSocket reconnects are hard.** The most common bug in multiplayer games is "player disconnects for 2 seconds and the whole table breaks." Frontend + Backend must agree on reconnect protocol — Architect should define this in ADR-004.- **Audio is easy to ignore and hard to add later.** Include placeholder sounds in Week 1, even if they're just clicks and beeps.---*This document is a living specification. Any agent that changes a cross-agent boundary must update this file and create an ADR.*