#!/bin/bash
DOCKER_REGISTRY="europe-west3-docker.pkg.dev/development-428212/docker-eu"
IMAGE_NAME=ampf-scaffold

ENVIRONMENT=${1:-dev}

INFRA_DIR=$(cd -- "$(dirname -- "$0")" &> /dev/null && pwd)
PROJECT_ROOT=$(cd -- "$INFRA_DIR/.." &> /dev/null && pwd)
ENV_DIR="$INFRA_DIR/env/$ENVIRONMENT"
BACKEND_DIR="$PROJECT_ROOT/backend"
set -euo pipefail

# ===================== ENVIRONMENT CONFIGURATION =====================
case $ENVIRONMENT in
  dev|it|int)
    IMAGE_TAG=""
    ;;
  local|lcl)
    IMAGE_TAG=${2:-$(git rev-parse --short HEAD)}
    ;;
  prod)
    IMAGE_TAG=$(uv run --directory="$BACKEND_DIR" app/version.py)
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# Check if IMAGE_TAG is not empty before Docker operations
if [ -n "$IMAGE_TAG" ]; then
    FULL_IMAGE_LATEST="$DOCKER_REGISTRY/$IMAGE_NAME:latest"
    FULL_IMAGE_TAG="$DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"

    echo "Checking if image $FULL_IMAGE_TAG exists..."

    # Check if image exists in Artifact Registry
    if gcloud artifacts docker images describe "$FULL_IMAGE_TAG" > /dev/null 2>&1; then
        echo "✅ Image $FULL_IMAGE_TAG already exists — skipping build."
    else
        echo "❌ Image does not exist — starting build..."
        docker build \
            --tag "$FULL_IMAGE_LATEST" \
            --tag "$FULL_IMAGE_TAG" \
            "$PROJECT_ROOT"
        docker push "$FULL_IMAGE_LATEST"
        docker push "$FULL_IMAGE_TAG"
        echo "✅ Built and pushed new image."
    fi
else
    echo " ℹ️ Skipping Docker operations."
fi

terraform init \
    -backend-config="${ENV_DIR}/backend.hcl" \
    -reconfigure
terraform apply \
    -var="environment=${ENVIRONMENT}" \
    -var="image_tag=${IMAGE_TAG}" \
    -var-file="${ENV_DIR}/terraform.tfvars"

case "$ENVIRONMENT" in
  local|lcl|it|int|dev)
    mkdir -p "${ENV_DIR}"
    terraform output --raw env_file > "${ENV_DIR}/.env.app"
    terraform output --raw service_account_key > "${ENV_DIR}/.gcp_credentials.json"
    ;;
esac
