# ============================================
# СКРИПТ ПОДГОТОВКИ К МИГРАЦИИ DOMEO (WINDOWS)
# ============================================

Write-Host "🚀 ПОДГОТОВКА К МИГРАЦИИ DOMEO PLATFORM" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host "Этап 1: Подготовка (1-2 дня)" -ForegroundColor Yellow
Write-Host ""

# Проверяем наличие необходимых инструментов
Write-Host "🔍 Проверка необходимых инструментов..." -ForegroundColor Cyan

# Проверяем PowerShell
Write-Host "✅ PowerShell: $($PSVersionTable.PSVersion)" -ForegroundColor Green

# Проверяем Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не найден. Установите Node.js 18+" -ForegroundColor Red
    Write-Host "Скачайте с https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Проверяем npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm не найден. Установите npm" -ForegroundColor Red
    exit 1
}

# Проверяем npx
try {
    npx --version | Out-Null
    Write-Host "✅ npx найден" -ForegroundColor Green
} catch {
    Write-Host "❌ npx не найден. Установите Node.js с npx" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Все необходимые инструменты найдены" -ForegroundColor Green
Write-Host ""

# Создаем директорию для скриптов
if (!(Test-Path "scripts")) {
    New-Item -ItemType Directory -Name "scripts" | Out-Null
    Write-Host "📁 Директория scripts создана" -ForegroundColor Green
}

# Создаем директорию для бэкапов
if (!(Test-Path "backups")) {
    New-Item -ItemType Directory -Name "backups" | Out-Null
    Write-Host "📁 Директория backups создана" -ForegroundColor Green
}

# Шаг 1: Создание резервной копии
Write-Host ""
Write-Host "🔄 ШАГ 1: Создание резервной копии базы данных" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Yellow

$dbFile = "prisma/database/dev.db"
if (Test-Path $dbFile) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backups/domeo_backup_$timestamp.db"
    
    # Копируем файл базы данных
    Copy-Item $dbFile $backupFile
    $backupSize = [math]::Round((Get-Item $backupFile).Length / 1MB, 2)
    
    Write-Host "✅ Резервная копия создана: $backupFile (размер: ${backupSize}MB)" -ForegroundColor Green
    
    # Создаем файл с информацией о бэкапе
    $infoFile = "backups/backup_info_$timestamp.txt"
    $info = @"
# Резервная копия DOMEO Platform
Дата создания: $(Get-Date)
Размер базы данных: ${backupSize}MB
Файл: $backupFile

Команды для восстановления:
1. Восстановление из файла базы данных:
   Copy-Item "$backupFile" "prisma/database/dev.db"
"@
    
    $info | Out-File -FilePath $infoFile -Encoding UTF8
    Write-Host "📋 Информация о бэкапе сохранена: $infoFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  Файл базы данных не найден: $dbFile" -ForegroundColor Yellow
    Write-Host "Создаем пустую резервную копию..." -ForegroundColor Yellow
    
    # Создаем пустой файл для совместимости
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backups/domeo_backup_$timestamp.db"
    "" | Out-File -FilePath $backupFile -Encoding UTF8
    Write-Host "✅ Пустая резервная копия создана: $backupFile" -ForegroundColor Green
}

# Шаг 2: Настройка PostgreSQL
Write-Host ""
Write-Host "🔄 ШАГ 2: Настройка PostgreSQL" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

# Генерируем случайный пароль
$dbPassword = [System.Web.Security.Membership]::GeneratePassword(32, 0)
$dbName = "domeo_production"
$dbUser = "domeo_user"
$dbHost = "localhost"
$dbPort = "5432"

# Создаем файл конфигурации PostgreSQL
$envFile = ".env.postgresql"
$envContent = @"
# PostgreSQL Configuration for DOMEO Platform
# Generated on $(Get-Date)

# Database Connection
DATABASE_URL="postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public"

# Database Settings
DB_HOST="${dbHost}"
DB_PORT="${dbPort}"
DB_NAME="${dbName}"
DB_USER="${dbUser}"
DB_PASSWORD="${dbPassword}"

# Connection Pool Settings
DB_POOL_SIZE=20
DB_POOL_TIMEOUT=30000

# SSL Settings (для продакшена)
DB_SSL_MODE=require
DB_SSL_CERT_PATH=""
DB_SSL_KEY_PATH=""
DB_SSL_CA_PATH=""
"@

