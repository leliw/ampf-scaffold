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
PYTHONPATH="app" uv run --env-file .env uvicorn app.main:app --reload --port=$API_PORT &
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
