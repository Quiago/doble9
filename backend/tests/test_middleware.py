"""CORS middleware: exact origins, wildcard (Vercel previews), and the
combined behavior. See ADR-008 + future ADR-012 deploy hardening."""

from __future__ import annotations

import re

import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from src.core.config import Settings
from src.core.middleware import add_cors, build_cors_regex


def _make_app(origins: list[str]) -> FastAPI:
    app = FastAPI()
    settings = Settings(
        DATABASE_URL="x",  # type: ignore[call-arg]
        REDIS_URL="y",
        SECRET_KEY="z",
        CORS_ORIGINS=",".join(origins),
    )
    add_cors(app, settings)

    @app.get("/_ping")
    async def _ping() -> dict[str, bool]:
        return {"ok": True}

    return app


def _preflight(client: TestClient, origin: str) -> str | None:
    """Return the `Access-Control-Allow-Origin` header for a preflight, if any."""
    resp = client.options(
        "/_ping",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    return resp.headers.get("access-control-allow-origin")


@pytest.mark.parametrize(
    ("pattern", "matches", "rejects"),
    [
        (
            "https://doble9s-*.vercel.app",
            ["https://doble9s-abc.vercel.app", "https://doble9s-pr-12.vercel.app"],
            [
                "https://doble9s.vercel.app",  # no hyphen → no match
                "https://doble9s-abc.evil.com",  # different host
                "https://doble9s-x.vercel.app.evil.com",  # suffix attack
            ],
        ),
    ],
)
def test_build_cors_regex_matches_expected_origins(
    pattern: str, matches: list[str], rejects: list[str]
) -> None:
    rx = build_cors_regex([pattern])
    assert rx is not None
    compiled = re.compile(rx)
    for origin in matches:
        assert compiled.match(origin), f"expected match for {origin!r} with {rx!r}"
    for origin in rejects:
        assert not compiled.match(origin), f"unexpected match for {origin!r} with {rx!r}"


def test_build_cors_regex_returns_none_when_no_wildcards() -> None:
    assert build_cors_regex(["https://doble9s.vercel.app", "http://localhost:5173"]) is None


def test_build_cors_regex_handles_multiple_wildcards() -> None:
    rx = build_cors_regex(
        ["https://doble9s-*.vercel.app", "https://*.staging.doble9s.com"]
    )
    assert rx is not None
    compiled = re.compile(rx)
    assert compiled.match("https://doble9s-pr-1.vercel.app")
    assert compiled.match("https://api.staging.doble9s.com")
    assert not compiled.match("https://prod.doble9s.com")


def test_add_cors_allows_exact_origin() -> None:
    app = _make_app(["https://doble9s.vercel.app"])
    client = TestClient(app)
    assert _preflight(client, "https://doble9s.vercel.app") == "https://doble9s.vercel.app"


def test_add_cors_allows_wildcard_preview_origin() -> None:
    app = _make_app(["https://doble9s.vercel.app", "https://doble9s-*.vercel.app"])
    client = TestClient(app)
    # Exact prod origin still works.
    assert _preflight(client, "https://doble9s.vercel.app") == "https://doble9s.vercel.app"
    # Preview deploy matches the wildcard.
    preview = "https://doble9s-git-feat-x.vercel.app"
    assert _preflight(client, preview) == preview


def test_add_cors_rejects_unrelated_origin() -> None:
    app = _make_app(["https://doble9s.vercel.app", "https://doble9s-*.vercel.app"])
    client = TestClient(app)
    # Starlette omits the ACAO header for disallowed origins.
    assert _preflight(client, "https://evil.example.com") is None
