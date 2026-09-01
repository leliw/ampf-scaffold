import logging
from typing import Annotated
from uuid import UUID

from ampf.base.blob_model import BlobCreate
from ampf.fastapi import BlobStreamingResponse, JsonStreamingResponse
from dependencies import DependencyContainerDep
from fastapi import APIRouter, Form, Response, UploadFile
from features.documents.document_model import Document, DocumentCreate, DocumentPatch

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
    return await service.post(blob_create, document_create)


@router.get("")
async def get_all_documents(dc: DependencyContainerDep) -> list[Document]:
    from features.documents.document_service import DocumentService

    service = dc.get(DocumentService)
    return JsonStreamingResponse(service.get_all())  # type: ignore


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
