from ampf.base import CollectionDef
from core.feature_flags import FeatureFlags
from core.users.user_model import UserInDB
from features.items.item_model import Item
from features.markdowns.markdown_model import Markdown

# fmt: off
STORAGE_DEF = [
    CollectionDef("users", UserInDB, "username", subcollections=[
    ]),
    CollectionDef("items", Item),
    CollectionDef("markdowns", Markdown)
]
# fmt: on


def set_storage_formats(feature_flags: FeatureFlags):
    pass
