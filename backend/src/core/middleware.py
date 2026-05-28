# AGENT: Backend
"""HTTP middleware wiring. CORS origins come from settings
(`CORS_ORIGINS`, `CLAUDE.md §10`). Called by the app factory in Block D.

Wildcard support (ADR-008 / future ADR-012 "Deploy hardening Render+Vercel"):
entries in `CORS_ORIGINS` containing `*` (e.g. `https://doble9s-*.vercel.app`
for Vercel preview deploys) are compiled into a single `allow_origin_regex`
pattern for Starlette's CORSMiddleware. Exact entries (no `*`) keep the
fast-path `allow_origins` list and behave identically to before.
"""

from __future__ import annotations

import re
from collections.abc import Iterable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import Settings


def _split_origins(origins: Iterable[str]) -> tuple[list[str], list[str]]:
    """Partition origins into (exact, wildcard) lists.

    An origin is "wildcard" if it contains a `*` anywhere — typically the
    host label for Vercel-style previews (`https://doble9s-*.vercel.app`).
    """
    exact: list[str] = []
    wildcard: list[str] = []
    for raw in origins:
        origin = raw.strip()
        if not origin:
            continue
        (wildcard if "*" in origin else exact).append(origin)
    return exact, wildcard


def _wildcard_to_regex(pattern: str) -> str:
    """Convert a CORS wildcard origin to a regex fragment.

    Every `*` becomes `[^/]*` (one host label segment, no slashes — prevents
    `https://doble9s-*.vercel.app` from matching `https://doble9s-x.evil.com`
    via a path), every other character is escaped literally.
    """
    parts = pattern.split("*")
    return "[^/]*".join(re.escape(p) for p in parts)


def build_cors_regex(origins: Iterable[str]) -> str | None:
    """Return a combined regex that matches any wildcard origin, or None.

    Anchored with `^…$` so partial matches are rejected. Multiple wildcard
    entries are OR'd: `^(a|b)$`. Returns None when no wildcard entries exist,
    so the caller can omit `allow_origin_regex` entirely.
    """
    _, wildcard = _split_origins(origins)
    if not wildcard:
        return None
    body = "|".join(_wildcard_to_regex(w) for w in wildcard)
    return f"^({body})$"


def add_cors(app: FastAPI, settings: Settings) -> None:
    exact, _ = _split_origins(settings.cors_origins)
    regex = build_cors_regex(settings.cors_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=exact,
        allow_origin_regex=regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
