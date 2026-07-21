from ampf.base import CollectionDef
from pydantic import BaseModel
from core.feature_flags import FeatureFlags

# fmt: off
STORAGE_DEF = [
    CollectionDef("collection", BaseModel, "id", subcollections=[
    ])
]
# fmt: on


def set_storage_formats(feature_flags: FeatureFlags):
    pass
