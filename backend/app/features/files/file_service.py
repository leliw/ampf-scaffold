import logging
from collections.abc import AsyncGenerator

from ampf.base import BaseAsyncFactory, Blob
from ampf.base.blob_model import BlobHeader, BlobLocation
from ampf.dependency import DependencyRegistry

from .file_model import FileMetadata

_log = logging.getLogger(__name__)


@DependencyRegistry.register_class
class FileService:
    def __init__(self, async_factory: BaseAsyncFactory):
        self.blob_storage = async_factory.create_blob_storage("files", FileMetadata)

    async def upload(self, blob: Blob[FileMetadata]) -> None:
        await self.blob_storage.upload_async(blob)

    async def download(self, blob_location: BlobLocation) -> Blob[FileMetadata]:
        return await self.blob_storage.download_async(blob_location.name)

    async def get_all(self) -> AsyncGenerator[BlobHeader]:
        async for h in self.blob_storage.list_blobs():
            yield h

    async def delete(self, file_name: str) -> None:
        await self.blob_storage.delete_async(file_name)
