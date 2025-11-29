#!/bin/bash
# ============================================
# СКРИПТ НАСТРОЙКИ POSTGRESQL НА YANDEX CLOUD
# ============================================

set -e

echo "🚀 Настройка PostgreSQL на Yandex Cloud для DOMEO Platform"

# Конфигурация
DB_NAME="domeo_production"
DB_USER="domeo_user"
DB_PASSWORD=$(openssl rand -base64 32)
DB_HOST="localhost"  # Замените на реальный хост Yandex Cloud
DB_PORT="5432"

# Создаем файл с переменными окружения
ENV_FILE=".env.postgresql"
cat > "$ENV_FILE" << EOF
# PostgreSQL Configuration for DOMEO Platform
# Generated on $(date)

# Database Connection
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Database Settings
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"

# Connection Pool Settings
DB_POOL_SIZE=20
DB_POOL_TIMEOUT=30000

# SSL Settings (для продакшена)
DB_SSL_MODE=require
DB_SSL_CERT_PATH=""
DB_SSL_KEY_PATH=""
DB_SSL_CA_PATH=""
EOF

echo "✅ Файл конфигурации создан: $ENV_FILE"

# Создаем скрипт инициализации базы данных
INIT_SCRIPT="scripts/init_postgresql.sql"
mkdir -p scripts

cat > "$INIT_SCRIPT" << EOF
-- ============================================
-- ИНИЦИАЛИЗАЦИЯ POSTGRESQL ДЛЯ DOMEO PLATFORM
-- ============================================

-- Создание базы данных
CREATE DATABASE ${DB_NAME};

-- Создание пользователя
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
GRANT ALL PRIVILEGES ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

-- Настройка для будущих таблиц
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- Подключение к базе данных
\c ${DB_NAME};

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Создание схемы для оптимизированных таблиц
CREATE SCHEMA IF NOT EXISTS domeo_optimized;

-- Предоставление прав на схему
GRANT ALL PRIVILEGES ON SCHEMA domeo_optimized TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA domeo_optimized TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA domeo_optimized TO ${DB_USER};

ALTER DEFAULT PRIVILEGES IN SCHEMA domeo_optimized GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA domeo_optimized GRANT ALL ON SEQUENCES TO ${DB_USER};

-- Завершение инициализации
SELECT 'PostgreSQL инициализирован успешно для DOMEO Platform' as status;
EOF

echo "✅ Скрипт инициализации создан: $INIT_SCRIPT"

# Создаем скрипт для подключения к базе данных
CONNECT_SCRIPT="scripts/connect_postgresql.sh"
cat > "$CONNECT_SCRIPT" << EOF
#!/bin/bash
# Скрипт подключения к PostgreSQL

# Загружаем переменные окружения
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "❌ Файл конфигурации не найден: $ENV_FILE"
    exit 1
fi

echo "🔌 Подключение к PostgreSQL базе данных DOMEO"
echo "=============================================="
echo "Хост: \$DB_HOST"
echo "Порт: \$DB_PORT"
echo "База данных: \$DB_NAME"
echo "Пользователь: \$DB_USER"
echo ""

# Проверяем доступность PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ psql найден"
    
    # Подключаемся к базе данных
    echo "🔄 Подключение к базе данных..."
    psql "\$DATABASE_URL"
else
    echo "❌ psql не найден. Установите PostgreSQL client"
    echo "Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "CentOS/RHEL: sudo yum install postgresql"
    echo "macOS: brew install postgresql"
    exit 1
fi
EOF

chmod +x "$CONNECT_SCRIPT"
echo "✅ Скрипт подключения создан: $CONNECT_SCRIPT"

# Создаем скрипт для выполнения миграций
MIGRATION_SCRIPT="scripts/run_migrations.sh"
cat > "$MIGRATION_SCRIPT" << EOF
#!/bin/bash
# Скрипт выполнения миграций

set -e

# Загружаем переменные окружения
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "❌ Файл конфигурации не найден: $ENV_FILE"
    exit 1
fi

echo "🔄 Выполнение миграций DOMEO Platform"
echo "====================================="

# Проверяем доступность Prisma
if command -v npx &> /dev/null; then
    echo "✅ npx найден"
else
    echo "❌ npx не найден. Установите Node.js"
    exit 1
fi

# Генерируем Prisma клиент
echo "🔧 Генерация Prisma клиента..."
npx prisma generate

# Выполняем миграции
echo "📦 Выполнение миграций базы данных..."
npx prisma db push

# Проверяем статус базы данных
echo "🔍 Проверка статуса базы данных..."
npx prisma db status

echo "✅ Миграции выполнены успешно!"
EOF

chmod +x "$MIGRATION_SCRIPT"
echo "✅ Скрипт миграций создан: $MIGRATION_SCRIPT"

# Показываем итоговую информацию
echo ""
echo "🎉 НАСТРОЙКА POSTGRESQL ЗАВЕРШЕНА!"
echo "=================================="
echo "📁 Созданные файлы:"
echo "   - $ENV_FILE (конфигурация)"
echo "   - $INIT_SCRIPT (инициализация)"
echo "   - $CONNECT_SCRIPT (подключение)"
echo "   - $MIGRATION_SCRIPT (миграции)"
echo ""
echo "🔑 Данные подключения:"
echo "   - База данных: $DB_NAME"
echo "   - Пользователь: $DB_USER"
echo "   - Пароль: $DB_PASSWORD"
echo "   - Хост: $DB_HOST"
echo "   - Порт: $DB_PORT"
echo ""
echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
echo "=================="
echo "1. Создайте кластер PostgreSQL в Yandex Cloud"
echo "2. Обновите $ENV_FILE с реальными данными подключения"
echo "3. Выполните инициализацию: psql \"\$DATABASE_URL\" -f $INIT_SCRIPT"
echo "4. Запустите миграции: ./$MIGRATION_SCRIPT"
echo ""
echo "⚠️  ВАЖНО: Сохраните пароль базы данных в безопасном месте!"
echo ""

echo "✨ Готово! PostgreSQL настроен для DOMEO Platform."
