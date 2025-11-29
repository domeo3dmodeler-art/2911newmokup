#!/bin/bash

# 🚀 Полная миграция данных на Kubernetes Production
# Переносит базу данных и фотографии с тестовой ВМ в K8s кластер

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Конфигурация (см. DEPLOY_SETUP_GUIDE.md для подробностей)
STAGING_HOST="${STAGING_HOST:-130.193.40.35}"
STAGING_USER="${STAGING_USER:-ubuntu}"
STAGING_SSH_KEY="${STAGING_SSH_KEY:-C:\\Users\\petr2\\.ssh\\ssh-key-1757583003347\\ssh-key-1757583003347}"
STAGING_PATH="/opt/domeo"

# Kubernetes конфигурация из DEPLOY_SETUP_GUIDE.md
CLUSTER_ID="${CLUSTER_ID:-cat9eenl393qj44riti4}"
NAMESPACE="${NAMESPACE:-prod}"
REGISTRY="${REGISTRY:-cr.yandex/crpuein3jvjccnafs2vc}"
IMAGE_NAME="${IMAGE_NAME:-app}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/domeo-k8s-migration-${TIMESTAMP}"

log "🚀 Начинаем миграцию данных на Kubernetes Production"
log "  Тестовая ВМ: ${STAGING_HOST}"
log "  Kubernetes кластер: ${CLUSTER_ID}"
log "  Namespace: ${NAMESPACE}"

# Проверка переменных окружения YC
# Инструкции по настройке см. в DEPLOY_SETUP_GUIDE.md
if [ -z "$YC_SERVICE_ACCOUNT_KEY_FILE" ] && [ -z "$YC_SA_KEY" ] && [ -z "$YC_SA_JSON" ]; then
    error "Не указан ключ сервисного аккаунта Yandex Cloud"
    echo ""
    echo "📖 Инструкции по настройке см. в DEPLOY_SETUP_GUIDE.md"
    echo ""
    echo "Установите одну из переменных:"
    echo "  export YC_SERVICE_ACCOUNT_KEY_FILE=/path/to/sa-key.json"
    echo "  export YC_SA_KEY='<JSON content>'"
    echo "  export YC_SA_JSON='<JSON content>'"
    exit 1
fi

# Проверка инструментов
if ! command -v yc &> /dev/null; then
    error "YC CLI не установлен. См. DEPLOY_SETUP_GUIDE.md раздел 2.1"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    error "kubectl не установлен. См. DEPLOY_SETUP_GUIDE.md раздел 2.2"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    error "Docker не установлен. См. DEPLOY_SETUP_GUIDE.md раздел 2.3"
    exit 1
fi

# Создаем временный файл для JSON ключа, если нужно
if [ -z "$YC_SERVICE_ACCOUNT_KEY_FILE" ]; then
    TEMP_KEY_FILE=$(mktemp)
    if [ -n "$YC_SA_KEY" ]; then
        echo "$YC_SA_KEY" > "$TEMP_KEY_FILE"
    elif [ -n "$YC_SA_JSON" ]; then
        echo "$YC_SA_JSON" > "$TEMP_KEY_FILE"
    fi
    export YC_SERVICE_ACCOUNT_KEY_FILE="$TEMP_KEY_FILE"
    trap "rm -f $TEMP_KEY_FILE" EXIT
fi

# Авторизация в YC
log "🔐 Авторизуемся в Yandex Cloud..."
if [ -n "$YC_CLOUD_ID" ]; then
    yc config set cloud-id "$YC_CLOUD_ID"
fi
if [ -n "$YC_FOLDER_ID" ]; then
    yc config set folder-id "$YC_FOLDER_ID"
fi

if ! yc iam create-token > /dev/null 2>&1; then
    error "Ошибка авторизации в Yandex Cloud. Проверьте YC_SERVICE_ACCOUNT_KEY_FILE"
    exit 1
fi
success "✅ Авторизация в YC успешна"

# Создание бэкапов на тестовой ВМ
log "📦 Создаем бэкапы на тестовой ВМ..."
ssh -i "$STAGING_SSH_KEY" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" << EOF
cd ${STAGING_PATH}
mkdir -p ${BACKUP_DIR}

# Бэкап базы данных
docker compose -f docker-compose.staging.yml exec -T staging-postgres pg_dump -U staging_user domeo_staging > ${BACKUP_DIR}/database_backup.sql

# Бэкап фотографий
docker run --rm \\
    -v domeo_staging_uploads:/source:ro \\
    -v ${BACKUP_DIR}:/backup \\
    alpine tar czf /backup/uploads_backup.tar.gz -C /source .

