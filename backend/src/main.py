# AGENT: Backend
"""FastAPI application (REST surface, Block C).

The WS gateway (python-socketio, namespace `/game`) is mounted here in
Block D. Error responses follow the `ApiError` contract
(`{code, message, details?}`), not FastAPI's default `{detail}`.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import socketio
from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.api import auth, leaderboard, matches, store, users
from src.core.config import get_settings
from src.core.db import dispose_engine
from src.core.middleware import add_cors
from src.core.redis import RedisMatchStore
from src.ws.gateway import build_gateway
from src.ws.registry import MatchRegistry

_STATUS_CODE = {
    400: "bad_request",
    401: "unauthorized",
    402: "payment_required",
    403: "forbidden",
    404: "not_found",
    409: "conflict",
    422: "unprocessable_entity",
}


def _error(status_code: int, message: str, details: dict[str, Any] | None = None) -> JSONResponse:
    body: dict[str, Any] = {
        "code": _STATUS_CODE.get(status_code, "error"),
        "message": message,
    }
    if details is not None:
        body["details"] = details
    return JSONResponse(status_code=status_code, content=body)


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield
    await dispose_engine()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Doble 9's REST API",
        version="1.0.0",
        lifespan=_lifespan,
    )
    add_cors(app, get_settings())

    @app.exception_handler(HTTPException)
    async def _http_exc(_: Request, exc: HTTPException) -> JSONResponse:
        return _error(exc.status_code, str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def _validation_exc(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return _error(
            422, "validation error", {"errors": jsonable_encoder(exc.errors())}
        )

    for module in (auth, matches, users, store, leaderboard):
        app.include_router(module.router)

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


fastapi_app = create_app()

# Realtime gateway (Block D). Socket.IO is served at path `/game`
# (websocket.yml `pathname: /game`); REST is delegated to FastAPI.
# NOTE (Architect/FE): websocket.yml names `/game` as both pathname and
# namespace — here `/game` is the Engine.IO path with the default
# namespace. FE `services/websocket.ts` must match. Flag if a real
# Socket.IO namespace `/game` is required instead.
_registry = MatchRegistry(store=RedisMatchStore())
_sio = build_gateway(_registry, get_settings())

app = socketio.ASGIApp(_sio, other_asgi_app=fastapi_app, socketio_path="game")

