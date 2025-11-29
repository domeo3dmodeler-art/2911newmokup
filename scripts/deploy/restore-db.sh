#!/bin/bash
# Восстановление базы данных из staging volume

STAGING_VOLUME="domeo_staging_postgres_data"
PROD_CONTAINER="domeo-postgres-1"
DB_NAME="domeo"
DB_USER="domeo"

echo "🔄 Восстанавливаем базу из staging volume..."

# Запускаем временный контейнер со staging volume
echo "📦 Запускаем временный контейнер для чтения staging данных..."
docker run -d --name staging-reader \
  -v ${STAGING_VOLUME}:/var/lib/postgresql/staging_data \
  postgres:15-alpine \
  tail -f /dev/null

# Ждем запуска
sleep 2

# Пытаемся найти базу данных в staging volume
echo "🔍 Ищем базу данных в staging volume..."
docker exec staging-reader sh -c "ls -la /var/lib/postgresql/staging_data/base/ 2>&1" || echo "Не удалось прочитать staging volume"

# Останавливаем временный контейнер
docker stop staging-reader >/dev/null 2>&1
docker rm staging-reader >/dev/null 2>&1

echo "✅ Скрипт завершен"

ческая
