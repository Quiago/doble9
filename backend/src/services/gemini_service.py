# AGENT: Backend
"""Gemini image generation — Muppet-style avatar/skin generator
(`CLAUDE.md §6`).

Why Gemini and not Claude: Claude doesn't generate images; Gemini Flash
produces consistent character art from a style-referenced prompt.

Cost guardrail (`CLAUDE.md §15`): image gen ≈ $0.04/image (Gemini Flash);
dev budget ~$20/mo. Callers should cache results (e.g. persisted
`avatar_url`) and never call this in a hot path.

The httpx client is injectable so tests run against `httpx.MockTransport`
(no network, no real key).
"""

from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import Any

import httpx

from src.core.config import get_settings

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-2.0-flash-exp-image-generation"
REQUEST_TIMEOUT_S = 30.0


class GeminiError(Exception):
    """Generation failed (missing key, HTTP error, or no image returned)."""


@dataclass(slots=True)
class GeneratedImage:
    mime_type: str
    data: bytes

    @property
    def data_url(self) -> str:
        b64 = base64.b64encode(self.data).decode("ascii")
        return f"data:{self.mime_type};base64,{b64}"


def build_avatar_prompt(style: str, expression: str, *, character: str = "Manolito") -> str:
    """Style-anchored prompt for a consistent Cuban-Muppet avatar."""
    return (
        f"Generate a Muppet-style Cuban puppet character named {character}. "
        f"{style}. {expression}. White guayabera shirt, gold chain, "
        f"sunglasses. Felt texture with visible stitching. Plain white "
        f"background. High quality toy photography."
    )


class GeminiAvatarService:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        client: httpx.AsyncClient | None = None,
        model: str = DEFAULT_MODEL,
        base_url: str = GEMINI_BASE_URL,
    ) -> None:
        self._api_key = api_key if api_key is not None else get_settings().gemini_api_key
        self._client = client
        self._owns_client = client is None
        self._model = model
        self._base_url = base_url.rstrip("/")

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S)
        return self._client

    async def generate_avatar(self, style: str, expression: str) -> GeneratedImage:
        if not self._api_key:
            raise GeminiError("GEMINI_API_KEY not configured")

        url = f"{self._base_url}/models/{self._model}:generateContent"
        payload: dict[str, Any] = {
            "contents": [{"parts": [{"text": build_avatar_prompt(style, expression)}]}],
            "generationConfig": {"responseModalities": ["Text", "Image"]},
        }
        client = await self._http()
        try:
            resp = await client.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self._api_key,
                },
                json=payload,
            )
        except httpx.HTTPError as exc:
            raise GeminiError(f"Gemini request failed: {exc}") from exc

        if resp.status_code >= 400:
            raise GeminiError(f"Gemini HTTP {resp.status_code}: {resp.text[:200]}")
        return _extract_image(resp.json())

    async def aclose(self) -> None:
        if self._client is not None and self._owns_client:
            await self._client.aclose()
            self._client = None


def _extract_image(body: dict[str, Any]) -> GeneratedImage:
    """Pull the first inline image out of a Gemini generateContent reply."""
    try:
        parts = body["candidates"][0]["content"]["parts"]
    except (KeyError, IndexError, TypeError) as exc:
        raise GeminiError("malformed Gemini response") from exc
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and inline.get("data"):
            mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
            try:
                raw = base64.b64decode(inline["data"])
            except (ValueError, TypeError) as exc:
                raise GeminiError("invalid base64 image data") from exc
            return GeneratedImage(mime_type=mime, data=raw)
    raise GeminiError("Gemini returned no image")
