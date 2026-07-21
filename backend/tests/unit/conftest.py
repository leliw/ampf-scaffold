import pytest
from ampf.base import BaseAsyncFactory
from ampf.testing import ApiTestClient
from app_state import AppState
from core.app_config import AppConfig
from dependencies import lifespan
from fastapi import FastAPI
from main import app as main_app


@pytest.fixture
def config(tmp_path) -> AppConfig:
    return AppConfig(
        data_dir=str(tmp_path),
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


@pytest.fixture
def factory(client: ApiTestClient) -> BaseAsyncFactory:
    return client.app.state.app_state.factory  # type: ignore
