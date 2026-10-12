from typing import Annotated
from uuid import UUID

from ampf.dependency import DependencyRegistry
from ampf.fastapi import JsonStreamingResponse
from ampf.tasks import TaskRegistry, TaskRunner
from dependencies import DependencyContainerDep
from fastapi import APIRouter, Query
from features.items.item_model import Item, ItemCreate, ItemHeader, ItemPatch, ItemUpdate

router = APIRouter(tags=["Items"])
ITEM_PATH = "/{item_id}"


@router.post("", status_code=202)
async def post(dc: DependencyContainerDep, value_create: ItemCreate) -> Item:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    task_runner = dc.get(TaskRunner)
    item = await service.post(value_create)
    await task_runner.run_async("task_name", item)
    return item


@TaskRegistry.register("task_name")
async def process_item(item: Item) -> None:
    from features.items.item_processor import ItemProcessor

    processor = DependencyRegistry.get(ItemProcessor)
    await processor(item)


@router.get("", response_model=list[ItemHeader])
async def get_all(dc: DependencyContainerDep, ids: Annotated[list[UUID] | None, Query()] = None):
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    if ids is not None:
        return JsonStreamingResponse(service.get_by_ids(ids))
    return JsonStreamingResponse(service.get_all())


@router.get(ITEM_PATH)
async def get(dc: DependencyContainerDep, item_id: UUID) -> Item:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return await service.get(item_id)


@router.put(ITEM_PATH)
async def put(dc: DependencyContainerDep, item_id: UUID, item: ItemUpdate) -> None:
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
