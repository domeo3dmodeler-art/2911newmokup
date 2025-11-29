#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/rollback.sh
# Rolls back the last failed/specified rollout

NAMESPACE="prod"
DEPLOYMENT="app-prod"

echo "Rolling back deployment ${DEPLOYMENT} in ns ${NAMESPACE}..."
kubectl -n "${NAMESPACE}" rollout undo deployment/"${DEPLOYMENT}"

echo "Waiting for rollout to complete..."
kubectl -n "${NAMESPACE}" rollout status deployment/"${DEPLOYMENT}" --timeout=3m

echo "Done."

