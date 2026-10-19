from uuid import UUID

from ampf.fastapi import JsonStreamingResponse
from dependencies import DependencyContainerDep
from fastapi import APIRouter
from features.items.item_model import Item, ItemCreate, ItemHeader, ItemUpdate

router = APIRouter(tags=["Items"])
ITEM_PATH = "/{item_id}"


@router.post("")
async def post(dc: DependencyContainerDep, value_create: ItemCreate) -> Item:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.create(value_create)


@router.get("", response_model=list[ItemHeader])
async def get_all(dc: DependencyContainerDep):
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return JsonStreamingResponse(service.get_headers())

@router.get(ITEM_PATH)
async def get(dc: DependencyContainerDep, item_id: UUID) -> Item:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.get(item_id)



@router.patch(ITEM_PATH)
async def patch(dc: DependencyContainerDep, item_id: UUID, value_update: ItemUpdate) -> Item:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.update(item_id, value_update)


@router.delete(ITEM_PATH)
async def delete(dc: DependencyContainerDep, item_id: UUID) -> None:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.delete(item_id)
