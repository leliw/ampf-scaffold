#!/bin/bash

export IMAGE_NAME="ampf-scaffolder"
export IMAGE_VERSION=$(uv run --no-sync --directory=./backend app/version.py)
export DOCKER_REGISTRY="europe-west3-docker.pkg.dev/development-428212/docker-eu"


docker build \
--tag $DOCKER_REGISTRY/$IMAGE_NAME:latest .
# --progress=plain \

echo "Pushing ..."

docker push $DOCKER_REGISTRY/$IMAGE_NAME:latest
docker tag $DOCKER_REGISTRY/$IMAGE_NAME:latest $DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_VERSION
docker push $DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_VERSION
