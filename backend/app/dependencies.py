import logging
from contextlib import asynccontextmanager
from typing import Annotated

from ampf.dependency import DependencyRegistry, get_dependency
from app_state import AppState
from core.app_config import AppConfig
from fastapi import Depends, FastAPI, HTTPException

_log = logging.getLogger(__name__)


def lifespan(config: AppConfig):
    DependencyRegistry.clear()
    app_state = AppState.create(config)
    DependencyRegistry.add(app_state)
    DependencyRegistry.add_all(app_state)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.app_state = app_state
        async with app_state.manage_lifecycle(app):
            yield

    return lifespan


AppStateDep = Annotated[AppState, Depends(get_dependency(AppState))]
AppConfigDep = Annotated[AppConfig, Depends(get_dependency(AppConfig))]


def not_production(app_state: AppStateDep) -> bool:
    if app_state.config.production:
        raise HTTPException(status_code=404, detail="Not found")
    return not app_state.config.production
