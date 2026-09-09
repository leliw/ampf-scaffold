import logging
from typing import Annotated
from uuid import UUID

from ampf.base.blob_model import BlobCreate
from ampf.dependency import DependencyRegistry
from ampf.fastapi import BlobStreamingResponse, JsonStreamingResponse
from ampf.tasks import TaskRegistry, TaskRunner
from dependencies import DependencyContainerDep
from fastapi import APIRouter, Form, Query, Response, UploadFile
from features.documents.document_model import Document, DocumentCreate, DocumentPatch
from integrations.conversion_model import ConversionResponse

router = APIRouter(tags=["Documents"])
ITEM_PATH = "/{document_id}"
CONTENT_PATH = f"{ITEM_PATH}/content"
_log = logging.getLogger(__name__)


@router.post("", status_code=201)
async def post(
    dc: DependencyContainerDep,
    file: UploadFile,
    name: Annotated[str, Form()],
    content_type: Annotated[str | None, Form()] = None,
    src_url: Annotated[str | None, Form()] = None,
    keywords: Annotated[list[str] | None, Form()] = None,
) -> Document:
    from features.documents.document_service import DocumentService

    service = dc.get(DocumentService)
    blob_create = BlobCreate.from_upload_file(file)
    document_create = DocumentCreate(
        name=name,
        content_type=content_type or file.content_type,
        src_url=src_url,
        keywords=keywords,
    )
    document = await service.post(blob_create, document_create)
    if document.content_type.startswith("application/pdf"):
        document = await convert_to_md(dc, document.id)
    return document


@router.get("", response_model=list[Document])
async def get_documents(dc: DependencyContainerDep, ids: Annotated[list[UUID] | None, Query()] = None):
    from features.documents.document_service import DocumentService

    service = dc.get(DocumentService)
    if ids is not None:
        return JsonStreamingResponse(service.get_by_ids(ids))
    return JsonStreamingResponse(service.get_all())


@router.get(CONTENT_PATH)
async def download(dc: DependencyContainerDep, document_id: UUID) -> Response:
    from features.documents.document_service import DocumentService

    service = dc.get(DocumentService)
    blob = await service.download(document_id)
    return BlobStreamingResponse(blob, headers={"Content-Disposition": f'attachment; filename="{blob.name}"'})


@router.get(ITEM_PATH)
async def get(dc: DependencyContainerDep, document_id: UUID) -> Document:
    from features.documents.document_service import DocumentService

    service = dc.get(DocumentService)
    return await service.get(document_id)


@router.put(CONTENT_PATH, status_code=204)
async def put(
    dc: DependencyContainerDep,
    document_id: UUID,
    file: UploadFile,
) -> None:
    from features.documents.document_service import DocumentService

    service = dc.get(DocumentService)
    blob_create = BlobCreate.from_upload_file(file)
    await service.put(document_id, blob_create)


@router.patch(ITEM_PATH)
async def patch(dc: DependencyContainerDep, document_id: UUID, document_patch: DocumentPatch) -> Document:
    from features.documents.document_service import DocumentService

    service = dc.get(DocumentService)
    return await service.patch(document_id, document_patch)


@router.delete(ITEM_PATH, status_code=204)
async def delete(dc: DependencyContainerDep, document_id: UUID) -> None:
    from features.documents.document_service import DocumentService

    service = dc.get(DocumentService)
    await service.delete(document_id)


@router.post(f"{ITEM_PATH}/convert-to-md", status_code=202)
async def convert_to_md(dc: DependencyContainerDep, document_id: UUID) -> Document:
    from features.documents.document_conversion_processor import DocumentConversionProcessor

    processor = dc.get(DocumentConversionProcessor)
    task_runner = dc.get(TaskRunner)
    request, document = await processor.get_conversion_request(document_id)
    await task_runner.run_async("pdf_2_markdown", request)
    return document


@TaskRegistry.register("pdf_2_markdown", external=True)
async def response_handler(response: ConversionResponse) -> None:
    from features.documents.document_conversion_processor import DocumentConversionProcessor

    processor = DependencyRegistry.get(DocumentConversionProcessor)
    await processor.process_conversion_response(response)
