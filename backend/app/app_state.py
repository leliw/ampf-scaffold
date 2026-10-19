import logging
from dataclasses import dataclass

from ampf.base import BaseAsyncFactory
from ampf.fastapi import BaseAppState
from core.app_config import AppConfig
from storage_def import register_collections

_log = logging.getLogger(__name__)


@dataclass(kw_only=True)
class AppState(BaseAppState):
    config: AppConfig
    factory: BaseAsyncFactory

    @classmethod
    def create(cls, config: AppConfig) -> "AppState":
        if config.data_dir:
            from ampf.local import LocalAsyncFactory

            factory = LocalAsyncFactory(config.data_dir)
            _log.info("Local storage: %s", config.data_dir)
        elif not config.production:
            from ampf.in_memory import InMemoryAsyncFactory

            factory = InMemoryAsyncFactory()
            _log.warning("InMemoryFactory is used - it's only for tests!")
        else:
            raise ValueError("No factory setup!")
        register_collections(factory)
        return cls(config=config, factory=factory)
