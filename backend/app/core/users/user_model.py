from typing import Any

from ampf.auth.auth_model import AuthUser
from pydantic import BaseModel, model_serializer


class UserHeader(AuthUser):
    pass


class UserPatch(BaseModel):
    disabled: bool | None = None
    password: str | None = None


class User(UserHeader):
    pass


class UserInDB(User):
    @model_serializer
    def ser_model(self) -> dict[str, Any]:
        ret = dict(self)
        ret.pop("password", None)
        return ret
