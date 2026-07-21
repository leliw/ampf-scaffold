# ------ Stage 1: Angular project ------
    FROM node:lts-trixie-slim AS angular-build
    WORKDIR /app
   
    COPY frontend/package.json frontend/package-lock.json ./
    RUN npm install --legacy-peer-deps
   
    COPY frontend/ .
    RUN npm run build
   
# ------ Stage 2: Python/FastAPI project ------
    FROM python:3.13.11-slim-trixie
    COPY --from=ghcr.io/astral-sh/uv:0.9.5-python3.13-trixie-slim /usr/local/bin/uv /bin/

    # Creates a non-root user with an explicit UID and adds permission to access the /app folder
    RUN mkdir /app
    RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app

    # Enable bytecode compilation
    ENV UV_COMPILE_BYTECODE=1
    # Keeps Python from generating .pyc files in the container
    ENV PYTHONDONTWRITEBYTECODE=1
    # Turns off buffering for easier container logging
    ENV PYTHONUNBUFFERED=1

    # Copy from the cache instead of linking since it's a mounted volume
    ENV UV_LINK_MODE=copy

    WORKDIR /app

    COPY ./backend/pyproject.toml ./backend/uv.lock /app/

    # Install application dependencies.
    RUN --mount=type=cache,target=/root/.cache/uv \
        uv sync --no-install-project --no-dev

    # Copy the application into the container.
    COPY ./backend/app/ /app/
    # Copy Angular build to FastAPI static folder
    COPY --from=angular-build /app/dist/frontend /app/static

    # And compile the application.
    RUN --mount=type=cache,target=/root/.cache/uv \
        uv sync --frozen --no-dev

    # Place executables in the environment at the front of the path
    ENV PATH="/app/.venv/bin:$PATH"

    # Switch to non-root user.
    USER appuser

    # Run the application.
    EXPOSE 8080
    CMD [\
        "gunicorn", "main:app", \
        "--bind", "0.0.0.0:8080", \
        "--worker-class", "uvicorn.workers.UvicornWorker", \
        "--timeout", "300" \
        ]
