from typing import Annotated
from uuid import UUID

from ampf.fastapi import JsonStreamingResponse
from dependencies import FactoryDep
from fastapi import APIRouter, Depends
from features.markdowns.markdown_model import Markdown, MarkdownCreate, MarkdownHeader, MarkdownPatch, MarkdownUpdate
from features.markdowns.markdown_service import MarkdownService

router = APIRouter(tags=["Markdowns"])
ITEM_PATH = "/{markdown_id}"


def get_markdown_service(factory: FactoryDep) -> MarkdownService:
    return MarkdownService(factory.get_collection(Markdown))


MarkdownServiceDep = Annotated[MarkdownService, Depends(get_markdown_service)]


@router.post("")
async def post(service: MarkdownServiceDep, value_create: MarkdownCreate) -> Markdown:
    return await service.post(value_create)


@router.get("")
async def get_all(service: MarkdownServiceDep) -> list[MarkdownHeader]:
    return JsonStreamingResponse(service.get_all())  # type: ignore


@router.get(ITEM_PATH)
async def get(service: MarkdownServiceDep, markdown_id: UUID) -> Markdown:
    return await service.get(markdown_id)


@router.put(ITEM_PATH)
async def put(service: MarkdownServiceDep, markdown_id: UUID, markdown: MarkdownUpdate) -> None:
    await service.put(markdown_id, markdown)


@router.patch(ITEM_PATH)
async def patch(service: MarkdownServiceDep, markdown_id: UUID, value_patch: MarkdownPatch) -> Markdown:
    return await service.patch(markdown_id, value_patch)


@router.delete(ITEM_PATH)
async def delete(service: MarkdownServiceDep, markdown_id: UUID) -> None:
    return await service.delete(markdown_id)
