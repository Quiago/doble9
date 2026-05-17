# AGENT: Backend
"""PPO self-play training entrypoint — Phase 2 scaffold (`CLAUDE.md §5.5`).

Run offline only (never in the request path). Pipeline: PPO via
Stable-Baselines3 over `CubanDoubleNine-v0`, self-play curriculum, then
ONNX export consumed by `agent.RLAgent`.
"""

from __future__ import annotations


def main() -> None:
    raise NotImplementedError(
        "Training is Phase 2. Install: uv sync --extra rl. Do not block M1 "
        "on PPO — heuristic bot first (CLAUDE.md §15)."
    )


if __name__ == "__main__":  # pragma: no cover
    main()
