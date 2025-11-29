#!/bin/bash

# 🚀 Деплой в Kubernetes Production
# Использует переменные окружения для доступа

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
CLUSTER_ID="${CLUSTER_ID:-cat9eenl393qj44riti4}"
NAMESPACE="${NAMESPACE:-prod}"
REGISTRY="${REGISTRY:-cr.yandex/crpuein3jvjccnafs2vc}"
IMAGE_NAME="${IMAGE_NAME:-app}"

# Проверка переменных окружения
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

# Проверка наличия YC CLI
if ! command -v yc &> /dev/null; then
    log "Устанавливаем YC CLI..."
    curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
    export PATH="$HOME/yandex-cloud/bin:$PATH"
fi

# Проверка наличия kubectl
if ! command -v kubectl &> /dev/null; then
    error "kubectl не установлен. Установите: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Проверка наличия docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен. Установите: https://docs.docker.com/get-docker/"
    exit 1
fi

# Получаем тег образа
if [ -z "$1" ]; then
    # Генерируем тег на основе даты/времени
    TAG="v$(date +%Y%m%d%H%M%S)"
    warning "Тег не указан, используем: $TAG"
else
    TAG="$1"
fi

FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

log "🚀 Начинаем деплой в Kubernetes Production"
log "  Кластер: $CLUSTER_ID"
log "  Namespace: $NAMESPACE"
log "  Образ: $FULL_IMAGE"

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

# Авторизация в Container Registry для Docker
log "🐳 Авторизуемся в Container Registry..."
yc iam create-token | docker login cr.yandex -u iam --password-stdin
success "✅ Авторизация в Container Registry успешна"

# Сборка образа
log "🔨 Собираем Docker образ..."
docker build -t "$FULL_IMAGE" .
success "✅ Образ собран"

# Пуш образа
log "📤 Отправляем образ в registry..."
docker push "$FULL_IMAGE"
success "✅ Образ отправлен: $FULL_IMAGE"

# Получение kubeconfig
log "📋 Получаем kubeconfig для кластера..."
yc managed-kubernetes cluster get-credentials --id "$CLUSTER_ID" --external --force
kubectl config use-context yc-domeo-prod 2>/dev/null || kubectl config use-context yc-default 2>/dev/null || true
kubectl config set-context --current --namespace="$NAMESPACE"

# Проверка подключения
if ! kubectl -n "$NAMESPACE" get nodes > /dev/null 2>&1; then
    error "Не удается подключиться к кластеру"
    exit 1
fi
success "✅ Подключение к кластеру установлено"

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
    kubectl -n "$NAMESPACE" describe deployment/app | grep -A 10 "Events:"
    exit 1
fi

# Проверка статуса
log "📊 Проверяем статус deployment..."
kubectl -n "$NAMESPACE" get deploy app
kubectl -n "$NAMESPACE" get pods -l app=app

success "🎉 Деплой завершен успешно!"
log "  Образ: $FULL_IMAGE"
log "  URL: http://158.160.202.117/"
log "  Health: http://158.160.202.117/api/health"

