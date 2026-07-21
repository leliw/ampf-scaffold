from typing import Annotated

from ampf.auth import (
    ChangePasswordData,
    ResetPassword,
    ResetPasswordRequest,
    Tokens,
)
from core.roles import ROLE_DESCRIPTIONS, Role
from dependencies import (
    AuthServiceDep,
    AuthTokenDep,
    TokenPayloadDep,
)
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

router = APIRouter(tags=["Authentication"])

UserFormDataDep = Annotated[OAuth2PasswordRequestForm, Depends()]


@router.post("/login")
async def login(auth_service: AuthServiceDep, form_data: UserFormDataDep) -> Tokens:
    return await auth_service.authorize(form_data.username, form_data.password)


@router.post("/logout")
async def logout(auth_service: AuthServiceDep, refresh_token: AuthTokenDep) -> None:
    await auth_service.add_to_black_list(refresh_token)


@router.post("/refresh-token")
async def refresh_token(auth_service: AuthServiceDep, refresh_token: AuthTokenDep) -> Tokens:
    return await auth_service.refresh_token(refresh_token)


@router.post("/change-password")
async def change_password(
    auth_service: AuthServiceDep,
    payload: ChangePasswordData,
    token_payload: TokenPayloadDep,
) -> None:
    await auth_service.change_password(token_payload.sub, payload.old_password, payload.new_password)


@router.post("/reset-password-request")
async def reset_password_request(auth_service: AuthServiceDep, rpr: ResetPasswordRequest):
    await auth_service.reset_password_request(rpr.email)


@router.post("/reset-password")
async def reset_password(auth_service: AuthServiceDep, rp: ResetPassword):
    await auth_service.reset_password(rp.email, rp.reset_code, rp.new_password)


class RoleDto(BaseModel):
    name: str
    description: str


@router.get("/roles")
def get_roles() -> list[RoleDto]:
    return [RoleDto(name=role.value, description=ROLE_DESCRIPTIONS[role]) for role in Role]
