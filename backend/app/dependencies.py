import logging
from contextlib import asynccontextmanager
from typing import Annotated

from ampf.auth import AuthService, InsufficientPermissionsError, TokenPayload
from ampf.base import BaseEmailSender, EmailTemplate, SmtpEmailSender
from ampf.dependency import DependencyRegistry, get_dependency
from app_state import AppState
from core.app_config import AppConfig
from core.roles import Role
from core.users.user_service import UserService
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer

_log = logging.getLogger(__name__)


def lifespan(config: AppConfig):
    DependencyRegistry.clear()
    app_state = AppState.create(config)
    DependencyRegistry.add(app_state)
    DependencyRegistry.add_all(app_state)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.app_state = app_state
        async with app_state.manage_lifecycle(app):
            yield

    return lifespan


AppStateDep = Annotated[AppState, Depends(get_dependency(AppState))]
AppConfigDep = Annotated[AppConfig, Depends(get_dependency(AppConfig))]
UserServiceDep = Annotated[UserService, Depends(get_dependency(UserService))]


def not_production(app_state: AppStateDep) -> bool:
    if app_state.config.production:
        raise HTTPException(status_code=404, detail="Not found")
    return not app_state.config.production


def get_email_sender(app_state: AppStateDep) -> BaseEmailSender:
    return SmtpEmailSender(
        host=app_state.config.smtp.host,
        port=app_state.config.smtp.port,
        username=app_state.config.smtp.username,
        password=app_state.config.smtp.password,
        use_ssl=app_state.config.smtp.use_ssl,
    )


EmailSenderDep = Annotated[BaseEmailSender, Depends(get_email_sender)]


def get_auth_service(app_state: AppStateDep) -> AuthService:
    reset_mail_template = EmailTemplate(
        sender=app_state.config.reset_password_mail.sender,
        subject=app_state.config.reset_password_mail.subject,
        body_template=app_state.config.reset_password_mail.body_template,
    )
    return AuthService(
        storage_factory=app_state.factory,
        user_service=app_state.user_service,
        auth_config=app_state.config.auth,
        email_sender_service=get_email_sender(app_state),
        reset_mail_template=reset_mail_template,
    )


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
AuthTokenDep = Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="api/login"))]


async def decode_token(auth_service: AuthServiceDep, token: AuthTokenDep) -> TokenPayload:
    return await auth_service.decode_token(token)


TokenPayloadDep = Annotated[TokenPayload, Depends(decode_token)]


class Authorize:
    """Dependency for authorizing users based on their role."""

    def __init__(self, required_role: Role | None = None):
        self.required_role = required_role

    def __call__(self, token_payload: TokenPayloadDep) -> bool:
        if not self.required_role or self.required_role in token_payload.roles:
            return True
        else:
            raise InsufficientPermissionsError()
