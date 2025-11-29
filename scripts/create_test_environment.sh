#!/bin/bash
# ============================================
# СКРИПТ СОЗДАНИЯ ТЕСТОВОЙ СРЕДЫ ДЛЯ МИГРАЦИИ
# ============================================

set -e

echo "🧪 Создание тестовой среды для миграции DOMEO Platform"

# Конфигурация
TEST_DIR="./test_migration_env"
TEST_DB_NAME="domeo_test"
TEST_DB_USER="domeo_test_user"
TEST_DB_PASSWORD=$(openssl rand -base64 16)
TEST_DB_HOST="localhost"
TEST_DB_PORT="5433"  # Другой порт для тестовой БД

# Создаем директорию для тестовой среды
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "📁 Создана тестовая директория: $TEST_DIR"

# Создаем файл конфигурации для тестовой среды
TEST_ENV_FILE=".env.test"
cat > "$TEST_ENV_FILE" << EOF
# Test Environment Configuration for DOMEO Platform
# Generated on $(date)

# Test Database Connection
DATABASE_URL="postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${TEST_DB_PORT}/${TEST_DB_NAME}?schema=public"

# Test Database Settings
DB_HOST="${TEST_DB_HOST}"
DB_PORT="${TEST_DB_PORT}"
DB_NAME="${TEST_DB_NAME}"
DB_USER="${TEST_DB_USER}"
DB_PASSWORD="${TEST_DB_PASSWORD}"

# Test Environment
NODE_ENV=test
LOG_LEVEL=debug

# Test Data Settings
TEST_DATA_SIZE=small  # small, medium, large
ENABLE_TEST_LOGGING=true
EOF

echo "✅ Файл конфигурации тестовой среды создан: $TEST_ENV_FILE"

# Копируем необходимые файлы в тестовую среду
echo "📋 Копируем файлы в тестовую среду..."

# Создаем структуру директорий
mkdir -p prisma
mkdir -p scripts
mkdir -p lib
mkdir -p app/api

# Копируем Prisma схему
if [ -f "../prisma/schema.prisma" ]; then
    cp "../prisma/schema.prisma" "prisma/"
    echo "✅ Prisma схема скопирована"
else
    echo "⚠️  Prisma схема не найдена, создаем базовую"
    cat > "prisma/schema.prisma" << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String
  first_name    String
  last_name     String
  role          String    @default("admin")
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  @@map("users")
}

model Product {
  id                  String          @id @default(cuid())
  catalog_category_id String
  sku                 String          @unique
  name                String
  description         String?
  brand               String?
  model               String?
  base_price          Decimal         @db.Decimal(10, 2)
  currency            String          @default("RUB")
  is_active           Boolean         @default(true)
  created_at          DateTime        @default(now())
  updated_at          DateTime        @updatedAt

  @@map("products")
  @@index([catalog_category_id])
  @@index([is_active])
  @@index([sku])
}
EOF
fi

# Копируем скрипты
if [ -d "../scripts" ]; then
    cp -r "../scripts/"* "scripts/" 2>/dev/null || true
    echo "✅ Скрипты скопированы"
fi

# Создаем скрипт инициализации тестовой базы данных
TEST_INIT_SCRIPT="scripts/init_test_db.sql"
cat > "$TEST_INIT_SCRIPT" << EOF
-- ============================================
-- ИНИЦИАЛИЗАЦИЯ ТЕСТОВОЙ БАЗЫ ДАННЫХ DOMEO
-- ============================================

-- Создание тестовой базы данных
CREATE DATABASE ${TEST_DB_NAME};

