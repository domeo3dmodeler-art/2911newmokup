#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/rollout.sh <image_tag>
# Example: ./scripts/rollout.sh v1.2.3

TAG="${1:-latest}"
NAMESPACE="prod"
DEPLOYMENT="app-prod"
IMAGE="cr.yandex/crpuein3jvjccnafs2vc/app:${TAG}"

echo "Setting image ${IMAGE} on deployment ${DEPLOYMENT} in ns ${NAMESPACE}..."
kubectl -n "${NAMESPACE}" set image deployment/"${DEPLOYMENT}" app="${IMAGE}"

echo "Waiting for rollout to complete..."
kubectl -n "${NAMESPACE}" rollout status deployment/"${DEPLOYMENT}" --timeout=3m

echo "Done."

