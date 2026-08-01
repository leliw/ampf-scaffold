import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass

from ampf.base import BaseAsyncFactory
from core.app_config import AppConfig
from fastapi import FastAPI
from storage_def import STORAGE_DEF

_log = logging.getLogger(__name__)


@dataclass
class AppState:
    config: AppConfig
    factory: BaseAsyncFactory
    _initialized: bool = False

    @classmethod
    def create(cls, config: AppConfig) -> "AppState":
        factory = cls.create_factory(config)
        return cls(
            config=config,
            factory=factory,
        )

    @staticmethod
    def create_factory(config: AppConfig) -> BaseAsyncFactory:
        if config.data_dir:
            from ampf.local import LocalAsyncFactory

            factory = LocalAsyncFactory(config.data_dir)
            _log.info(f"Local storage: {config.data_dir}")
        elif not config.production:
            from ampf.in_memory import InMemoryAsyncFactory

            factory = InMemoryAsyncFactory()
            _log.warning("InMemoryFactory is used - it's only for tests!")
        else:
            raise ValueError("No factory setup!")
        factory.register_collections(STORAGE_DEF)
        return factory

    @asynccontextmanager
    async def manage_lifecycle(self, app: FastAPI):
        if not self._initialized:
            self._initialized = True

        yield self
