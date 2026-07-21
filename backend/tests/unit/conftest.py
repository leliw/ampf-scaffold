import pytest
import pytest_asyncio
from ampf.auth import AuthConfig, DefaultUser, TokenExp, Tokens
from ampf.base import BaseAsyncFactory
from ampf.testing import ApiTestClient
from fastapi import FastAPI

from app.app_state import AppState
from app.core.app_config import AppConfig
from app.dependencies import lifespan
from app.main import app as main_app


@pytest.fixture
def config(tmp_path) -> AppConfig:
    return AppConfig(
        data_dir=str(tmp_path),
        production=False,
        default_user=DefaultUser(username="test", email="test@test.com", password="test"),
        auth=AuthConfig(jwt_secret_key="test"),
    )


@pytest.fixture
def app(config: AppConfig) -> FastAPI:
    app = main_app
    # Reconfigure the lifespan to use the test server config
    app.router.lifespan_context = lifespan(config)
    return app


@pytest.fixture
def client(app: FastAPI) -> ApiTestClient:  # type: ignore
    with ApiTestClient(app) as client:
        yield client  # type: ignore


@pytest.fixture
def app_state(client: ApiTestClient) -> AppState:
    return client.app.state.app_state  # type: ignore


@pytest.fixture
def factory(client: ApiTestClient) -> BaseAsyncFactory:
    return client.app.state.app_state.factory  # type: ignore


@pytest_asyncio.fixture
async def tokens(factory: BaseAsyncFactory, client: ApiTestClient) -> Tokens:
    # Clear token_black_list
    await factory.create_compact_storage("token_black_list", TokenExp, "token").drop()
    # Login
    return client.post_typed("/api/login", 200, Tokens, data={"username": "test", "password": "test"})


@pytest.fixture
def headers(tokens: Tokens) -> dict[str, str]:
    return {"Authorization": f"Bearer {tokens.access_token}"}
