import logging
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from uuid import UUID

from ampf.base import BaseAsyncCollectionStorage
from ampf.dependency import DependencyRegistry

from .markdown_model import Markdown, MarkdownCreate, MarkdownHeader, MarkdownPatch, MarkdownUpdate

_log = logging.getLogger(__name__)


@DependencyRegistry.register_class
class MarkdownService:
    def __init__(self, storage: BaseAsyncCollectionStorage[Markdown]):
        self.storage = storage

    async def post(self, value_create: MarkdownCreate) -> Markdown:
        value = Markdown.create(value_create)
        await self.storage.create(value)
        return value

    async def get_all(self) -> AsyncGenerator[MarkdownHeader]:
        async for v in self.storage.get_all():
            yield MarkdownHeader.model_validate(v.model_dump())

    async def get(self, key: UUID) -> Markdown:
        return await self.storage.get(key)

    async def put(self, key: UUID, value_update: MarkdownUpdate) -> None:
        value = await self.get(key)
        dict_update = value_update.model_dump()
        dict_update["updated_at"] = datetime.now(UTC)
        value = value.model_copy(update=dict_update)
        await self.storage.put(key, value)

    async def patch(self, key: UUID, value_patch: MarkdownPatch) -> Markdown:
        dict_patch = value_patch.model_dump(exclude_unset=True)
        dict_patch["updated_at"] = datetime.now(UTC)
        return await self.storage.patch(key, dict_patch)

    async def delete(self, key: UUID) -> None:
        await self.storage.delete(key)
