import pytest
from ampf.testing import ApiTestClient
from app_state import AppState
from core.app_config import AppConfig
from dependencies import lifespan
from fastapi import FastAPI
from main import app as main_app


@pytest.fixture
def config() -> AppConfig:
    return AppConfig(
        production=False,
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
