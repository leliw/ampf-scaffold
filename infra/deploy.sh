#!/bin/bash
DOCKER_REGISTRY="europe-west3-docker.pkg.dev/development-428212/docker-eu"
IMAGE_NAME=ampf-scaffold

ENVIRONMENT=${1:-dev}

INFRA_DIR=$(cd -- "$(dirname -- "$0")" &> /dev/null && pwd)
PROJECT_ROOT=$(cd -- "$INFRA_DIR/.." &> /dev/null && pwd)
ENV_DIR="$INFRA_DIR/env/$ENVIRONMENT"
BACKEND_DIR="$PROJECT_ROOT/backend"
set -euo pipefail

# ===================== KONFIGURACJA ŚRODOWISK =====================
case $ENVIRONMENT in
  dev|it)
    IMAGE_TAG=""
    ;;
  local)
    IMAGE_TAG=${2:-$(git rev-parse --short HEAD)}
    ;;
  prod)
    IMAGE_TAG=$(uv run --directory="$BACKEND_DIR" app/version.py)
    ;;
  *)
    echo "Nieznane środowisko: $ENVIRONMENT"
    exit 1
    ;;
esac

# Sprawdzamy, czy IMAGE_TAG nie jest pusty przed operacjami na obrazach
if [ -n "$IMAGE_TAG" ]; then
    FULL_IMAGE_LATEST="$DOCKER_REGISTRY/$IMAGE_NAME:latest"
    FULL_IMAGE_TAG="$DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"

    echo "Sprawdzam czy obraz $FULL_IMAGE_TAG istnieje..."

    # Sprawdzenie istnienia obrazu w Artifact Registry
    if gcloud artifacts docker images describe $FULL_IMAGE_TAG > /dev/null 2>&1; then
        echo "✅ Obraz $FULL_IMAGE_TAG już istnieje — pomijam build."
    else
        echo "❌ Obraz nie istnieje — rozpoczynam build..."
        docker build \
            --tag $FULL_IMAGE_LATEST \
            --tag $FULL_IMAGE_TAG \
            "$PROJECT_ROOT"
        docker push $FULL_IMAGE_LATEST
        docker push $FULL_IMAGE_TAG
        echo "✅ Zbudowano i wypchnięto nowy obraz."
    fi
else
    echo " ℹ️ Pomijam operacje Dockerowe."
fi
terraform init \
    -backend-config="${ENV_DIR}/backend.hcl" \
    -reconfigure
terraform apply \
    -var="environment=${ENVIRONMENT}" \
    -var="image_tag=${IMAGE_TAG}" \
    -var-file="${ENV_DIR}/terraform.tfvars"

if [ "$ENVIRONMENT" = "local" ] || [ "$ENVIRONMENT" = "it" ] || [ "$ENVIRONMENT" = "dev" ]; then
  mkdir -p ${ENV_DIR}
  terraform output --raw env_file > "${ENV_DIR}/.env.app"
  terraform output --raw service_account_key > "${ENV_DIR}/.gcp_credentials.json"
fi
