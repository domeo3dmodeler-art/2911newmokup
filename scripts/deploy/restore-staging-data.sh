#!/bin/bash
# Восстановление данных из staging volume в текущую базу

echo "🔄 Восстанавливаем данные из staging volume..."

# Проверяем текущие контейнеры
echo "📋 Проверяем контейнеры..."
docker ps | grep postgres

# Запускаем временный контейнер для чтения staging данных
echo "📦 Запускаем временный PostgreSQL для чтения staging volume..."
docker run -d --name staging-db-temp \
  -v domeo_staging_postgres_data:/var/lib/postgresql/data \
  -e POSTGRES_DB=domeo_staging \
  -e POSTGRES_USER=staging_user \
  -e POSTGRES_PASSWORD=staging_password \
  postgres:15-alpine

# Ждем запуска
sleep 10

# Проверяем доступность
echo "🔍 Проверяем базы данных в staging..."
docker exec staging-db-temp psql -U staging_user -d domeo_staging -c "\l" || echo "Ошибка подключения"

# Делаем дамп всех данных
echo "📤 Создаем дамп из staging..."
docker exec staging-db-temp pg_dump -U staging_user -d domeo_staging > /tmp/staging_dump.sql 2>&1

# Останавливаем временный контейнер
docker stop staging-db-temp
docker rm staging-db-temp

echo "✅ Дамп создан в /tmp/staging_dump.sql"

