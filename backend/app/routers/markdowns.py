from uuid import UUID

from ampf.fastapi import JsonStreamingResponse
from dependencies import DependencyContainerDep
from fastapi import APIRouter
from features.markdowns.markdown_model import Markdown, MarkdownCreate, MarkdownHeader, MarkdownPatch, MarkdownUpdate

router = APIRouter(tags=["Markdowns"])
ITEM_PATH = "/{markdown_id}"


@router.post("")
async def post(dc: DependencyContainerDep, value_create: MarkdownCreate) -> Markdown:
    from features.markdowns.markdown_service import MarkdownService

    service = dc.get(MarkdownService)
    return await service.post(value_create)


@router.get("")
async def get_all(dc: DependencyContainerDep) -> list[MarkdownHeader]:
    from features.markdowns.markdown_service import MarkdownService

    service = dc.get(MarkdownService)
    return JsonStreamingResponse(service.get_all())  # type: ignore


@router.get(ITEM_PATH)
async def get(dc: DependencyContainerDep, markdown_id: UUID) -> Markdown:
    from features.markdowns.markdown_service import MarkdownService

    service = dc.get(MarkdownService)
    return await service.get(markdown_id)


@router.put(ITEM_PATH)
async def put(dc: DependencyContainerDep, markdown_id: UUID, markdown: MarkdownUpdate) -> None:
    from features.markdowns.markdown_service import MarkdownService

    service = dc.get(MarkdownService)
    await service.put(markdown_id, markdown)


@router.patch(ITEM_PATH)
async def patch(dc: DependencyContainerDep, markdown_id: UUID, value_patch: MarkdownPatch) -> Markdown:
    from features.markdowns.markdown_service import MarkdownService

    service = dc.get(MarkdownService)
    return await service.patch(markdown_id, value_patch)


@router.delete(ITEM_PATH)
async def delete(dc: DependencyContainerDep, markdown_id: UUID) -> None:
    from features.markdowns.markdown_service import MarkdownService

    service = dc.get(MarkdownService)
    return await service.delete(markdown_id)
