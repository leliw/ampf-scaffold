from pathlib import Path
from typing import Any

import pytest
from ampf.auth import Tokens
from ampf.base import BaseAsyncFactory, BaseFactory
from ampf.mimetypes import get_content_type
from ampf.testing import ApiTestClient
from app_state import AppState


@pytest.fixture(scope="function")
def app_state(client: ApiTestClient) -> AppState:
    return client.app.state.app_state  # type: ignore


@pytest.fixture
def async_factory(app_state: AppState) -> BaseAsyncFactory:
    return app_state.factory


@pytest.fixture
def factory(async_factory: BaseAsyncFactory) -> BaseFactory:
    return async_factory.get_sync_factory()


@pytest.fixture(scope="function")
def tokens(factory: BaseFactory, client: ApiTestClient) -> Tokens:
    # Login
    return client.post_typed("/api/login", 200, Tokens, data={"username": "test", "password": "test"})


@pytest.fixture
def headers(tokens: Tokens) -> dict[str, str]:
    return {"Authorization": f"Bearer {tokens.access_token}"}


# Helper functions


def read_request_file(file_path: Path) -> dict[str, Any]:
    file_name = file_path.name
    content_type = get_content_type(file_name)
    file_content = file_path.read_bytes()
    return {"file": (file_name, file_content, content_type)}
