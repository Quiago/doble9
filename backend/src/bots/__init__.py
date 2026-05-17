# AGENT: Backend
"""RL bot pipeline — **Phase 2** (`CLAUDE.md §5.5`, §15).

Scaffold only. M1 ships the heuristic bot (`src.services.bot_service`);
do NOT spend time on PPO before the game works end-to-end.

Heavy deps (gymnasium/torch/SB3) are the optional `[rl]` extra and are
imported lazily inside functions so `make check` (no `[rl]`) stays green.
"""
