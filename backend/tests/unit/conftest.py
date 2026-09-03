import importlib
from collections.abc import Generator

import main
import pytest
from ampf.auth import AuthConfig, DefaultUser
from ampf.testing import ApiTestClient
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
