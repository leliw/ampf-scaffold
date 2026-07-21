import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass

from core.app_config import AppConfig
from fastapi import FastAPI

_log = logging.getLogger(__name__)


@dataclass
class AppState:
    config: AppConfig
    _initialized: bool = False

    @classmethod
    def create(cls, config: AppConfig):
        return cls(
            config=config,
        )

    @asynccontextmanager
    async def manage_lifecycle(self, app: FastAPI):
        if not self._initialized:
            self._initialized = True

        yield self
