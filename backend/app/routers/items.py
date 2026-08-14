from uuid import UUID

from ampf.dependency import DependencyRegistry
from ampf.fastapi import JsonStreamingResponse
from dependencies import DependencyContainerDep
from fastapi import APIRouter
from features.items.item_model import Item, ItemCreate, ItemHeader, ItemPatch, ItemUpdate

router = APIRouter(tags=["Items"])
ITEM_PATH = "/{item_id}"


@router.post("")
async def post(dc: DependencyContainerDep, value_create: ItemCreate) -> Item:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.post(value_create)


@router.get("")
async def get_all(dc: DependencyContainerDep) -> list[ItemHeader]:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return JsonStreamingResponse(service.get_all())  # type: ignore


@router.get(ITEM_PATH)
async def get(dc: DependencyContainerDep, item_id: UUID) -> Item:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.get(item_id)


@router.put(ITEM_PATH)
async def put(dc: DependencyContainerDep,  item_id: UUID, item: ItemUpdate) -> None:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    await service.put(item_id, item)


@router.patch(ITEM_PATH)
async def patch(dc: DependencyContainerDep, item_id: UUID, value_patch: ItemPatch) -> Item:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.patch(item_id, value_patch)


@router.delete(ITEM_PATH)
async def delete(dc: DependencyContainerDep, item_id: UUID) -> None:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.delete(item_id)
