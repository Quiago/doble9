# AGENT: Backend
"""HTTP middleware wiring. CORS origins come from settings
(`CORS_ORIGINS`, `CLAUDE.md §10`). Called by the app factory in Block D.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import Settings


def add_cors(app: FastAPI, settings: Settings) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