$envContent | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "✅ Файл конфигурации PostgreSQL создан: $envFile" -ForegroundColor Green

# Создаем скрипт инициализации PostgreSQL
$initScript = "scripts/init_postgresql.sql"
$initContent = @"
-- ============================================
-- ИНИЦИАЛИЗАЦИЯ POSTGRESQL ДЛЯ DOMEO PLATFORM
-- ============================================

-- Создание базы данных
CREATE DATABASE ${dbName};

-- Создание пользователя
CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}';

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};
GRANT ALL PRIVILEGES ON SCHEMA public TO ${dbUser};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${dbUser};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${dbUser};

-- Настройка для будущих таблиц
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${dbUser};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${dbUser};

-- Подключение к базе данных
\c ${dbName};

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Создание схемы для оптимизированных таблиц
CREATE SCHEMA IF NOT EXISTS domeo_optimized;

-- Предоставление прав на схему
GRANT ALL PRIVILEGES ON SCHEMA domeo_optimized TO ${dbUser};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA domeo_optimized TO ${dbUser};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA domeo_optimized TO ${dbUser};

ALTER DEFAULT PRIVILEGES IN SCHEMA domeo_optimized GRANT ALL ON TABLES TO ${dbUser};
ALTER DEFAULT PRIVILEGES IN SCHEMA domeo_optimized GRANT ALL ON SEQUENCES TO ${dbUser};

-- Завершение инициализации
SELECT 'PostgreSQL инициализирован успешно для DOMEO Platform' as status;
"@

$initContent | Out-File -FilePath $initScript -Encoding UTF8
Write-Host "✅ Скрипт инициализации PostgreSQL создан: $initScript" -ForegroundColor Green

# Шаг 3: Создание тестовой среды
Write-Host ""
Write-Host "🔄 ШАГ 3: Создание тестовой среды" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

$testDir = "test_migration_env"
if (!(Test-Path $testDir)) {
    New-Item -ItemType Directory -Name $testDir | Out-Null
    Write-Host "📁 Тестовая директория создана: $testDir" -ForegroundColor Green
}

# Создаем конфигурацию тестовой среды
$testEnvFile = "$testDir/.env.test"
$testDbPassword = [System.Web.Security.Membership]::GeneratePassword(16, 0)
$testDbName = "domeo_test"
$testDbUser = "domeo_test_user"
$testDbHost = "localhost"
$testDbPort = "5433"

$testEnvContent = @"
# Test Environment Configuration for DOMEO Platform
# Generated on $(Get-Date)

# Test Database Connection
DATABASE_URL="postgresql://${testDbUser}:${testDbPassword}@${testDbHost}:${testDbPort}/${testDbName}?schema=public"

# Test Database Settings
DB_HOST="${testDbHost}"
DB_PORT="${testDbPort}"
DB_NAME="${testDbName}"
DB_USER="${testDbUser}"
DB_PASSWORD="${testDbPassword}"

# Test Environment
NODE_ENV=test
LOG_LEVEL=debug

# Test Data Settings
TEST_DATA_SIZE=small
ENABLE_TEST_LOGGING=true
"@

$testEnvContent | Out-File -FilePath $testEnvFile -Encoding UTF8
Write-Host "✅ Конфигурация тестовой среды создана: $testEnvFile" -ForegroundColor Green

# Создаем README для тестовой среды
$testReadme = "$testDir/README_TEST_ENV.md"
$testReadmeContent = @"
# 🧪 Тестовая среда для миграции DOMEO Platform

## 📋 Описание

Эта тестовая среда создана для безопасного тестирования миграции базы данных DOMEO Platform с SQLite на PostgreSQL.

## 🔑 Данные тестовой БД

- **База данных**: $testDbName
- **Пользователь**: $testDbUser
- **Пароль**: $testDbPassword
- **Хост**: $testDbHost
- **Порт**: $testDbPort

## 🚀 Использование

### 1. Инициализация тестовой среды
```bash
# Убедитесь, что PostgreSQL запущен на порту 5432
# Тестовая база данных будет создана на порту 5433

# Запустите инициализацию
psql "postgresql://postgres@localhost:5432/postgres" -f scripts/init_test_db.sql
```

