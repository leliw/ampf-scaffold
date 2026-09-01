import logging
from contextlib import asynccontextmanager
from typing import Annotated

from ampf.auth import AuthService, InsufficientPermissionsError, TokenPayload
from ampf.base import BaseAsyncFactory, EmailTemplate, SmtpEmailSender
from ampf.dependency import DependencyContainer, DependencyRegistry, get_dependency
from app_state import AppState
from core.app_config import AppConfig
from core.roles import Role
from core.users.user_service import UserService
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer

_log = logging.getLogger(__name__)


def lifespan(config: AppConfig):
    DependencyRegistry.clear_objects()
    app_state = AppState.create(config)
    DependencyRegistry.add_all(app_state)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.app_state = app_state
        async with app_state.manage_lifecycle(app):
            yield

    return lifespan


AppConfigDep = Annotated[AppConfig, Depends(get_dependency(AppConfig))]
FactoryDep = Annotated[BaseAsyncFactory, Depends(get_dependency(BaseAsyncFactory))]


def not_production(config: AppConfigDep) -> bool:
    if config.production:
        raise HTTPException(status_code=404, detail="Not found")
    return not config.production


@DependencyRegistry.register
def get_user_service(config: AppConfig, factory: BaseAsyncFactory) -> UserService:
    return UserService(factory.get_collection("users"), config.default_user)


def get_auth_service(config: AppConfigDep, factory: FactoryDep) -> AuthService:
    return AuthService(
        storage_factory=factory,
        user_service=DependencyRegistry.get(UserService),
        auth_config=config.auth,
        email_sender_service=SmtpEmailSender(**config.smtp.model_dump()),
        reset_mail_template=EmailTemplate(**config.reset_password_mail.model_dump()),
    )


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
AuthTokenDep = Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="api/login"))]
OptionalAuthTokenDep = Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="api/login", auto_error=False))]


async def decode_token(auth_service: AuthServiceDep, token: AuthTokenDep) -> TokenPayload:
    return await auth_service.decode_token(token)


async def optional_decode_token(auth_service: AuthServiceDep, token: OptionalAuthTokenDep) -> TokenPayload | None:
    if not token:
        _log.debug("No token provided")
        return None
    return await auth_service.decode_token(token)


TokenPayloadDep = Annotated[TokenPayload, Depends(decode_token)]
OptionalTokenPayloadDep = Annotated[TokenPayload | None, Depends(optional_decode_token)]


class Authorize:
    """Dependency for authorizing users based on their role."""

    def __init__(self, required_role: Role | None = None):
        self.required_role = required_role

    def __call__(self, token_payload: TokenPayloadDep) -> bool:
        if not self.required_role or self.required_role in token_payload.roles:
            return True
        else:
            raise InsufficientPermissionsError()


async def get_dependency_container(background_tasks: BackgroundTasks, token_payload: TokenPayloadDep):
    with DependencyRegistry.scope() as container:
        container.add(background_tasks)
        if token_payload:
            container.add(token_payload)
        yield container


DependencyContainerDep = Annotated[DependencyContainer, Depends(get_dependency_container)]
