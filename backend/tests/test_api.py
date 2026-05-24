"""REST API contract tests — in-memory repos via dependency overrides
(no Postgres/Redis needed for `make check`)."""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from src.api import deps
from src.main import create_app
from src.repositories.memory import (
    MemoryLeaderboardRepository,
    MemoryMatchRepository,
    MemoryStatsRepository,
    MemoryStoreRepository,
    MemoryUserRepository,
)


class FakeMatchStore:
    def __init__(self) -> None:
        self.data: dict[str, dict[str, Any]] = {}

    async def load(self, match_id: str) -> dict[str, Any] | None:
        return self.data.get(match_id)


@pytest.fixture
def client() -> Iterator[TestClient]:
    users = MemoryUserRepository()
    stats = MemoryStatsRepository()
    matches = MemoryMatchRepository()
    store = MemoryStoreRepository(stats)
    leaders = MemoryLeaderboardRepository(users, stats)
    match_store = FakeMatchStore()

    app = create_app()
    app.dependency_overrides[deps.get_user_repo] = lambda: users
    app.dependency_overrides[deps.get_stats_repo] = lambda: stats
    app.dependency_overrides[deps.get_match_repo] = lambda: matches
    app.dependency_overrides[deps.get_store_repo] = lambda: store
    app.dependency_overrides[deps.get_leaderboard_repo] = lambda: leaders
    app.dependency_overrides[deps.get_match_store] = lambda: match_store
    with TestClient(app) as c:
        c.match_store = match_store  # type: ignore[attr-defined]
        yield c


def _register(c: TestClient, name: str = "manolito") -> tuple[str, str]:
    r = c.post(
        "/auth/register",
        json={"username": name, "email": f"{name}@d9.cu", "password": "domino123"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    return body["token"], body["user"]["id"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ── auth ──────────────────────────────────────────────────────────────────
def test_register_login_me_flow(client: TestClient) -> None:
    token, uid = _register(client)

    me = client.get("/auth/me", headers=_auth(token))
    assert me.status_code == 200
    assert me.json()["username"] == "manolito"
    assert me.json()["email"] == "manolito@d9.cu"

    login = client.post("/auth/login", json={"identifier": "manolito", "password": "domino123"})
    assert login.status_code == 200 and login.json()["user"]["id"] == uid


def test_register_conflict_and_bad_login(client: TestClient) -> None:
    _register(client)
    dup = client.post(
        "/auth/register",
        json={"username": "manolito", "email": "manolito@d9.cu", "password": "domino123"},
    )
    assert dup.status_code == 409
    assert dup.json()["code"] == "conflict"

    bad = client.post("/auth/login", json={"identifier": "manolito", "password": "wrong"})
    assert bad.status_code == 401 and bad.json()["code"] == "unauthorized"


def test_me_requires_token(client: TestClient) -> None:
    assert client.get("/auth/me").status_code == 401


def test_register_validation_error(client: TestClient) -> None:
    r = client.post(
        "/auth/register",
        json={"username": "x", "email": "nope", "password": "short"},
    )
    assert r.status_code == 422 and r.json()["code"] == "unprocessable_entity"


# ── matches ───────────────────────────────────────────────────────────────
def test_match_create_join_get(client: TestClient) -> None:
    token, _ = _register(client)
    created = client.post(
        "/matches",
        headers=_auth(token),
        json={"mode": "solo", "fillWithBots": True},
    )
    assert created.status_code == 201, created.text
    m = created.json()
    assert len(m["roomCode"]) == 6 and m["mode"] == "solo"
    assert m["status"] == "LOBBY" and m["targetScore"] == 100

    mid = m["id"]
    wrong = client.post(f"/matches/{mid}/join", headers=_auth(token), json={"roomCode": "ZZZZZZ"})
    assert wrong.status_code == 403

    ok = client.post(
        f"/matches/{mid}/join",
        headers=_auth(token),
        json={"roomCode": m["roomCode"]},
    )
    assert ok.status_code == 200

    missing = client.get(f"/matches/{mid}", headers=_auth(token))
    assert missing.status_code == 404  # no live snapshot yet

    client.match_store.data[mid] = {"matchId": mid, "status": "PLAYING"}  # type: ignore[attr-defined]
    live = client.get(f"/matches/{mid}", headers=_auth(token))
    assert live.status_code == 200 and live.json()["status"] == "PLAYING"


def test_join_unknown_match(client: TestClient) -> None:
    token, _ = _register(client)
    r = client.post(
        "/matches/does-not-exist/join",
        headers=_auth(token),
        json={"roomCode": "ABC123"},
    )
    assert r.status_code == 404


# ── store ─────────────────────────────────────────────────────────────────
def test_store_list_purchase_and_economy(client: TestClient) -> None:
    token, _ = _register(client)
    items = client.get("/store/items", headers=_auth(token))
    assert items.status_code == 200
    assert all(i["owned"] is False for i in items.json())

    buy = client.post("/store/purchase", headers=_auth(token), json={"itemKey": "emote_pollona"})
    assert buy.status_code == 200 and buy.json()["coinsRemaining"] == 0  # 100-100

    again = client.post("/store/purchase", headers=_auth(token), json={"itemKey": "emote_pollona"})
    assert again.status_code == 200 and again.json()["coinsRemaining"] == 0

    broke = client.post("/store/purchase", headers=_auth(token), json={"itemKey": "tiles_oro"})
    assert broke.status_code == 402 and broke.json()["code"] == "payment_required"

    nope = client.post("/store/purchase", headers=_auth(token), json={"itemKey": "ghost"})
    assert nope.status_code == 404

    items2 = client.get("/store/items", headers=_auth(token))
    owned = {i["key"]: i["owned"] for i in items2.json()}
    assert owned["emote_pollona"] is True


# ── users + leaderboard ───────────────────────────────────────────────────
def test_stats_history_leaderboard(client: TestClient) -> None:
    token, uid = _register(client)

    stats = client.get(f"/users/{uid}/stats", headers=_auth(token))
    assert stats.status_code == 200
    assert stats.json()["coins"] == 100 and stats.json()["leagueTier"] == "Bronze"

    assert client.get("/users/unknown/stats", headers=_auth(token)).status_code == 404

    hist = client.get(f"/users/{uid}/history", headers=_auth(token))
    assert hist.status_code == 200
    assert hist.json() == {"items": [], "page": 1, "pageSize": 20, "total": 0}

    lb = client.get("/leaderboard", headers=_auth(token))
    assert lb.status_code == 200
    assert lb.json()[0]["userId"] == uid and lb.json()[0]["rank"] == 1


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
