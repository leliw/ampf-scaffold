import logging

from ampf.base import KeyNotExistsException
from ampf.fastapi import get_static_file_response
from core.app_config import AppConfig
from dependencies import lifespan
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from log_config import setup_logging
from routers import config
from version import __version__

_log = logging.getLogger(__name__)

setup_logging()
app_config = AppConfig()  # pyright: ignore[reportCallIssue]
app = FastAPI(
    title="AMPF Scaffold",
    version=__version__,
    lifespan=lifespan(app_config),
    docs_url="/docs" if not app_config.production else None,
    redoc_url="/redoc" if not app_config.production else None,
    openapi_url="/openapi.json" if not app_config.production else None,
)


app.include_router(config.router, prefix="/api/config")


@app.get("/api/ping")
async def ping() -> None:
    """Keep container alive."""

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if not (full_path == "api" or full_path.startswith("api/")):
        return await get_static_file_response("static/browser", full_path)
    else:
        raise HTTPException(status_code=404, detail="Not found")

@app.exception_handler(KeyNotExistsException)
async def exception_not_found_callback(request: Request, exc: KeyNotExistsException):
    return JSONResponse({"detail": "Not found"}, status_code=404)
