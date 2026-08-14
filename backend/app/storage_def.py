from ampf.base import BaseAsyncCollectionStorage, BaseAsyncFactory, CollectionDef
from ampf.dependency import DependencyRegistry
from core.feature_flags import FeatureFlags
from core.users.user_model import UserInDB
from features.items.item_model import Item

# fmt: off
STORAGE_DEF: list[CollectionDef] = [
    CollectionDef("users", UserInDB, "username", subcollections=[
    ]),
    CollectionDef("items", Item)
]
# fmt: on


def register_collections(factory: BaseAsyncFactory, collection_defs: list[CollectionDef] = STORAGE_DEF) -> None:
    if collection_defs == STORAGE_DEF:
        factory.register_collections(STORAGE_DEF)

    def register_storage(sd):
        @DependencyRegistry.register_for_type(BaseAsyncCollectionStorage[sd.clazz])  # type: ignore
        def get_collection():
            return factory.get_collection(sd.clazz)

    for sd in collection_defs:
        register_storage(sd)


def set_storage_formats(feature_flags: FeatureFlags):
    pass