echo "✅ Бэкапы созданы"
du -h ${BACKUP_DIR}/*
EOF

# Скачиваем бэкапы локально
log "📥 Скачиваем бэкапы на локальную машину..."
mkdir -p ./backup
scp -i "$STAGING_SSH_KEY" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST:${BACKUP_DIR}/database_backup.sql" ./backup/database_backup_k8s.sql
scp -i "$STAGING_SSH_KEY" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST:${BACKUP_DIR}/uploads_backup.tar.gz" ./backup/uploads_backup_k8s.tar.gz

success "✅ Бэкапы скачаны локально"

# Подключение к Kubernetes кластеру
log "📋 Подключаемся к Kubernetes кластеру..."
yc managed-kubernetes cluster get-credentials --id "$CLUSTER_ID" --external --force
kubectl config use-context yc-domeo-prod 2>/dev/null || kubectl config use-context yc-default 2>/dev/null || true
kubectl config set-context --current --namespace="$NAMESPACE"

# Проверка подключения
if ! kubectl -n "$NAMESPACE" get nodes > /dev/null 2>&1; then
    error "Не удается подключиться к кластеру"
    exit 1
fi
success "✅ Подключение к кластеру установлено"

# Восстановление базы данных в K8s
log "🔄 Восстанавливаем базу данных в Kubernetes..."
kubectl -n "$NAMESPACE" cp ./backup/database_backup_k8s.sql postgres-0:/tmp/database_backup.sql

# Очистка БД
kubectl -n "$NAMESPACE" exec -i postgres-0 -- sh -lc "export PGPASSWORD=staging_password; psql -U staging_user -d domeo_staging -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'"

# Восстановление БД
kubectl -n "$NAMESPACE" exec -i postgres-0 -- sh -lc "export PGPASSWORD=staging_password; psql -U staging_user -d domeo_staging < /tmp/database_backup.sql"

# Проверка восстановления
DB_COUNT=$(kubectl -n "$NAMESPACE" exec -i postgres-0 -- sh -lc "export PGPASSWORD=staging_password; psql -U staging_user -d domeo_staging -t -c 'SELECT count(*) FROM products;'")
success "✅ База данных восстановлена (товаров: ${DB_COUNT// /})"

# Восстановление фотографий в K8s
log "🖼️  Восстанавливаем фотографии в Kubernetes PVC..."
APP_POD=$(kubectl -n "$NAMESPACE" get pods -l app=app -o jsonpath='{.items[0].metadata.name}')

if [ -z "$APP_POD" ]; then
    error "Не найден под приложения. Сначала запустите deployment."
    exit 1
fi

# Копируем архив в под
kubectl -n "$NAMESPACE" cp ./backup/uploads_backup_k8s.tar.gz "$APP_POD:/tmp/uploads_backup.tar.gz"

# Восстанавливаем фотографии
kubectl -n "$NAMESPACE" exec -i "$APP_POD" -- sh -lc "cd /app/public/uploads && rm -rf * && tar xzf /tmp/uploads_backup.tar.gz && echo 'Photos restored' && du -sh ."

PHOTOS_COUNT=$(kubectl -n "$NAMESPACE" exec -i "$APP_POD" -- sh -lc "find /app/public/uploads -type f | wc -l")
success "✅ Фотографии восстановлены (файлов: ${PHOTOS_COUNT// /})"

# Авторизация в Container Registry
log "🐳 Авторизуемся в Container Registry..."
yc iam create-token | docker login cr.yandex -u iam --password-stdin
success "✅ Авторизация в Container Registry успешна"

# Получаем тег образа
if [ -z "$1" ]; then
    TAG="v$(date +%Y%m%d%H%M%S)"
    warning "Тег не указан, используем: $TAG"
else
    TAG="$1"
fi

FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

# Сборка образа
log "🔨 Собираем Docker образ..."
docker build -t "$FULL_IMAGE" .
success "✅ Образ собран"

# Пуш образа
log "📤 Отправляем образ в registry..."
docker push "$FULL_IMAGE"
success "✅ Образ отправлен: $FULL_IMAGE"

# Обновление deployment
log "🔄 Обновляем deployment с новым образом..."
kubectl -n "$NAMESPACE" set image deployment/app app="$FULL_IMAGE"

log "⏳ Ждем завершения rollout..."
if kubectl -n "$NAMESPACE" rollout status deployment/app --timeout=180s; then
    success "✅ Rollout завершен успешно"
else
    error "❌ Rollout завершился с ошибкой"
    log "Проверяем статус:"
    kubectl -n "$NAMESPACE" get pods -l app=app
    kubectl -n "$NAMESPACE" describe deployment/app | grep -A 10 "Events:" || true
    exit 1
fi

# Проверка статуса
log "📊 Проверяем статус deployment..."
kubectl -n "$NAMESPACE" get deploy app
kubectl -n "$NAMESPACE" get pods -l app=app

# Очистка
log "🧹 Очищаем временные файлы..."
ssh -i "$STAGING_SSH_KEY" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" "rm -rf ${BACKUP_DIR}"
rm -f ./backup/database_backup_k8s.sql ./backup/uploads_backup_k8s.tar.gz

success "🎉 Миграция завершена успешно!"
log "  Образ: $FULL_IMAGE"
log "  URL: http://158.160.202.117/"
log "  Health: http://158.160.202.117/api/health"
log "  Товаров в БД: ${DB_COUNT// /}"
log "  Фотографий: ${PHOTOS_COUNT// /}"

