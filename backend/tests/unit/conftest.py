import importlib
from collections.abc import Generator

import main
import pytest
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
