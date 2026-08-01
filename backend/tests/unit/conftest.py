import importlib
from collections.abc import Generator

import main
import pytest
from ampf.auth import AuthConfig, DefaultUser, TokenExp, Tokens
from ampf.base import BaseAsyncFactory, BaseFactory
from ampf.testing import ApiTestClient
from app_state import AppState
from core.app_config import AppConfig
from dependencies import lifespan
from log_config import setup_logging


@pytest.fixture
def config() -> AppConfig:
    return AppConfig(
        data_dir=None,
        production=False,
        default_user=DefaultUser(username="test", email="test@test.com", password="test"),
        auth=AuthConfig(jwt_secret_key="test"),
    )


@pytest.fixture
def client(config: AppConfig) -> Generator[ApiTestClient]:
    setup_logging()
    importlib.reload(main)
    app = main.app
    # Reconfigure the lifespan to use the test server config
    app.router.lifespan_context = lifespan(config)
    with ApiTestClient(app) as client:
        yield client


@pytest.fixture
def app_state(client: ApiTestClient) -> AppState:
    return client.app.state.app_state  # type: ignore


@pytest.fixture
def async_factory(app_state: AppState) -> BaseAsyncFactory:
    return app_state.factory


@pytest.fixture
def factory(async_factory: BaseAsyncFactory) -> BaseFactory:
    return async_factory.get_sync_factory()


@pytest.fixture
def tokens(factory: BaseFactory, client: ApiTestClient) -> Tokens:
    # Clear token_black_list
    factory.create_compact_storage("token_black_list", TokenExp, "token").drop()
    # Login
    return client.post_typed("/api/login", 200, Tokens, data={"username": "test", "password": "test"})


@pytest.fixture
def headers(tokens: Tokens) -> dict[str, str]:
    return {"Authorization": f"Bearer {tokens.access_token}"}
