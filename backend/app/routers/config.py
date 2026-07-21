from pydantic import BaseModel

from dependencies import AppConfigDep
from fastapi import APIRouter

router = APIRouter(tags=["Client config"])


class ConfigDto(BaseModel):
    version: str


@router.get("")
async def get_client_config(config: AppConfigDep) -> ConfigDto:
    return ConfigDto(**config.model_dump())
