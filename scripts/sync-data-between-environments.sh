#!/bin/bash

# 🔄 Скрипт для синхронизации данных между средами
# Использование: ./sync-data-between-environments.sh [source] [target]
# Пример: ./sync-data-between-environments.sh production staging

set -e

SOURCE_ENV=${1:-"production"}
TARGET_ENV=${2:-"staging"}

echo "🔄 Синхронизация данных: $SOURCE_ENV → $TARGET_ENV"

# Настройки окружений
case $SOURCE_ENV in
    "production")
        SOURCE_HOST="130.193.40.35"
        SOURCE_PATH="/opt/domeo"
        SOURCE_KEY="production_key"
        SOURCE_PORT="3000"
        ;;
    "staging")
        SOURCE_HOST="130.193.40.35"
        SOURCE_PATH="/opt/domeo"
        SOURCE_KEY="staging_key"
        SOURCE_PORT="3001"
        ;;
    *)
        echo "❌ Неизвестная исходная среда: $SOURCE_ENV"
        echo "Доступные среды: production, staging"
        exit 1
        ;;
esac

case $TARGET_ENV in
    "production")
        TARGET_HOST="130.193.40.35"
        TARGET_PATH="/opt/domeo"
        TARGET_KEY="production_key"
        TARGET_PORT="3000"
        ;;
    "staging")
        TARGET_HOST="130.193.40.35"
        TARGET_PATH="/opt/domeo"
        TARGET_KEY="staging_key"
        TARGET_PORT="3001"
        ;;
    *)
        echo "❌ Неизвестная целевая среда: $TARGET_ENV"
        echo "Доступные среды: production, staging"
        exit 1
        ;;
esac

# Проверяем SSH ключи
if [ ! -f "$SOURCE_KEY" ]; then
    echo "❌ SSH ключ $SOURCE_KEY не найден"
    exit 1
fi

if [ ! -f "$TARGET_KEY" ]; then
    echo "❌ SSH ключ $TARGET_KEY не найден"
    exit 1
fi

# Проверяем подключение к исходной среде
echo "🔍 Проверяем подключение к $SOURCE_ENV..."
if ! ssh -i "$SOURCE_KEY" -o ConnectTimeout=10 ubuntu@$SOURCE_HOST "echo 'Connection OK'"; then
    echo "❌ Не удается подключиться к $SOURCE_ENV серверу"
    exit 1
fi

# Проверяем подключение к целевой среде
echo "🔍 Проверяем подключение к $TARGET_ENV..."
if ! ssh -i "$TARGET_KEY" -o ConnectTimeout=10 ubuntu@$TARGET_HOST "echo 'Connection OK'"; then
    echo "❌ Не удается подключиться к $TARGET_ENV серверу"
    exit 1
fi

echo "✅ Подключения успешны"

# Создаем бэкап целевой среды
echo "💾 Создаем бэкап $TARGET_ENV..."
ssh -i "$TARGET_KEY" ubuntu@$TARGET_HOST << EOF
cd $TARGET_PATH
if [ -f "prisma/database/dev.db" ]; then
    cp prisma/database/dev.db prisma/database/dev.db.backup-$(date +%Y%m%d_%H%M%S)
    echo "Бэкап создан"
fi
EOF

# Копируем базу данных
echo "📦 Копируем базу данных..."
ssh -i "$SOURCE_KEY" ubuntu@$SOURCE_HOST "cd $SOURCE_PATH && tar -czf /tmp/db-backup.tar.gz prisma/database/dev.db"

scp -i "$SOURCE_KEY" ubuntu@$SOURCE_HOST:/tmp/db-backup.tar.gz ./db-backup.tar.gz
scp -i "$TARGET_KEY" ./db-backup.tar.gz ubuntu@$TARGET_HOST:/tmp/

ssh -i "$TARGET_KEY" ubuntu@$TARGET_HOST << EOF
cd $TARGET_PATH
tar -xzf /tmp/db-backup.tar.gz
rm /tmp/db-backup.tar.gz
echo "База данных обновлена"
EOF

# Копируем загруженные файлы
echo "📁 Копируем загруженные файлы..."
ssh -i "$SOURCE_KEY" ubuntu@$SOURCE_HOST "cd $SOURCE_PATH && tar -czf /tmp/uploads-backup.tar.gz public/uploads/"

scp -i "$SOURCE_KEY" ubuntu@$SOURCE_HOST:/tmp/uploads-backup.tar.gz ./uploads-backup.tar.gz
scp -i "$TARGET_KEY" ./uploads-backup.tar.gz ubuntu@$TARGET_HOST:/tmp/

ssh -i "$TARGET_KEY" ubuntu@$TARGET_HOST << EOF
cd $TARGET_PATH
tar -xzf /tmp/uploads-backup.tar.gz
rm /tmp/uploads-backup.tar.gz
echo "Файлы обновлены"
EOF

# Перезапускаем приложение на целевой среде
echo "🔄 Перезапускаем приложение на $TARGET_ENV..."
ssh -i "$TARGET_KEY" ubuntu@$TARGET_HOST << EOF
cd $TARGET_PATH
# Останавливаем текущий процесс
pkill -f "next start" || true
sleep 2
# Запускаем на правильном порту
if [ "$TARGET_ENV" = "staging" ]; then
    npx next start -p 3001 &
else
    npx next start -p 3000 &
fi
EOF

# Проверяем health check
echo "🔍 Проверяем health check $TARGET_ENV..."
sleep 10
if curl -f http://$TARGET_HOST:$TARGET_PORT/api/health; then
    echo "✅ Синхронизация завершена успешно!"
    echo "🌐 $TARGET_ENV доступен: http://$TARGET_HOST:$TARGET_PORT"
else
    echo "❌ Health check не прошел, проверьте логи"
    exit 1
fi

# Очищаем временные файлы
rm -f db-backup.tar.gz uploads-backup.tar.gz

echo "🎉 Синхронизация данных завершена!"
