Deploy guide: test → prod (Yandex Cloud MK8S)

This repo contains manifests and scripts to build, push, and deploy the app to prod without auto DB migrations.

Prerequisites
- kubeconfig with minimal access to namespace `prod`, or CI with kubectl
- Docker auth to `cr.yandex/crpuein3jvjccnafs2vc`
- kubectl (with kustomize), optional: Helm for ingress/cert-manager

Confirm parameters
- Container port: default 8080; edit `k8s/base/deployment.yaml`
- Health: `/api/health`; edit probes if different
- Secrets: `DATABASE_URL`, `JWT_SECRET` in `app-secrets`
- Migration command: set in `scripts/run_db_migration.sh`

One-time setup
1) Secrets
  kubectl -n prod create secret generic app-secrets \
    --from-literal=DATABASE_URL="<db_url>" \
    --from-literal=JWT_SECRET="<jwt>" \
    --dry-run=client -o yaml | kubectl apply -f -
2) First apply
  kubectl apply -k k8s/overlays/prod
3) Check VIP
  kubectl -n prod get svc app-prod -w

Build and push
- Linux/macOS: ./scripts/build_and_push.sh app v1.0.0
- Windows: ./scripts/build_and_push.ps1 -ImageName app -Tag v1.0.0

Rollout
  ./scripts/rollout.sh v1.0.0
  kubectl -n prod rollout history deployment/app-prod

Rollback
  ./scripts/rollback.sh
  kubectl -n prod rollout undo deployment/app-prod --to-revision=<N>

Manual DB migrations (only after backup)
  # set MIGRATION_CMD in scripts/run_db_migration.sh
  ./scripts/run_db_migration.sh

Optional: Ingress + HTTPS
1) Ingress-nginx (Helm)
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
    -n ingress-nginx --create-namespace \
    --set controller.service.type=LoadBalancer
2) cert-manager (Helm)
  helm repo add jetstack https://charts.jetstack.io
  helm upgrade --install cert-manager jetstack/cert-manager \
    -n cert-manager --create-namespace --set installCRDs=true
3) ClusterIssuer
  kubectl apply -f k8s/cert-manager/cluster-issuer.yaml
4) Ingress (set domain in file, point DNS A to ingress IP)
  kubectl -n prod apply -f k8s/ingress/ingress.yaml

Notes
- Never auto-run DB migrations. Keep separate and manual.
- Do not commit secret values.

