# AGENT: Backend
"""RL inference agent — Phase 2 scaffold (`CLAUDE.md §5.5`).

Deployment target: ONNX export served via FastAPI, <50ms per decision.
The production interface must match `bot_service.choose_play` (hand +
board → move | pass) so the match service can swap heuristic ↔ RL behind
one call site.
"""

from __future__ import annotations

from typing import Any


class RLAgent:
    """Loads an ONNX policy and maps game state → action. Phase 2."""

    def __init__(self, model_path: str) -> None:
        self.model_path = model_path

    def predict(self, observation: Any) -> Any:
        raise NotImplementedError(
            "RL inference is Phase 2. M1 uses the heuristic bot "
            "(src.services.bot_service.choose_play)."
        )