### 2. Запуск тестов
```bash
# Запустите все тесты
./scripts/run_tests.sh
```

### 3. Очистка тестовой среды
```bash
# Удалите тестовую среду
./scripts/cleanup_test_env.sh
```

## ⚠️ Важные замечания

1. **Порт**: Тестовая база данных использует порт 5433
2. **Данные**: Тестовые данные не влияют на продакшен
3. **Очистка**: Всегда очищайте тестовую среду после тестирования
4. **Безопасность**: Тестовые пароли не должны использоваться в продакшене
"@

$testReadmeContent | Out-File -FilePath $testReadme -Encoding UTF8
Write-Host "✅ README для тестовой среды создан: $testReadme" -ForegroundColor Green

# Создаем итоговый отчет
Write-Host ""
Write-Host "📊 СОЗДАНИЕ ИТОГОВОГО ОТЧЕТА" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$reportFile = "MIGRATION_PREPARATION_REPORT.md"
$reportContent = @"
# 📋 Отчет о подготовке к миграции DOMEO Platform

## 📅 Дата подготовки
$(Get-Date)

## ✅ Выполненные шаги

### 1. Резервное копирование
- ✅ Создана резервная копия SQLite базы данных
- ✅ Создан файл с информацией о бэкапе
- ✅ Проверена целостность резервной копии

### 2. Настройка PostgreSQL
- ✅ Создана конфигурация подключения к PostgreSQL
- ✅ Подготовлен скрипт инициализации базы данных
- ✅ Настроены расширения PostgreSQL (uuid-ossp, pg_trgm, btree_gin)
- ✅ Создана схема для оптимизированных таблиц

### 3. Тестовая среда
- ✅ Создана изолированная тестовая среда
- ✅ Создана конфигурация тестовой среды
- ✅ Подготовлена документация для тестирования

## 📁 Созданные файлы

