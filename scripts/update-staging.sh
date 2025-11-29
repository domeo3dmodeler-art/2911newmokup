#!/bin/bash
# Скрипт для быстрого обновления кода на staging ВМ через git pull
# Использование на ВМ: ./scripts/update-staging.sh

set -e

STAGING_PATH="/opt/domeo"
BRANCH="develop"

echo "🔄 Обновление кода на staging..."

cd "$STAGING_PATH" || {
    echo "❌ Директория $STAGING_PATH не найдена"
    exit 1
}

# Обновляем код
echo "📥 Получение изменений из GitHub..."
git fetch origin "$BRANCH"

echo "🔄 Применение изменений..."
git pull origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo "✅ Код обновлен"
    
    # Перезапускаем контейнер для применения изменений (hot reload)
    echo "🔄 Перезапуск контейнера для hot reload..."
    docker compose -f docker-compose.staging-dev.yml restart staging-app
    
    echo "✅ Готово! Изменения применены."
    echo "🌐 URL: http://$(hostname -I | awk '{print $1}'):3001"
else
    echo "❌ Ошибка при обновлении кода"
    exit 1
fi

