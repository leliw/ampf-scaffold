import asyncio
import logging
from collections.abc import AsyncIterator
from copy import copy
from datetime import UTC, datetime
from uuid import UUID

from ampf.base import BaseAsyncCollectionStorage, BaseAsyncFactory, Blob, BlobCreate
from ampf.dependency import DependencyRegistry

from .document_model import Document, DocumentCreate, DocumentMetadata, DocumentPatch

_log = logging.getLogger(__name__)


@DependencyRegistry.register_class
class DocumentService:
    def __init__(self, storage: BaseAsyncCollectionStorage[Document], base_async_factory: BaseAsyncFactory):
        self.storage = storage
        self.blob_storage = base_async_factory.create_blob_storage("documents", DocumentMetadata)

    async def post(self, blob_create: BlobCreate, document_create: DocumentCreate) -> Document:
        blob = Blob.create(blob_create, DocumentMetadata.create(document_create))
        document = Document.create(document_create, blob.name)
        async with asyncio.TaskGroup() as tg:
            tg.create_task(self.blob_storage.upload_async(blob))
            tg.create_task(self.storage.create(document))
        return document

    async def get_all(self) -> AsyncIterator[Document]:
        async for document in self.storage.get_all():
            yield document

    async def get(self, id: UUID) -> Document:
        return await self.storage.get(id)

    async def download(self, id: UUID) -> Blob:
        document = await self.storage.get(id)
        blob = await self.blob_storage.download_async(document.blob_name)
        blob.name = document.name
        return blob

    async def patch(self, id: UUID, document_patch: DocumentPatch) -> Document:
        old_document = await self.storage.get(id)
        async with asyncio.TaskGroup() as tg:
            t1 = tg.create_task(self.storage.patch(id, document_patch))
            t2 = tg.create_task(self.blob_storage.get_metadata(old_document.blob_name))
        new_document = t1.result()
        old_metadata = t2.result()
        if old_metadata:
            new_metadata = copy(old_metadata)
            new_metadata.update(new_document)
            if new_metadata != old_metadata:
                await self.blob_storage.put_metadata(old_document.blob_name, new_metadata)
        return new_document

    async def put(self, id: UUID, blob_create: BlobCreate) -> Document:
        document = await self.get(id)
        old_blob_name = document.blob_name
        new_blob = Blob.create(blob_create, DocumentMetadata.create(document))
        document.blob_name = new_blob.name
        document.content_type = new_blob.content_type
        document.updated_at = datetime.now(UTC)
        async with asyncio.TaskGroup() as tg:
            tg.create_task(self.blob_storage.upload_async(new_blob))
            tg.create_task(self.storage.save(document))
        await self.blob_storage.delete_async(old_blob_name)
        return document

    async def delete(self, id: UUID) -> None:
        document = await self.storage.get(id)
        async with asyncio.TaskGroup() as tg:
            tg.create_task(self.storage.delete(id))
            tg.create_task(self.blob_storage.delete_async(document.blob_name))
