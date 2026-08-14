from ampf.dependency import DependencyRegistry
from core.roles import Role
from core.users.user_model import User, UserHeader, UserPatch
from dependencies import Authorize, UserService
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(tags=["Users"], dependencies=[Depends(Authorize(Role.ADMIN))])


@router.post("")
async def create(user: User) -> User:
    user_service = DependencyRegistry.get(UserService)
    return await user_service.create(user)


@router.get("")
async def get_all() -> list[UserHeader]:
    user_service = DependencyRegistry.get(UserService)
    return await user_service.get_all()


@router.get("/{username}")
async def get(username: str) -> User:
    user_service = DependencyRegistry.get(UserService)
    return await user_service.get(username)


@router.put("/{username}")
async def update(username: str, user: User) -> None:
    user_service = DependencyRegistry.get(UserService)
    return await user_service.update(username, user)


@router.delete("/{username}")
async def delete(username: str) -> None:
    user_service = DependencyRegistry.get(UserService)
    await user_service.delete(username)


class PasswordDTO(BaseModel):
    password: str


@router.patch("/{username}/change-password")
async def change_password(username: str, body: PasswordDTO) -> None:
    user_service = DependencyRegistry.get(UserService)
    await user_service.patch(username, UserPatch(password=body.password))
