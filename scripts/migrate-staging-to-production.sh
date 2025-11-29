#!/bin/bash

# 🚀 Миграция данных с тестовой ВМ на рабочую
# Переносит базу данных и фотографии

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

# Конфигурация
STAGING_HOST=${STAGING_HOST:-"130.193.40.35"}
STAGING_USER=${STAGING_USER:-"ubuntu"}
STAGING_SSH_KEY=${STAGING_SSH_KEY:-"C:\\Users\\petr2\\.ssh\\ssh-key-1757583003347\\ssh-key-1757583003347"}
STAGING_PATH="/opt/domeo"

PROD_HOST=${PROD_HOST:-"130.193.40.35"}
PROD_USER=${PROD_USER:-"ubuntu"}
PROD_SSH_KEY=${PROD_SSH_KEY:-"C:\\Users\\petr2\\.ssh\\ssh-key-1757583003347\\ssh-key-1757583003347"}
PROD_PATH="/opt/domeo"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/domeo-migration-${TIMESTAMP}"

log "🚀 Начинаем миграцию данных с тестовой ВМ на рабочую"
log "  Тестовая ВМ: ${STAGING_HOST}"
log "  Рабочая ВМ: ${PROD_HOST}"

# Проверка SSH ключей
if [[ ! -f "$STAGING_SSH_KEY" ]]; then
    error "SSH ключ для тестовой ВМ не найден: $STAGING_SSH_KEY"
    exit 1
fi

if [[ ! -f "$PROD_SSH_KEY" ]]; then
    error "SSH ключ для рабочей ВМ не найден: $PROD_SSH_KEY"
    exit 1
fi

# Проверка подключения к тестовой ВМ
log "🔍 Проверяем подключение к тестовой ВМ..."
if ! ssh -i "$STAGING_SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" "echo 'Connection OK'"; then
    error "Не удается подключиться к тестовой ВМ"
    exit 1
fi
success "✅ Подключение к тестовой ВМ установлено"

# Проверка подключения к рабочей ВМ
log "🔍 Проверяем подключение к рабочей ВМ..."
if ! ssh -i "$PROD_SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" "echo 'Connection OK'"; then
    error "Не удается подключиться к рабочей ВМ"
    exit 1
fi
success "✅ Подключение к рабочей ВМ установлено"

# Создание бэкапа базы данных на тестовой ВМ
log "📦 Создаем бэкап базы данных на тестовой ВМ..."
ssh -i "$STAGING_SSH_KEY" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" << EOF
cd ${STAGING_PATH}
mkdir -p ${BACKUP_DIR}

# Бэкап базы данных
docker compose -f docker-compose.staging.yml exec -T staging-postgres pg_dump -U staging_user domeo_staging > ${BACKUP_DIR}/database_backup.sql

# Проверяем размер бэкапа
if [ -s ${BACKUP_DIR}/database_backup.sql ]; then
    echo "✅ Бэкап базы данных создан: \$(du -h ${BACKUP_DIR}/database_backup.sql | cut -f1)"
else
    echo "❌ Ошибка: бэкап базы данных пустой"
    exit 1
fi
EOF

if [ $? -eq 0 ]; then
    success "✅ Бэкап базы данных создан"
else
    error "❌ Ошибка создания бэкапа базы данных"
    exit 1
fi

# Создание бэкапа фотографий на тестовой ВМ
log "📸 Создаем бэкап фотографий на тестовой ВМ..."
ssh -i "$STAGING_SSH_KEY" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" << EOF
cd ${STAGING_PATH}

# Создаем архив фотографий из volume
docker run --rm \\
    -v domeo_staging_uploads:/source:ro \\
    -v ${BACKUP_DIR}:/backup \\
    alpine tar czf /backup/uploads_backup.tar.gz -C /source .

# Проверяем размер архива
if [ -s ${BACKUP_DIR}/uploads_backup.tar.gz ]; then
    echo "✅ Бэкап фотографий создан: \$(du -h ${BACKUP_DIR}/uploads_backup.tar.gz | cut -f1)"
else
    echo "❌ Ошибка: бэкап фотографий пустой"
    exit 1
fi
EOF

if [ $? -eq 0 ]; then
    success "✅ Бэкап фотографий создан"
else
    error "❌ Ошибка создания бэкапа фотографий"
    exit 1
fi

