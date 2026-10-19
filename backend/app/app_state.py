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
        if config.gcp_root_storage or config.gcp_bucket_name or config.gcp_database:
            from ampf.gcp import GcpAsyncFactory

            factory = GcpAsyncFactory(
                root_storage=config.gcp_root_storage,
                bucket_name=config.gcp_bucket_name,
                project_id=config.project_id,
                database=config.gcp_database,
            )
        elif config.data_dir:
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
