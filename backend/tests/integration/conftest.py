# AGENT: Architect — cross-boundary integration fixtures.
"""Live-infra fixtures for the real over-the-wire FE↔BE suite.

Unlike the hermetic unit conftest (which points settings at a throwaway DSN),
these tests need the *actual* stack the frontend talks to:

  * Postgres + Redis reachable on the local infra ports (`make infra-up`),
  * a live ASGI server (`src.main:app`) on a real socket, so the Socket.IO
    transport, the connect-auth handshake (ADR-007) and the JSON envelope are
    all exercised end to end — not mocked, not in-process.

The whole module self-skips if the infra is not up, so `make test-e2e` is safe
to run anywhere; it only does real work when there is a real stack to hit.
"""

from __future__ import annotations

import contextlib
import socket
import threading
import time
from collections.abc import Iterator

import httpx
import pytest

# Local infra (see docker-compose / `make infra-up`): host Postgres occupies
# 5432, so the container is mapped to 5433 (matches backend/.env).
_PG_HOST, _PG_PORT = "localhost", 5433
_REDIS_HOST, _REDIS_PORT = "localhost", 6379
_E2E_ENV = {
    "DATABASE_URL": "postgresql+asyncpg://doble9s:doble9s@localhost:5433/doble9s",
    "REDIS_URL": "redis://localhost:6379/0",
    "SECRET_KEY": "e2e-secret-key-32-bytes-minimum-xxxxxx",
    "ALGORITHM": "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "60",
    "CORS_ORIGINS": "http://localhost:5173",
}


def _reachable(host: str, port: int, timeout: float = 0.5) -> bool:
    with contextlib.suppress(OSError):
        with socket.create_connection((host, port), timeout=timeout):
            return True
    return False


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


@pytest.fixture(scope="session", autouse=True)
def _require_infra() -> None:
    """Skip the entire integration suite unless Postgres + Redis are up."""
    missing = []
    if not _reachable(_PG_HOST, _PG_PORT):
        missing.append(f"Postgres :{_PG_PORT}")
    if not _reachable(_REDIS_HOST, _REDIS_PORT):
        missing.append(f"Redis :{_REDIS_PORT}")
    if missing:
        pytest.skip(
            "integration infra unreachable: "
            + ", ".join(missing)
            + " — run `make infra-up` and `make migrate` first.",
            allow_module_level=True,
        )


@pytest.fixture(autouse=True)
def _keep_live_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Re-assert the live-infra env after the hermetic unit autouse (which runs
    first, being defined in the parent conftest) swaps in its throwaway DSN.
    The live engine is created lazily inside the uvicorn worker on the first DB
    request, so the env must be correct at that moment — not the unit DSN."""
    from src.core.config import get_settings

    for key, value in _E2E_ENV.items():
        monkeypatch.setenv(key, value)
    get_settings.cache_clear()


@pytest.fixture(scope="session")
def server(_require_infra: None) -> Iterator[str]:
    """Run `src.main:app` under a real uvicorn in a background thread.

    Env is set on the real process environment *before* the worker thread
    imports the app, and the settings/engine caches are cleared, so the live
    app binds to the real infra (not the unit conftest's throwaway DSN).
    Yields the base HTTP URL.
    """
    import os

    for key, value in _E2E_ENV.items():
        os.environ[key] = value

    # Drop cached singletons keyed on the old (unit) settings.
    from src.core import db
    from src.core.config import get_settings

    get_settings.cache_clear()
    db.get_engine.cache_clear()
    with contextlib.suppress(Exception):
        db.get_sessionmaker.cache_clear()

    import uvicorn

    port = _free_port()
    config = uvicorn.Config(
        "src.main:app", host="127.0.0.1", port=port, log_level="warning", lifespan="on"
    )
    uv_server = uvicorn.Server(config)
    thread = threading.Thread(target=uv_server.run, daemon=True)
    thread.start()

    base = f"http://127.0.0.1:{port}"
    deadline = time.time() + 20
    while time.time() < deadline:
        with contextlib.suppress(Exception):
            if httpx.get(f"{base}/health", timeout=1).status_code == 200:
                break
        time.sleep(0.1)
    else:  # pragma: no cover - startup failure
        uv_server.should_exit = True
        pytest.fail("integration server did not become healthy in 20s")

    yield base

    uv_server.should_exit = True
    thread.join(timeout=10)
