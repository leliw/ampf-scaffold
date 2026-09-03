import importlib
import logging
from pathlib import Path

import main
import pytest
from ampf.auth import DefaultUser
from ampf.testing import ApiTestClient
from core.app_config import AppConfig
from dependencies import lifespan
from dotenv import load_dotenv
from log_config import setup_logging

_log = logging.getLogger(__name__)


@pytest.fixture
def config(monkeypatch: pytest.MonkeyPatch) -> AppConfig:
    env_dir = (Path(__file__).resolve().parent.parent.parent.parent / "infra" / "env" / "int").resolve()
    _log.info("env_dir: %s", env_dir)
    load_dotenv(env_dir / ".env.app", override=True)
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", str(env_dir / ".gcp_credentials.json"))
    return AppConfig(
        default_user=DefaultUser(username="test", email="test@test.com", password="test"),
    )


@pytest.fixture
def client(config: AppConfig):
    setup_logging()
    importlib.reload(main)
    app = main.app
    # Reconfigure the lifespan to use the test server config
    app.router.lifespan_context = lifespan(config)
    with ApiTestClient(app) as client:
        yield client
