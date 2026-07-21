from ampf.auth import BaseUserService
from ampf.base import BaseAsyncCollectionStorage, KeyNotExistsException
from pydantic import EmailStr

from .user_model import User, UserHeader, UserInDB, UserPatch


class UserService(BaseUserService[User]):
    """User service implementation"""

    def __init__(self, storage: BaseAsyncCollectionStorage[UserInDB]) -> None:
        super().__init__(UserInDB)
        self.storage = storage

    async def get_user_by_email(self, email: EmailStr) -> User:
        async for user in self.storage.where("email", "==", email.lower()).get_all():
            return user
        raise KeyNotExistsException("users", UserInDB, email)

    async def get_all(self) -> list[UserHeader]:
        return [UserHeader(**i.model_dump(by_alias=True)) async for i in self.storage.get_all()]

    async def create(self, user: User) -> User:
        # TODO: Fix it in AMPF
        await super().create(user)
        return user

    async def get(self, key: str) -> UserInDB:
        return await self.storage.get(key)

    async def put(self, key: str, user: User) -> None:
        user_in_db = UserInDB(**dict(user))
        await self.storage.put(key, user_in_db)

    async def patch(self, key: str, user_patch: UserPatch) -> UserInDB:
        user_patch_dict = user_patch.model_dump(exclude_unset=True)
        if "password" in user_patch_dict:
            user_patch_dict["hashed_password"] = self._hash_password(user_patch_dict["password"])
            user_patch_dict.pop("password")
        return await self.storage.patch(key, user_patch_dict)

    async def delete(self, key: str) -> None:
        await self.storage.delete(key)

    async def is_empty(self) -> bool:
        return await self.storage.is_empty()
