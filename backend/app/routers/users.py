from typing import List

from core.roles import Role
from core.users.user_model import User, UserHeader, UserPatch
from dependencies import Authorize, UserServiceDep
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(tags=["Users"], dependencies=[Depends(Authorize(Role.ADMIN))])


@router.post("")
async def create(user_service: UserServiceDep, user: User) -> User:
    return await user_service.create(user)


@router.get("")
async def get_all(user_service: UserServiceDep) -> List[UserHeader]:
    return await user_service.get_all()


@router.get("/{username}")
async def get(user_service: UserServiceDep, username: str) -> User:
    return await user_service.get(username)


@router.put("/{username}")
async def update(user_service: UserServiceDep, username: str, user: User) -> None:
    return await user_service.update(username, user)


@router.delete("/{username}")
async def delete(user_service: UserServiceDep, username: str) -> None:
    await user_service.delete(username)

class PasswordDTO(BaseModel):
    password: str


@router.patch("/{username}/change-password")
async def change_password(user_service: UserServiceDep, username: str, body: PasswordDTO) -> None:
    await user_service.patch(username, UserPatch(password=body.password))
