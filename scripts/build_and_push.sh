#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/build_and_push.sh <image_name> <tag>
# Example: ./scripts/build_and_push.sh app v1.2.3

REGISTRY="cr.yandex/crpuein3jvjccnafs2vc"
IMAGE_NAME="${1:-app}"
TAG="${2:-latest}"

FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "Building ${FULL_IMAGE}..."
docker build -t "${FULL_IMAGE}" .

echo "Pushing ${FULL_IMAGE}..."
docker push "${FULL_IMAGE}"

echo "Done."

