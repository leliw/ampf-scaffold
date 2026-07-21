from ampf.base import CollectionDef
from core.feature_flags import FeatureFlags
from core.users.user_model import UserInDB

# fmt: off
STORAGE_DEF = [
    CollectionDef("users", UserInDB, "username", subcollections=[
    ])
]
# fmt: on


def set_storage_formats(feature_flags: FeatureFlags):
    pass