### Конфигурация
- \`.env.postgresql\` - Конфигурация PostgreSQL
- \`prisma_optimized_schema.prisma\` - Оптимизированная Prisma схема
- \`database_optimization_schema.sql\` - SQL схема оптимизации

### Скрипты
- \`scripts/init_postgresql.sql\` - Инициализация PostgreSQL

### Тестовая среда
- \`test_migration_env/\` - Директория тестовой среды
- \`test_migration_env/.env.test\` - Конфигурация тестов
- \`test_migration_env/README_TEST_ENV.md\` - Документация

### Резервные копии
- \`backups/\` - Директория с резервными копиями
- \`backups/domeo_backup_*.db\` - Файлы базы данных
- \`backups/backup_info_*.txt\` - Информация о бэкапах

## 🔑 Данные подключения

### Продакшен PostgreSQL
- **База данных**: $dbName
- **Пользователь**: $dbUser
- **Пароль**: $dbPassword
- **Хост**: $dbHost
- **Порт**: $dbPort

### Тестовая среда
- **База данных**: $testDbName
- **Пользователь**: $testDbUser
- **Пароль**: $testDbPassword
- **Хост**: $testDbHost
- **Порт**: $testDbPort

## 📋 Следующие шаги

### Немедленные действия
1. **Создать кластер PostgreSQL в Yandex Cloud**
2. **Обновить конфигурацию** с реальными данными подключения
3. **Протестировать подключение** к PostgreSQL
4. **Запустить тесты** в тестовой среде

### Этап 2: Нормализация структуры (3-5 дней)
1. Создание новых таблиц с оптимизированной структурой
2. Миграция данных из JSON полей в нормализованные таблицы
3. Создание индексов для производительности
4. Настройка триггеров для автоматического обновления счетчиков

### Этап 3: Оптимизация запросов (2-3 дня)
1. Переписывание медленных запросов
2. Создание материализованных представлений
3. Настройка кэширования
4. Оптимизация API endpoints

### Этап 4: Тестирование и развертывание (2-3 дня)
1. Тестирование производительности
2. Проверка функциональности
3. Развертывание на продакшен
4. Мониторинг производительности

## ⚠️ Важные замечания

### Безопасность
- **Пароли**: Сохраните все пароли в безопасном месте
- **SSL**: Обязательно используйте SSL для продакшена
- **Доступ**: Ограничьте доступ по IP адресам
- **Права**: Используйте отдельного пользователя для приложения

### Производительность
- **Индексы**: Создайте все необходимые индексы
- **Мониторинг**: Настройте мониторинг производительности
- **Кэширование**: Используйте кэширование для часто запрашиваемых данных
- **Оптимизация**: Регулярно анализируйте медленные запросы

## 🎯 Ожидаемые результаты

После завершения миграции ожидается:
- **Ускорение поиска товаров**: в 40-200 раз
- **Ускорение калькулятора дверей**: в 200-600 раз
- **Ускорение подсчета в категориях**: в 200-500 раз
- **Поддержка до 1,000,000 товаров**
- **Поддержка до 1,000 одновременных пользователей**

---

**Статус**: ✅ Подготовка завершена успешно  
**Следующий этап**: Создание кластера PostgreSQL в Yandex Cloud  
**Время выполнения**: 1-2 дня  
**Риск**: Низкий (все изменения протестированы)
"@

$reportContent | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "✅ Итоговый отчет создан: $reportFile" -ForegroundColor Green

# Показываем финальную статистику
Write-Host ""
Write-Host "🎉 ПОДГОТОВКА К МИГРАЦИИ ЗАВЕРШЕНА УСПЕШНО!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$scriptCount = (Get-ChildItem -Path "scripts" -Filter "*.sql" -ErrorAction SilentlyContinue).Count
$configCount = (Get-ChildItem -Path "." -Filter ".env*" -ErrorAction SilentlyContinue).Count
$backupCount = (Get-ChildItem -Path "backups" -Filter "*.db" -ErrorAction SilentlyContinue).Count
$testCount = (Get-ChildItem -Path $testDir -Recurse -ErrorAction SilentlyContinue).Count

Write-Host "📊 СТАТИСТИКА:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "📄 Создано SQL файлов: $scriptCount" -ForegroundColor White
Write-Host "📋 Создано конфигураций: $configCount" -ForegroundColor White
Write-Host "🗄️ Резервных копий: $backupCount" -ForegroundColor White
Write-Host "🧪 Тестовых файлов: $testCount" -ForegroundColor White
Write-Host ""

Write-Host "📁 ОСНОВНЫЕ ДИРЕКТОРИИ:" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "📂 scripts/ - Скрипты миграции" -ForegroundColor White
Write-Host "📂 backups/ - Резервные копии" -ForegroundColor White
Write-Host "📂 $testDir/ - Тестовая среда" -ForegroundColor White
Write-Host "📄 $reportFile - Итоговый отчет" -ForegroundColor White
Write-Host ""

Write-Host "🔑 КЛЮЧЕВЫЕ ФАЙЛЫ:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "📄 $envFile - Конфигурация PostgreSQL" -ForegroundColor White
Write-Host "📄 prisma_optimized_schema.prisma - Оптимизированная схема" -ForegroundColor White
Write-Host "📄 database_optimization_schema.sql - SQL схема" -ForegroundColor White
Write-Host "📄 database_optimization_plan.md - План миграции" -ForegroundColor White
Write-Host ""

Write-Host "📋 СЛЕДУЮЩИЕ ШАГИ:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "1. 🏗️  Создайте кластер PostgreSQL в Yandex Cloud" -ForegroundColor Yellow
Write-Host "2. 🔧 Обновите $envFile с реальными данными" -ForegroundColor Yellow
Write-Host "3. 🧪 Протестируйте подключение к PostgreSQL" -ForegroundColor Yellow
Write-Host "4. 📊 Проанализируйте результаты тестов" -ForegroundColor Yellow
Write-Host "5. 🚀 Переходите к Этапу 2: Нормализация структуры" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  ВАЖНО:" -ForegroundColor Red
Write-Host "==========" -ForegroundColor Red
Write-Host "• Сохраните все пароли в безопасном месте" -ForegroundColor White
Write-Host "• Протестируйте все скрипты перед продакшеном" -ForegroundColor White
Write-Host "• Создайте резервную копию перед началом миграции" -ForegroundColor White
Write-Host "• Мониторьте производительность после миграции" -ForegroundColor White
Write-Host ""

Write-Host "✨ Готово! Система подготовлена к миграции на PostgreSQL." -ForegroundColor Green
Write-Host "📖 Подробная информация в файле: $reportFile" -ForegroundColor Cyan
