# Angular Material + FastAPI scaffold

## Create a project

### Git project

```bash
git init -b main ampf-scaffold
cd ampf-scaffold
git remote add origin https://github.com/leliw/ampf-scaffold.git
git pull origin main
```

### Python project

```bash
uv init --no-readme backend
cd backend
uv add fastapi uvicorn pydantic pydantic-settings
uv add --dev pytest pytest-asyncio httpx2 coverage pytest-cov python-dotenv
```

### Angular project

Upgrade to the latest Angular CLI version if needed:

```bash
npm install -g @angular/cli
```

Close terminal and open a new one, then run the following commands:

```bash
cd ..
ng new frontend --style=scss --routing=true --strict=true --ssr=false
cd frontend
ng add @angular/material
```

## Run & Dockerize the application

### Application FastAPI (backend)

Add the following lines to `backend/pyproject.toml`:

```toml
[tool.setuptools]
py-modules = ["app"]

[tool.pytest.ini_options]
pythonpath = [
  "app"
]

[[tool.uv.index]]
url = "https://europe-west3-python.pkg.dev/development-428212/pip/simple/"
```

```bash
cd backend
uv add ampf[fastapi]
mkdir app
mkdir app/core
mkdir app/features
mkdir app/routers
```

#### backend/app/version.py

```python
__version__ = "0.0.1"

if __name__ == "__main__":
    print(__version__)
```

#### backend/app/core/app_config.py

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from version import __version__


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(env_nested_delimiter="__")

    version: str = __version__
    production: bool = True
```

#### backend/app/routers/config.py

```python
from pydantic import BaseModel

from dependencies import AppConfigDep
from fastapi import APIRouter

router = APIRouter(tags=["Client config"])


class ConfigDto(BaseModel):
    version: str


@router.get("")
async def get_client_config(config: AppConfigDep) -> ConfigDto:
    return ConfigDto(**config.model_dump())
```

#### backend/app/app_state.py

```python
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
```

#### backend/app/dependencies.py

```python
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
```

#### backend/app/log_config.py

```python
import logging

from pydantic_settings import BaseSettings, SettingsConfigDict


class LogConfig(BaseSettings):
    """
    Pydantic settings model for logging configuration.
    Loads logging levels from environment variables prefixed with 'LOG_'.
    """

    model_config = SettingsConfigDict(env_prefix="LOG_")
    level: str = "INFO"
    """Root logging level (e.g., INFO, DEBUG)."""
    log_config: str = "DEBUG"
    """Logging level for this configuration module itself."""

    # Loggers
    dependencies: str = "INFO"
    core: str = "INFO"
    features: str = "INFO"
    routers: str = "INFO"


_log = logging.getLogger(__name__)


def setup_logging():
    """
    Sets up the application's logging configuration.

    It configures the root logger, attempts to use uvicorn's default formatter
    if available, and then sets logging levels for various modules based on
    the `LogConfig` settings.
    """
    # Get the root logger
    root_logger = logging.getLogger()
    # Get or create a StreamHandler for console output
    ch = root_logger.handlers[0] if len(root_logger.handlers) > 0 else logging.StreamHandler()
    try:
        # Attempt to set FastAPI-like formatter using uvicorn's DefaultFormatter
        import uvicorn.logging

        formatter = uvicorn.logging.DefaultFormatter("%(levelprefix)s %(name)s: %(message)s")
    except ImportError:
        # Fallback to a standard formatter if uvicorn is not available
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # Set the formatter for the handler
    ch.setFormatter(formatter)
    # Add the handler to the root logger if not already present
    if ch not in root_logger.handlers:
        root_logger.addHandler(ch)

    # Load logging configuration from settings
    log_config_settings = LogConfig()
    for k, v in log_config_settings.model_dump().items():
        # Convert double underscores in setting names to dots for logger names
        name = k.replace("__", ".") if k != "level" else None
        logging.getLogger(name).setLevel(v)
        _log.debug("Logging %s -> %s", name, v)

    _log.debug("Logging configured")
```

#### backend/app/main.py

```python
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
```

### Application Angular (frontend)

```bash
cd frontend
mkdir src/app/core
mkdir src/app/features
```

#### frontend/src/app/core/config.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

export interface Config {
    version: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private http = inject(HttpClient);
    private readonly url = '/api/config';

    private readonly _config = signal<Config | null>(null);

    public readonly config = this._config.asReadonly();

    public loadConfig(): Observable<Config> {
        return this.http.get<Config>(this.url).pipe(
            tap(config => this._config.set(config)),
            catchError(err => {
                console.error('Failed to load config', err);
                const fallbackConfig = { version: 'unknown' };
                this._config.set(fallbackConfig);
                return of(fallbackConfig);
            })
        );
    }

    public getConfigValue<K extends keyof Config>(key: K) {
        return computed(() => {
            const currentConfig = this._config();
            return currentConfig ? currentConfig[key] : null;
        });
    }
}
```

#### frontend/src/app/app.config.ts

```typescript
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { ConfigService } from './core/config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.loadConfig();
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ]
};
```

#### frontend/src/app/app.ts

```typescript
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from './core/config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
  public configService = inject(ConfigService);
}

```

#### frontend/src/app/app.html

```html
<router-outlet />
<span class="footer-version">v. {{ configService.config()?.version ?? 'unknown' }}</span>
```

#### frontend/src/app/app.scss

```scss
...
.footer-version {
    position: absolute;
    right: 1em;
    bottom: 0.6em;
    font-size: small;
    color: rgba(0, 0, 0, 0.54);
    z-index: 200;
    pointer-events: none;
}
```

### Running the application

#### run_dev.sh

```bash
#!/bin/sh

API_PORT=8000
PORT=4200

cleanup() {
  echo "Cleaning up background processes and temporary files..."
  if [ -n "$UVICORN_PID" ]; then
    kill "$UVICORN_PID" 2>/dev/null
  fi
  if [ -f "frontend/proxy-dev.conf.json" ]; then
    rm "frontend/proxy-dev.conf.json"
  fi
}

# Register cleanup to run on exit, interruption, or termination
trap cleanup EXIT INT TERM

# Start backend
cd backend
PYTHONPATH="app" uv run uvicorn app.main:app --reload --port=$API_PORT &
UVICORN_PID=$!
cd ..

# Create proxy configuration for frontend
cat <<EOF > frontend/proxy-dev.conf.json
{
  "/api": {
    "target": "http://localhost:$API_PORT",
    "secure": false
  }
}
EOF

# Start frontend
cd frontend
ng serve -o --proxy-config=proxy-dev.conf.json --host 0.0.0.0 --port=$PORT
```
