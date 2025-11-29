#!/bin/bash
# Скрипт для экспорта данных с тестовой ВМ

STAGING_HOST="130.193.40.35"
STAGING_USER="ubuntu"
STAGING_DB_PATH="/opt/domeo"

echo "========================================"
echo "ЭКСПОРТ ДАННЫХ С ТЕСТОВОЙ ВМ"
echo "========================================"
echo ""

# Проверка SSH подключения
echo "Проверка SSH подключения..."
ssh -o ConnectTimeout=5 -o BatchMode=yes ${STAGING_USER}@${STAGING_HOST} "echo OK" 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Ошибка SSH подключения"
    exit 1
fi

echo "✅ SSH подключение установлено"
echo ""

# Экспорт данных через API или прямое подключение к БД
echo "Экспорт данных..."
echo ""
echo "Варианты:"
echo "1. Через API endpoints (если доступны)"
echo "2. Через прямое подключение к PostgreSQL"
echo "3. Через Prisma Studio на удаленной ВМ"
echo ""

# Создаем директорию для экспорта
mkdir -p export_data
echo "✅ Директория export_data создана"

echo ""
echo "Для экспорта данных выполните:"
echo "  - Подключитесь к тестовой ВМ: ssh ${STAGING_USER}@${STAGING_HOST}"
echo "  - Или используйте API: http://${STAGING_HOST}:3001/api/..."

