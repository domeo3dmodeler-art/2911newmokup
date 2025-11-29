#!/usr/bin/env bash
# Скрипт для настройки и запуска hot reload на ВМ
# Использование на ВМ: ./scripts/setup-hot-reload-vm.sh

set -euo pipefail

STAGING_PATH="/opt/domeo"
BRANCH="develop"

echo "🔥 Настройка Hot Reload на ВМ..."
echo ""

# Проверка директории
if [ ! -d "$STAGING_PATH" ]; then
    echo "❌ Директория $STAGING_PATH не найдена"
    echo "   Создайте директорию и клонируйте репозиторий:"
    echo "   mkdir -p $STAGING_PATH && cd $STAGING_PATH && git clone <repo-url> ."
    exit 1
fi

cd "$STAGING_PATH" || exit 1

# Проверка наличия docker-compose.staging-dev.yml
if [ ! -f "docker-compose.staging-dev.yml" ]; then
    echo "❌ Файл docker-compose.staging-dev.yml не найден!"
    echo "   Убедитесь, что файл скопирован на ВМ"
    exit 1
fi

# Обновление кода из Git
echo "📥 Обновление кода из Git..."
git fetch origin "$BRANCH"
git pull origin "$BRANCH" || {
    echo "⚠️  Ошибка при обновлении кода, продолжаем..."
}

# Остановка старых контейнеров (если запущены)
echo ""
echo "🛑 Остановка старых контейнеров..."
docker compose -f docker-compose.staging-dev.yml down 2>/dev/null || true

# Запуск контейнеров с hot reload
echo ""
echo "🚀 Запуск контейнеров с Hot Reload..."
docker compose -f docker-compose.staging-dev.yml up -d

# Ожидание запуска
echo ""
echo "⏳ Ожидание запуска контейнеров..."
sleep 5

# Проверка статуса
echo ""
echo "📊 Статус контейнеров:"
docker compose -f docker-compose.staging-dev.yml ps

# Проверка health
echo ""
echo "🔍 Проверка health endpoint..."
sleep 3
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Приложение работает!"
    echo "🌐 URL: http://$(hostname -I | awk '{print $1}'):3001"
else
    echo "⚠️  Health check не прошел, проверьте логи:"
    echo "   docker logs -f domeo-staging-app"
fi

echo ""
echo "========================================"
echo "✅ Hot Reload настроен!"
echo "========================================"
echo ""
echo "📝 Полезные команды:"
echo "   docker logs -f domeo-staging-app     - просмотр логов"
echo "   docker compose -f docker-compose.staging-dev.yml restart staging-app  - перезапуск"
echo "   docker compose -f docker-compose.staging-dev.yml down  - остановка"
echo ""
echo "🔄 Для применения изменений:"
echo "   1. git pull origin develop"
echo "   2. docker compose -f docker-compose.staging-dev.yml restart staging-app"
echo "   Или используйте скрипт: ./scripts/update-staging.sh"
echo ""
