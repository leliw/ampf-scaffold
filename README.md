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
