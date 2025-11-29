#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/run_db_migration.sh <pod_name_optional>
# This script executes a manual DB migration command inside a running pod.
# Replace the MIGRATION_CMD with the correct command for your app (e.g., prisma migrate deploy, alembic upgrade head, etc.)

NAMESPACE="prod"
LABEL_SELECTOR="app.kubernetes.io/name=app"
POD_NAME="${1:-}"

# EDIT THIS to your app's migration command
MIGRATION_CMD="echo 'Please set MIGRATION_CMD to your migration tool' && false"

if [[ -z "${POD_NAME}" ]]; then
  POD_NAME=$(kubectl -n "${NAMESPACE}" get pods -l ${LABEL_SELECTOR} -o jsonpath='{.items[0].metadata.name}')
fi

echo "Executing migration in pod ${POD_NAME} (ns=${NAMESPACE})..."
kubectl -n "${NAMESPACE}" exec -it "${POD_NAME}" -- /bin/sh -lc "${MIGRATION_CMD}"

echo "Done."

