from uuid import UUID

from ampf.fastapi import JsonStreamingResponse
from dependencies import ItemServiceDep
from fastapi import APIRouter
from features.items.item_model import Item, ItemCreate, ItemHeader, ItemPatch, ItemUpdate

router = APIRouter(tags=["Items"])
ITEM_PATH = "/{item_id}"


@router.post("")
async def post(service: ItemServiceDep, value_create: ItemCreate) -> Item:
    return await service.post(value_create)


@router.get("")
async def get_all(service: ItemServiceDep) -> list[ItemHeader]:
    return JsonStreamingResponse(service.get_all())  # type: ignore



@router.get(ITEM_PATH)
async def get(service: ItemServiceDep, item_id: UUID) -> Item:
    return await service.get(item_id)


@router.put(ITEM_PATH)
async def put(service: ItemServiceDep, item_id: UUID, item: ItemUpdate) -> None:
    await service.put(item_id, item)


@router.patch(ITEM_PATH)
async def patch(service: ItemServiceDep, item_id: UUID, value_patch: ItemPatch) -> Item:
    return await service.patch(item_id, value_patch)


@router.delete(ITEM_PATH)
async def delete(service: ItemServiceDep, item_id: UUID) -> None:
    return await service.delete(item_id)


