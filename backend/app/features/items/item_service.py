import logging

from ampf.base import BaseAsyncCollectionStorage
from ampf.cruds import CRUDService
from ampf.dependency import DependencyRegistry
from features.items.item_model import Item, ItemCreate, ItemHeader, ItemUpdate

_log = logging.getLogger(__name__)


@DependencyRegistry.register_class
class ItemService(CRUDService):
    def __init__(self, storage: BaseAsyncCollectionStorage[Item]) -> None:
        super().__init__(storage, Item, ItemHeader, ItemCreate, ItemUpdate)