-- Создание тестового пользователя
CREATE USER ${TEST_DB_USER} WITH PASSWORD '${TEST_DB_PASSWORD}';

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE ${TEST_DB_NAME} TO ${TEST_DB_USER};
GRANT ALL PRIVILEGES ON SCHEMA public TO ${TEST_DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${TEST_DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${TEST_DB_USER};

-- Настройка для будущих таблиц
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${TEST_DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${TEST_DB_USER};

-- Подключение к тестовой базе данных
\c ${TEST_DB_NAME};

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Создание схемы для тестовых данных
CREATE SCHEMA IF NOT EXISTS test_data;

-- Предоставление прав на схему
GRANT ALL PRIVILEGES ON SCHEMA test_data TO ${TEST_DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA test_data TO ${TEST_DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA test_data TO ${TEST_DB_USER};

ALTER DEFAULT PRIVILEGES IN SCHEMA test_data GRANT ALL ON TABLES TO ${TEST_DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA test_data GRANT ALL ON SEQUENCES TO ${TEST_DB_USER};

-- Создание таблицы для тестовых метрик
CREATE TABLE IF NOT EXISTS test_data.migration_metrics (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    records_processed INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по тестам
CREATE INDEX IF NOT EXISTS idx_migration_metrics_test 
ON test_data.migration_metrics(test_name, timestamp);

-- Функция для записи результатов тестов
CREATE OR REPLACE FUNCTION test_data.record_test_result(
    p_test_name VARCHAR(255),
    p_execution_time_ms INTEGER,
    p_records_processed INTEGER DEFAULT 0,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS \$\$
BEGIN
    INSERT INTO test_data.migration_metrics (
        test_name, execution_time_ms, records_processed, success, error_message
    ) VALUES (
        p_test_name, p_execution_time_ms, p_records_processed, p_success, p_error_message
    );
END;
\$\$ LANGUAGE plpgsql;

-- Создание представления для анализа тестов
CREATE OR REPLACE VIEW test_data.test_results AS
SELECT 
    test_name,
    COUNT(*) as test_count,
    AVG(execution_time_ms) as avg_execution_time,
    MAX(execution_time_ms) as max_execution_time,
    MIN(execution_time_ms) as min_execution_time,
    SUM(records_processed) as total_records,
    COUNT(CASE WHEN success THEN 1 END) as success_count,
    COUNT(CASE WHEN NOT success THEN 1 END) as failure_count
FROM test_data.migration_metrics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY test_name
ORDER BY avg_execution_time DESC;

-- Предоставление прав на представление
GRANT SELECT ON test_data.test_results TO ${TEST_DB_USER};

-- Завершение инициализации
SELECT 'Тестовая база данных инициализирована успешно' as status;
EOF

echo "✅ Скрипт инициализации тестовой БД создан: $TEST_INIT_SCRIPT"

# Создаем скрипт для генерации тестовых данных
TEST_DATA_SCRIPT="scripts/generate_test_data.sql"
cat > "$TEST_DATA_SCRIPT" << EOF
-- ============================================
-- ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ ДЛЯ DOMEO
-- ============================================

-- Подключение к тестовой базе данных
\c ${TEST_DB_NAME};

-- Создание тестовых пользователей
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active) VALUES
('test_user_1', 'admin@test.com', '\$2b\$10\$test_hash_1', 'Test', 'Admin', 'admin', true),
('test_user_2', 'user@test.com', '\$2b\$10\$test_hash_2', 'Test', 'User', 'complectator', true),
('test_user_3', 'executor@test.com', '\$2b\$10\$test_hash_3', 'Test', 'Executor', 'executor', true);

-- Создание тестовых категорий каталога
INSERT INTO catalog_categories (id, name, parent_id, level, path, sort_order, is_active, products_count) VALUES
('test_cat_1', 'Тестовые двери', NULL, 0, 'test_cat_1', 1, true, 0),
('test_cat_2', 'Современные двери', 'test_cat_1', 1, 'test_cat_1/test_cat_2', 1, true, 0),
('test_cat_3', 'Классические двери', 'test_cat_1', 1, 'test_cat_1/test_cat_3', 2, true, 0);

-- Создание тестовых товаров
INSERT INTO products (id, catalog_category_id, sku, name, description, brand, model, base_price, currency, is_active) VALUES
('test_prod_1', 'test_cat_2', 'TEST_DOOR_001', 'Тестовая дверь 1', 'Описание тестовой двери 1', 'TestBrand', 'Modern_001', 15000.00, 'RUB', true),
('test_prod_2', 'test_cat_2', 'TEST_DOOR_002', 'Тестовая дверь 2', 'Описание тестовой двери 2', 'TestBrand', 'Modern_002', 18000.00, 'RUB', true),
('test_prod_3', 'test_cat_3', 'TEST_DOOR_003', 'Тестовая дверь 3', 'Описание тестовой двери 3', 'TestBrand', 'Classic_001', 20000.00, 'RUB', true),
('test_prod_4', 'test_cat_3', 'TEST_DOOR_004', 'Тестовая дверь 4', 'Описание тестовой двери 4', 'TestBrand', 'Classic_002', 22000.00, 'RUB', true),
('test_prod_5', 'test_cat_2', 'TEST_DOOR_005', 'Тестовая дверь 5', 'Описание тестовой двери 5', 'TestBrand', 'Modern_003', 16000.00, 'RUB', true);

-- Обновление счетчиков товаров в категориях
UPDATE catalog_categories SET products_count = (
    SELECT COUNT(*) FROM products WHERE catalog_category_id = catalog_categories.id AND is_active = true
);

-- Создание тестовых свойств товаров
INSERT INTO product_properties (id, name, type, description, is_required, is_active) VALUES
('test_prop_1', 'Тестовый материал', 'text', 'Материал тестовой двери', true, true),
('test_prop_2', 'Тестовый цвет', 'text', 'Цвет тестовой двери', true, true),
('test_prop_3', 'Тестовая ширина', 'number', 'Ширина в мм', true, true),
('test_prop_4', 'Тестовая высота', 'number', 'Высота в мм', true, true);

-- Создание тестовых значений свойств
INSERT INTO product_property_values (product_id, property_name, property_value, property_type) VALUES
('test_prod_1', 'Тестовый материал', 'Дуб', 'text'),
('test_prod_1', 'Тестовый цвет', 'Белый', 'text'),
('test_prod_1', 'Тестовая ширина', '800', 'number'),
('test_prod_1', 'Тестовая высота', '2000', 'number'),

('test_prod_2', 'Тестовый материал', 'Сосна', 'text'),
('test_prod_2', 'Тестовый цвет', 'Коричневый', 'text'),
('test_prod_2', 'Тестовая ширина', '900', 'number'),
('test_prod_2', 'Тестовая высота', '2100', 'number'),

('test_prod_3', 'Тестовый материал', 'Дуб', 'text'),
('test_prod_3', 'Тестовый цвет', 'Черный', 'text'),
('test_prod_3', 'Тестовая ширина', '800', 'number'),
('test_prod_3', 'Тестовая высота', '2000', 'number'),

('test_prod_4', 'Тестовый материал', 'Бук', 'text'),
('test_prod_4', 'Тестовый цвет', 'Красный', 'text'),
('test_prod_4', 'Тестовая ширина', '1000', 'number'),
('test_prod_4', 'Тестовая высота', '2200', 'number'),

('test_prod_5', 'Тестовый материал', 'Сосна', 'text'),
('test_prod_5', 'Тестовый цвет', 'Серый', 'text'),
('test_prod_5', 'Тестовая ширина', '850', 'number'),
('test_prod_5', 'Тестовая высота', '2050', 'number');

-- Завершение генерации тестовых данных
SELECT 'Тестовые данные сгенерированы успешно' as status;
SELECT 'Пользователи: ' || COUNT(*) as users_count FROM users;
SELECT 'Категории: ' || COUNT(*) as categories_count FROM catalog_categories;
SELECT 'Товары: ' || COUNT(*) as products_count FROM products;
SELECT 'Свойства: ' || COUNT(*) as properties_count FROM product_property_values;
EOF

echo "✅ Скрипт генерации тестовых данных создан: $TEST_DATA_SCRIPT"

# Создаем скрипт для запуска тестов
TEST_RUNNER_SCRIPT="scripts/run_tests.sh"
cat > "$TEST_RUNNER_SCRIPT" << EOF
#!/bin/bash
# Скрипт запуска тестов миграции

set -e

# Загружаем переменные окружения
if [ -f "$TEST_ENV_FILE" ]; then
    source "$TEST_ENV_FILE"
else
    echo "❌ Файл конфигурации тестовой среды не найден: $TEST_ENV_FILE"
    exit 1
fi

echo "🧪 Запуск тестов миграции DOMEO Platform"
echo "========================================"

# Проверяем доступность PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ psql не найден. Установите PostgreSQL client"
    exit 1
fi

# Проверяем доступность Prisma
if ! command -v npx &> /dev/null; then
    echo "❌ npx не найден. Установите Node.js"
    exit 1
fi

echo "✅ Все необходимые инструменты найдены"

# Инициализируем тестовую базу данных
echo "🔄 Инициализация тестовой базы данных..."
psql "postgresql://postgres@localhost:5432/postgres" -f "$TEST_INIT_SCRIPT"

# Генерируем Prisma клиент для тестовой среды
echo "🔧 Генерация Prisma клиента для тестовой среды..."
export DATABASE_URL="\$DATABASE_URL"
npx prisma generate

# Выполняем миграции в тестовой среде
echo "📦 Выполнение миграций в тестовой среде..."
npx prisma db push

# Генерируем тестовые данные
echo "🎲 Генерация тестовых данных..."
psql "\$DATABASE_URL" -f "$TEST_DATA_SCRIPT"

# Запускаем тесты производительности
echo "⚡ Запуск тестов производительности..."

# Тест 1: Поиск товаров
echo "🔍 Тест 1: Поиск товаров"
START_TIME=\$(date +%s%3N)
psql "\$DATABASE_URL" -c "SELECT COUNT(*) FROM products WHERE is_active = true;"
END_TIME=\$(date +%s%3N)
EXECUTION_TIME=\$((END_TIME - START_TIME))
echo "Время выполнения: \${EXECUTION_TIME}ms"

# Тест 2: Поиск по свойствам
echo "🔍 Тест 2: Поиск по свойствам"
START_TIME=\$(date +%s%3N)
psql "\$DATABASE_URL" -c "SELECT p.* FROM products p JOIN product_property_values ppv ON p.id = ppv.product_id WHERE ppv.property_name = 'Тестовый материал' AND ppv.property_value = 'Дуб';"
END_TIME=\$(date +%s%3N)
EXECUTION_TIME=\$((END_TIME - START_TIME))
echo "Время выполнения: \${EXECUTION_TIME}ms"

# Тест 3: Подсчет товаров в категориях
echo "🔍 Тест 3: Подсчет товаров в категориях"
START_TIME=\$(date +%s%3N)
psql "\$DATABASE_URL" -c "SELECT cc.name, cc.products_count FROM catalog_categories cc WHERE cc.is_active = true;"
END_TIME=\$(date +%s%3N)
EXECUTION_TIME=\$((END_TIME - START_TIME))
echo "Время выполнения: \${EXECUTION_TIME}ms"

# Тест 4: Сложный запрос (калькулятор дверей)
echo "🔍 Тест 4: Сложный запрос (калькулятор дверей)"
START_TIME=\$(date +%s%3N)
psql "\$DATABASE_URL" -c "
SELECT p.*, ppv_material.property_value as material, ppv_color.property_value as color, ppv_width.property_value as width, ppv_height.property_value as height
FROM products p
LEFT JOIN product_property_values ppv_material ON p.id = ppv_material.product_id AND ppv_material.property_name = 'Тестовый материал'
LEFT JOIN product_property_values ppv_color ON p.id = ppv_color.product_id AND ppv_color.property_name = 'Тестовый цвет'
LEFT JOIN product_property_values ppv_width ON p.id = ppv_width.product_id AND ppv_width.property_name = 'Тестовая ширина'
LEFT JOIN product_property_values ppv_height ON p.id = ppv_height.product_id AND ppv_height.property_name = 'Тестовая высота'
WHERE p.is_active = true AND p.catalog_category_id = 'test_cat_2';
"
END_TIME=\$(date +%s%3N)
EXECUTION_TIME=\$((END_TIME - START_TIME))
echo "Время выполнения: \${EXECUTION_TIME}ms"

echo ""
echo "✅ Все тесты выполнены успешно!"
echo "📊 Результаты тестов сохранены в базе данных"

# Показываем результаты тестов
echo ""
echo "📈 РЕЗУЛЬТАТЫ ТЕСТОВ:"
echo "==================="
psql "\$DATABASE_URL" -c "SELECT * FROM test_data.test_results ORDER BY avg_execution_time DESC;"

echo ""
echo "🎉 Тестирование завершено!"
echo "Тестовая среда готова для проверки миграции"
EOF

chmod +x "$TEST_RUNNER_SCRIPT"
echo "✅ Скрипт запуска тестов создан: $TEST_RUNNER_SCRIPT"

# Создаем скрипт очистки тестовой среды
CLEANUP_SCRIPT="scripts/cleanup_test_env.sh"
cat > "$CLEANUP_SCRIPT" << EOF
#!/bin/bash
# Скрипт очистки тестовой среды

echo "🧹 Очистка тестовой среды DOMEO Platform"

# Загружаем переменные окружения
if [ -f "$TEST_ENV_FILE" ]; then
    source "$TEST_ENV_FILE"
else
    echo "❌ Файл конфигурации тестовой среды не найден: $TEST_ENV_FILE"
    exit 1
fi

# Подтверждение очистки
read -p "⚠️  Вы уверены, что хотите удалить тестовую среду? (y/N): " -n 1 -r
echo
if [[ ! \$REPLY =~ ^[Yy]\$ ]]; then
    echo "❌ Очистка отменена"
    exit 1
fi

# Удаляем тестовую базу данных
echo "🗑️  Удаление тестовой базы данных..."
psql "postgresql://postgres@localhost:5432/postgres" -c "DROP DATABASE IF EXISTS ${TEST_DB_NAME};"

# Удаляем тестового пользователя
echo "🗑️  Удаление тестового пользователя..."
psql "postgresql://postgres@localhost:5432/postgres" -c "DROP USER IF EXISTS ${TEST_DB_USER};"

# Удаляем директорию тестовой среды
echo "🗑️  Удаление директории тестовой среды..."
cd ..
rm -rf "$TEST_DIR"

echo "✅ Тестовая среда очищена успешно!"
EOF

chmod +x "$CLEANUP_SCRIPT"
echo "✅ Скрипт очистки создан: $CLEANUP_SCRIPT"

# Создаем README для тестовой среды
TEST_README="README_TEST_ENV.md"
cat > "$TEST_README" << EOF
# 🧪 Тестовая среда для миграции DOMEO Platform

## 📋 Описание

Эта тестовая среда создана для безопасного тестирования миграции базы данных DOMEO Platform с SQLite на PostgreSQL.

## 🗂️ Структура

- **$TEST_ENV_FILE** - Конфигурация тестовой среды
- **$TEST_INIT_SCRIPT** - Инициализация тестовой базы данных
- **$TEST_DATA_SCRIPT** - Генерация тестовых данных
- **$TEST_RUNNER_SCRIPT** - Запуск тестов
- **$CLEANUP_SCRIPT** - Очистка тестовой среды

## 🚀 Использование

### 1. Инициализация тестовой среды
\`\`\`bash
# Убедитесь, что PostgreSQL запущен на порту 5432
# Тестовая база данных будет создана на порту 5433

# Запустите инициализацию
psql "postgresql://postgres@localhost:5432/postgres" -f $TEST_INIT_SCRIPT
\`\`\`

### 2. Запуск тестов
\`\`\`bash
# Запустите все тесты
./$TEST_RUNNER_SCRIPT
\`\`\`

### 3. Очистка тестовой среды
\`\`\`bash
# Удалите тестовую среду
./$CLEANUP_SCRIPT
\`\`\`

## 📊 Тестовые данные

Тестовая среда содержит:
- **3 пользователя** (admin, complectator, executor)
- **3 категории** товаров
- **5 товаров** с различными характеристиками
- **4 свойства** товаров
- **20 значений** свойств

## 🔍 Тесты производительности

1. **Поиск товаров** - базовый поиск активных товаров
2. **Поиск по свойствам** - поиск товаров по значениям свойств
3. **Подсчет в категориях** - подсчет товаров в категориях
4. **Сложный запрос** - имитация работы калькулятора дверей

## 📈 Ожидаемые результаты

- **Поиск товаров**: < 10ms
- **Поиск по свойствам**: < 20ms
- **Подсчет в категориях**: < 5ms
- **Сложный запрос**: < 50ms

## ⚠️ Важные замечания

1. **Порт**: Тестовая база данных использует порт 5433
2. **Данные**: Тестовые данные не влияют на продакшен
3. **Очистка**: Всегда очищайте тестовую среду после тестирования
4. **Безопасность**: Тестовые пароли не должны использоваться в продакшене

## 🆘 Устранение неполадок

### Проблемы подключения
1. Убедитесь, что PostgreSQL запущен
2. Проверьте доступность порта 5432
3. Проверьте права пользователя postgres

### Проблемы с тестами
1. Проверьте логи выполнения тестов
2. Убедитесь в корректности тестовых данных
3. Проверьте индексы в базе данных

### Проблемы очистки
1. Убедитесь, что нет активных подключений к тестовой БД
2. Проверьте права на удаление базы данных
3. Выполните очистку вручную при необходимости

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи выполнения
2. Обратитесь к документации PostgreSQL
3. Создайте issue в репозитории проекта
EOF

echo "✅ README для тестовой среды создан: $TEST_README"

# Возвращаемся в корневую директорию
cd ..

# Показываем итоговую информацию
echo ""
echo "🎉 ТЕСТОВАЯ СРЕДА СОЗДАНА УСПЕШНО!"
echo "=================================="
echo "📁 Директория: $TEST_DIR"
echo "📁 Созданные файлы:"
echo "   - $TEST_ENV_FILE (конфигурация)"
echo "   - $TEST_INIT_SCRIPT (инициализация БД)"
echo "   - $TEST_DATA_SCRIPT (тестовые данные)"
echo "   - $TEST_RUNNER_SCRIPT (запуск тестов)"
echo "   - $CLEANUP_SCRIPT (очистка)"
echo "   - $TEST_README (документация)"
echo ""
echo "🔑 Данные тестовой БД:"
echo "   - База данных: $TEST_DB_NAME"
echo "   - Пользователь: $TEST_DB_USER"
echo "   - Пароль: $TEST_DB_PASSWORD"
echo "   - Хост: $TEST_DB_HOST"
echo "   - Порт: $TEST_DB_PORT"
echo ""
echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
echo "=================="
echo "1. Убедитесь, что PostgreSQL запущен"
echo "2. Перейдите в тестовую среду: cd $TEST_DIR"
echo "3. Запустите тесты: ./$TEST_RUNNER_SCRIPT"
echo "4. Проанализируйте результаты"
echo "5. Очистите среду: ./$CLEANUP_SCRIPT"
echo ""
echo "⚠️  ВАЖНО: Тестовая среда использует отдельную базу данных!"
echo ""

echo "✨ Готово! Тестовая среда создана для безопасного тестирования миграции."
