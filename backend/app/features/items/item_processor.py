import asyncio
import logging

from ampf.dependency import DependencyRegistry
from features.items.item_model import Item, ItemPatch
from features.items.item_service import ItemService

_log = logging.getLogger(__name__)


@DependencyRegistry.register_class
class ItemProcessor:
    def __init__(self, service: ItemService):
        self.service = service

    async def __call__(self, item: Item) -> None:
        try:
            item = await self.service.patch(item.id, item.start())
            await asyncio.sleep(1)
            value_patch = ItemPatch(
                processed_title=item.title.upper(),
                **item.finish().model_dump(exclude_unset=True),
            )
            item = await self.service.patch(item.id, value_patch)
        except Exception as e:  # noqa: BLE001
            _log.exception("Item %s processing failed: %s", item.id, e)
            item = await self.service.patch(item.id, item.finish(str(e)))
