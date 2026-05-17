# AGENT: Backend
"""Store router — catalogue (with per-user owned flag) and purchase."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from src.api.deps import CurrentUser, StoreRepoDep
from src.api.schemas import (
    PurchaseRequest,
    PurchaseResponse,
    StoreItem,
    StoreItemType,
)
from src.repositories.protocols import InsufficientCoinsError, NotFoundError

router = APIRouter(tags=["store"])


@router.get("/store/items", response_model=list[StoreItem])
async def list_items(current: CurrentUser, store: StoreRepoDep) -> list[StoreItem]:
    items = await store.list_items(current.id)
    return [
        StoreItem(
            key=i.key, type=StoreItemType(i.type), name=i.name,
            description=i.description, price_coins=i.price_coins,
            preview_url=i.preview_url, owned=i.owned,
        )
        for i in items
    ]


@router.post("/store/purchase", response_model=PurchaseResponse)
async def purchase(
    body: PurchaseRequest, current: CurrentUser, store: StoreRepoDep
) -> PurchaseResponse:
    try:
        remaining = await store.purchase(current.id, body.item_key)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except InsufficientCoinsError as exc:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED, str(exc)
        ) from exc
    return PurchaseResponse(item_key=body.item_key, coins_remaining=remaining)