# Копирование бэкапов на рабочую ВМ
log "📤 Копируем бэкапы на рабочую ВМ..."
ssh -i "$STAGING_SSH_KEY" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" << EOF
cd ${STAGING_PATH}
scp -i ${PROD_SSH_KEY} -o StrictHostKeyChecking=no ${BACKUP_DIR}/database_backup.sql ${PROD_USER}@${PROD_HOST}:${BACKUP_DIR}/
scp -i ${PROD_SSH_KEY} -o StrictHostKeyChecking=no ${BACKUP_DIR}/uploads_backup.tar.gz ${PROD_USER}@${PROD_HOST}:${BACKUP_DIR}/
EOF

if [ $? -eq 0 ]; then
    success "✅ Бэкапы скопированы на рабочую ВМ"
else
    error "❌ Ошибка копирования бэкапов"
    exit 1
fi

# Остановка сервисов на рабочей ВМ
log "⏸️  Останавливаем сервисы на рабочей ВМ..."
ssh -i "$PROD_SSH_KEY" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
cd ${PROD_PATH}
docker compose -f docker-compose.production-full.yml down || true
EOF

success "✅ Сервисы остановлены"

# Восстановление базы данных на рабочей ВМ
log "🔄 Восстанавливаем базу данных на рабочей ВМ..."
ssh -i "$PROD_SSH_KEY" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
cd ${PROD_PATH}
mkdir -p ${BACKUP_DIR}

# Запускаем PostgreSQL для восстановления
docker compose -f docker-compose.production-full.yml up -d postgres

# Ждем готовности PostgreSQL
sleep 10

# Очищаем базу данных перед восстановлением
docker compose -f docker-compose.production-full.yml exec -T postgres psql -U domeo -d domeo -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Восстанавливаем базу данных
docker compose -f docker-compose.production-full.yml exec -T postgres psql -U domeo -d domeo < ${BACKUP_DIR}/database_backup.sql

echo "✅ База данных восстановлена"
EOF

if [ $? -eq 0 ]; then
    success "✅ База данных восстановлена"
else
    error "❌ Ошибка восстановления базы данных"
    exit 1
fi

# Восстановление фотографий на рабочей ВМ
log "🖼️  Восстанавливаем фотографии на рабочую ВМ..."
ssh -i "$PROD_SSH_KEY" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
cd ${PROD_PATH}

# Восстанавливаем фотографии из архива в volume
docker run --rm \\
    -v domeo_app_uploads:/target \\
    -v ${BACKUP_DIR}:/backup \\
    alpine sh -c "cd /target && rm -rf * && tar xzf /backup/uploads_backup.tar.gz"

echo "✅ Фотографии восстановлены"
EOF

if [ $? -eq 0 ]; then
    success "✅ Фотографии восстановлены"
else
    error "❌ Ошибка восстановления фотографий"
    exit 1
fi

# Обновление кода и пересборка образа на рабочей ВМ
log "🔨 Обновляем код и пересобираем образ на рабочей ВМ..."
ssh -i "$PROD_SSH_KEY" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
cd ${PROD_PATH}
git pull origin develop
docker compose -f docker-compose.production-full.yml build app
EOF

if [ $? -eq 0 ]; then
    success "✅ Образ пересобран"
else
    error "❌ Ошибка пересборки образа"
    exit 1
fi

# Запуск сервисов на рабочей ВМ
log "🚀 Запускаем сервисы на рабочей ВМ..."
ssh -i "$PROD_SSH_KEY" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
cd ${PROD_PATH}
docker compose -f docker-compose.production-full.yml up -d

# Ждем запуска
sleep 15

# Проверяем статус
docker compose -f docker-compose.production-full.yml ps
EOF

if [ $? -eq 0 ]; then
    success "✅ Сервисы запущены"
else
    error "❌ Ошибка запуска сервисов"
    exit 1
fi

# Очистка временных файлов на обеих ВМ
log "🧹 Очищаем временные файлы..."
ssh -i "$STAGING_SSH_KEY" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" "rm -rf ${BACKUP_DIR}"
ssh -i "$PROD_SSH_KEY" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" "rm -rf ${BACKUP_DIR}"

success "✅ Временные файлы удалены"

success "🎉 Миграция завершена успешно!"
log "  Рабочая ВМ доступна на: http://${PROD_HOST}:3000"

