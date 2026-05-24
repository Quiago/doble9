"""Gemini avatar wrapper — against httpx.MockTransport (no network/key)."""

from __future__ import annotations

import base64

import httpx
import pytest

from src.services.gemini_service import (
    GeminiAvatarService,
    GeminiError,
    build_avatar_prompt,
)

_PNG = b"\x89PNG\r\n\x1a\nFAKE"


def _client(handler: object) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))  # type: ignore[arg-type]


def test_prompt_has_brand_anchors() -> None:
    p = build_avatar_prompt("wearing a Miami Heat jersey", "smiling")
    assert "Manolito" in p
    assert "guayabera" in p and "felt texture" in p.lower()
    assert "Miami Heat jersey" in p and "smiling" in p


@pytest.mark.asyncio
async def test_generate_avatar_success() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-goog-api-key"] == "k-123"
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {"text": "here you go"},
                                {
                                    "inlineData": {
                                        "mimeType": "image/png",
                                        "data": base64.b64encode(_PNG).decode(),
                                    }
                                },
                            ]
                        }
                    }
                ]
            },
        )

    svc = GeminiAvatarService(api_key="k-123", client=_client(handler))
    img = await svc.generate_avatar("formal esmoquin", "winking")
    assert img.mime_type == "image/png"
    assert img.data == _PNG
    assert img.data_url.startswith("data:image/png;base64,")


@pytest.mark.asyncio
async def test_missing_key_raises() -> None:
    svc = GeminiAvatarService(api_key="", client=_client(lambda r: httpx.Response(200)))
    with pytest.raises(GeminiError, match="GEMINI_API_KEY"):
        await svc.generate_avatar("x", "y")


@pytest.mark.asyncio
async def test_http_error_raises() -> None:
    svc = GeminiAvatarService(
        api_key="k",
        client=_client(lambda r: httpx.Response(500, text="boom")),
    )
    with pytest.raises(GeminiError, match="HTTP 500"):
        await svc.generate_avatar("x", "y")


@pytest.mark.asyncio
async def test_no_image_in_response_raises() -> None:
    svc = GeminiAvatarService(
        api_key="k",
        client=_client(
            lambda r: httpx.Response(
                200, json={"candidates": [{"content": {"parts": [{"text": "hi"}]}}]}
            )
        ),
    )
    with pytest.raises(GeminiError, match="no image"):
        await svc.generate_avatar("x", "y")


@pytest.mark.asyncio
async def test_malformed_response_raises() -> None:
    svc = GeminiAvatarService(
        api_key="k", client=_client(lambda r: httpx.Response(200, json={"oops": 1}))
    )
    with pytest.raises(GeminiError, match="malformed"):
        await svc.generate_avatar("x", "y")
