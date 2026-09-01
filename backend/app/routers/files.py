from ampf.base import Blob, BlobHeader, BlobLocation
from ampf.fastapi import JsonStreamingResponse
from dependencies import DependencyContainerDep
from fastapi import APIRouter, Response, UploadFile
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["Files (only blob and metadata)"])
ITEM_PATH = "/{file_name}"


@router.post("", status_code=201)
async def post(dc: DependencyContainerDep, file: UploadFile) -> BlobHeader:
    from features.files.file_service import FileService

    service = dc.get(FileService)
    blob = Blob.from_upload_file(file)
    await service.upload(blob)
    return BlobHeader.create(blob)


@router.get("")
async def get_all(dc: DependencyContainerDep) -> list[BlobHeader]:
    from features.files.file_service import FileService

    service = dc.get(FileService)
    return JsonStreamingResponse(service.get_all())  # type: ignore


@router.get(ITEM_PATH)
async def download(dc: DependencyContainerDep, file_name: str) -> Response:
    from features.files.file_service import FileService

    service = dc.get(FileService)
    blob = await service.download(BlobLocation(name=file_name))
    headers = {}
    if blob.metadata and blob.metadata.filename:
        headers = {"Content-Disposition": f'attachment; filename="{blob.metadata.filename}"'}
    return StreamingResponse(
        blob.stream(),
        media_type=blob.metadata.content_type if blob.metadata else None,
        headers=headers,
    )


@router.put(ITEM_PATH, status_code=204)
async def put(dc: DependencyContainerDep, file_name: str, file: UploadFile) -> None:
    from features.files.file_service import FileService

    service = dc.get(FileService)
    blob = Blob.from_upload_file(file)
    blob.name = file_name
    await service.delete(file_name)
    await service.upload(blob)


@router.delete(ITEM_PATH, status_code=204)
async def delete(dc: DependencyContainerDep, file_name: str) -> None:
    from features.files.file_service import FileService

    service = dc.get(FileService)
    await service.delete(file_name)
