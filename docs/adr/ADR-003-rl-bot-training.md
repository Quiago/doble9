# ADR-003 — RL bot training & deployment

- **Status:** Accepted
- **Date:** 2026-05-17
- **Owner:** Architect
- **Affects:** Backend

## Context

`CLAUDE.md §5.5` specifies PPO self-play bots (Stable-Baselines3 + PyTorch,
ONNX inference, <50ms). `CLAUDE.md §15` warns: do not let RL block a
working game. M1 (Alpha) is single-player vs bots.

## Decision

Two-stage bot strategy:

1. **Heuristic bot first (M1, blocking).** Rule-based opponent in
   `backend/src/services/bot_service.py`: legal-move selection with simple
   heuristics (play doubles late, dump high pips, block opponents). No ML.
   This is what ships for Alpha single-player.
2. **RL bot (Phase 2/3, non-blocking).** Scaffold only during M1:
   `backend/src/bots/{environment,train,agent}.py`, Gym env
   `CubanDoubleNine-v0`. RL deps are an **optional `[rl]` extra** in
   `pyproject.toml` (`uv sync --extra rl`) so core dev stays lean.
   Deployment: offline training → ONNX export → `/bot/predict` microservice,
   latency target <50ms.

Observation/action/reward shape per `CLAUDE.md §5.5`.

## Consequences

- (+) A playable game at M1 without weeks of PPO training.
- (+) Heavy ML deps never installed for normal backend work/CI.
- (−) Two bot codepaths; the heuristic must remain as a fallback even
  after RL ships (cold-start, ONNX load failure).
