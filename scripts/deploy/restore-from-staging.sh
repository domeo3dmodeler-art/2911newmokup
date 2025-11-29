#!/bin/bash
# Скрипт для восстановления базы данных из staging volume

echo "🔄 Восстанавливаем базу данных из staging volume..."

# Делаем дамп из staging volume
echo "📤 Создаем дамп из staging..."
docker run --rm \
  -v domeo_staging_postgres_data:/var/lib/postgresql/backup \
  -v /opt/domeo:/output \
  postgres:15-alpine \
  sh -c "cd /var/lib/postgresql/backup && pg_dump -Fc -U postgres -d postgres > /output/staging_dump.dump 2>&1 || echo 'Error creating dump'"

# Или попробуем через pg_basebackup/копирование файлов
echo "📋 Проверяем структуру staging базы..."
docker run --rm \
  -v domeo_staging_postgres_data:/data \
  alpine sh -c "ls -la /data/base/ 2>&1 | head -10"

echo "✅ Готово"

