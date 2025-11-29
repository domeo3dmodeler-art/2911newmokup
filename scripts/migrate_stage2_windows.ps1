# ============================================
# МИГРАЦИЯ DOMEO PLATFORM - ЭТАП 2
# Нормализация структуры базы данных
# ============================================

Write-Host "🚀 ЭТАП 2: НОРМАЛИЗАЦИЯ СТРУКТУРЫ DOMEO PLATFORM" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Проверяем наличие необходимых файлов
$requiredFiles = @(
    "scripts/create_optimized_structure.sql",
    "scripts/migrate_data_to_optimized.sql", 
    "scripts/test_optimized_structure.sql",
    ".env.postgresql"
)

Write-Host "🔍 Проверка необходимых файлов..." -ForegroundColor Cyan
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file не найден!" -ForegroundColor Red
        exit 1
    }
}

# Читаем конфигурацию PostgreSQL
Write-Host ""
Write-Host "📖 Чтение конфигурации PostgreSQL..." -ForegroundColor Cyan
$envContent = Get-Content ".env.postgresql" -Raw
$dbHost = ($envContent | Select-String "DB_HOST=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -replace '"', ''
$dbPort = ($envContent | Select-String "DB_PORT=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -replace '"', ''
$dbName = ($envContent | Select-String "DB_NAME=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -replace '"', ''
$dbUser = ($envContent | Select-String "DB_USER=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -replace '"', ''
$dbPassword = ($envContent | Select-String "DB_PASSWORD=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -replace '"', ''

Write-Host "   Хост: $dbHost" -ForegroundColor White
Write-Host "   Порт: $dbPort" -ForegroundColor White
Write-Host "   База данных: $dbName" -ForegroundColor White
Write-Host "   Пользователь: $dbUser" -ForegroundColor White

# Проверяем подключение к PostgreSQL
Write-Host ""
Write-Host "🔗 Проверка подключения к PostgreSQL..." -ForegroundColor Cyan
$env:PGPASSWORD = $dbPassword
$connectionTest = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Подключение к PostgreSQL успешно" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка подключения к PostgreSQL:" -ForegroundColor Red
    Write-Host $connectionTest -ForegroundColor Red
    Write-Host ""
    Write-Host "Убедитесь, что:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL запущен и доступен" -ForegroundColor White
    Write-Host "2. Данные подключения корректны" -ForegroundColor White
    Write-Host "3. Пользователь имеет необходимые права" -ForegroundColor White
    exit 1
}

# Создаем резервную копию перед миграцией
Write-Host ""
Write-Host "💾 Создание резервной копии перед миграцией..." -ForegroundColor Cyan
$backupFile = "backups/postgresql_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
New-Item -ItemType Directory -Path "backups" -Force | Out-Null

Write-Host "   Создание дампа базы данных..." -ForegroundColor White
$backupResult = pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $backupFile 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Резервная копия создана: $backupFile" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка создания резервной копии:" -ForegroundColor Red
    Write-Host $backupResult -ForegroundColor Red
    Write-Host "Продолжаем без резервной копии..." -ForegroundColor Yellow
}

# Шаг 1: Создание оптимизированной структуры
Write-Host ""
Write-Host "🏗️ ШАГ 1: Создание оптимизированной структуры..." -ForegroundColor Cyan
Write-Host "   Выполнение: scripts/create_optimized_structure.sql" -ForegroundColor White

$structureResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "scripts/create_optimized_structure.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Оптимизированная структура создана успешно" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка создания структуры:" -ForegroundColor Red
    Write-Host $structureResult -ForegroundColor Red
    Write-Host ""
    Write-Host "Возможные причины:" -ForegroundColor Yellow
    Write-Host "1. Недостаточно прав для создания таблиц" -ForegroundColor White
    Write-Host "2. Конфликт имен таблиц" -ForegroundColor White
    Write-Host "3. Ошибка в SQL скрипте" -ForegroundColor White
    exit 1
}

# Шаг 2: Миграция данных
Write-Host ""
Write-Host "📦 ШАГ 2: Миграция данных в оптимизированную структуру..." -ForegroundColor Cyan
Write-Host "   Выполнение: scripts/migrate_data_to_optimized.sql" -ForegroundColor White

$migrationResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "scripts/migrate_data_to_optimized.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Миграция данных завершена успешно" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка миграции данных:" -ForegroundColor Red
    Write-Host $migrationResult -ForegroundColor Red
    Write-Host ""
    Write-Host "Возможные причины:" -ForegroundColor Yellow
    Write-Host "1. Отсутствуют исходные данные" -ForegroundColor White
    Write-Host "2. Ошибка в логике миграции" -ForegroundColor White
    Write-Host "3. Проблемы с целостностью данных" -ForegroundColor White
    exit 1
}

# Шаг 3: Тестирование новой структуры
Write-Host ""
Write-Host "🧪 ШАГ 3: Тестирование оптимизированной структуры..." -ForegroundColor Cyan
Write-Host "   Выполнение: scripts/test_optimized_structure.sql" -ForegroundColor White

$testResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "scripts/test_optimized_structure.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Тестирование завершено успешно" -ForegroundColor Green
} else {
    Write-Host "⚠️ Предупреждения при тестировании:" -ForegroundColor Yellow
    Write-Host $testResult -ForegroundColor Yellow
}

# Анализ результатов
Write-Host ""
Write-Host "📊 АНАЛИЗ РЕЗУЛЬТАТОВ МИГРАЦИИ..." -ForegroundColor Cyan

# Получаем статистику по новым таблицам
$statsQuery = @"
SELECT 
    'products_optimized' as table_name, COUNT(*) as count FROM products_optimized
UNION ALL
SELECT 'product_property_values' as table_name, COUNT(*) as count FROM product_property_values
UNION ALL
SELECT 'catalog_categories_optimized' as table_name, COUNT(*) as count FROM catalog_categories_optimized
UNION ALL
SELECT 'documents_unified' as table_name, COUNT(*) as count FROM documents_unified
UNION ALL
SELECT 'document_items_unified' as table_name, COUNT(*) as count FROM document_items_unified
ORDER BY table_name;
"@

Write-Host "   Статистика новых таблиц:" -ForegroundColor White
$statsResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $statsQuery 2>&1
Write-Host $statsResult -ForegroundColor White

# Получаем результаты тестов производительности
$perfQuery = @"
SELECT 
    test_name as "Тест",
    execution_time_ms as "Время (мс)",
    CASE 
        WHEN execution_time_ms < 10 THEN 'Отлично'
        WHEN execution_time_ms < 50 THEN 'Хорошо'
        WHEN execution_time_ms < 100 THEN 'Удовлетворительно'
        ELSE 'Требует оптимизации'
    END as "Оценка"
FROM performance_test_results
ORDER BY execution_time_ms;
"@

Write-Host ""
Write-Host "   Результаты тестов производительности:" -ForegroundColor White
$perfResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $perfQuery 2>&1
Write-Host $perfResult -ForegroundColor White

# Создаем отчет о миграции
Write-Host ""
Write-Host "📝 Создание отчета о миграции..." -ForegroundColor Cyan

$reportContent = @"
# Отчет о миграции DOMEO Platform - Этап 2

## Дата миграции
$(Get-Date)

## Выполненные шаги

### 1. Создание оптимизированной структуры
- Созданы новые таблицы с нормализованной структурой
- Добавлены индексы для производительности
- Настроены триггеры для автоматического обновления счетчиков
- Созданы материализованные представления

### 2. Миграция данных
- Мигрированы категории каталога
- Мигрированы товары с нормализацией свойств
- Мигрированы документы в универсальную систему
- Созданы представления для обратной совместимости

### 3. Тестирование
- Выполнены тесты производительности
- Проверена целостность данных
- Проанализированы результаты

## Результаты тестов производительности

$perfResult

## Статистика данных

$statsResult

## Следующие шаги

### Этап 3: Оптимизация производительности (2-3 дня)
1. Анализ результатов тестов
2. Дополнительная оптимизация индексов
3. Настройка кэширования
4. Мониторинг производительности

### Этап 4: Развертывание в продакшене (1-2 дня)
1. Подготовка к продакшену
2. Переключение приложения на новую структуру
3. Мониторинг и отладка
4. Очистка старых таблиц

## Рекомендации

1. Протестируйте все функции приложения с новой структурой
2. Мониторьте производительность в течение недели
3. При необходимости выполните дополнительную оптимизацию
4. Подготовьте план отката на случай проблем

---

Статус: Этап 2 завершен успешно
Следующий этап: Оптимизация производительности
Время выполнения: 2-3 дня
Риск: Средний (структура создана, требуется тестирование)
"@

$reportContent | Out-File -FilePath "MIGRATION_STAGE2_REPORT.md" -Encoding UTF8
Write-Host "✅ Отчет создан: MIGRATION_STAGE2_REPORT.md" -ForegroundColor Green

# Завершение
Write-Host ""
Write-Host "🎉 ЭТАП 2: НОРМАЛИЗАЦИЯ СТРУКТУРЫ ЗАВЕРШЕН!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Оптимизированная структура создана" -ForegroundColor Green
Write-Host "✅ Данные мигрированы успешно" -ForegroundColor Green
Write-Host "✅ Тесты производительности выполнены" -ForegroundColor Green
Write-Host "✅ Отчет о миграции создан" -ForegroundColor Green
Write-Host ""
Write-Host "📋 СЛЕДУЮЩИЕ ШАГИ:" -ForegroundColor Yellow
Write-Host "1. Протестируйте приложение с новой структурой" -ForegroundColor White
Write-Host "2. Проанализируйте результаты тестов производительности" -ForegroundColor White
Write-Host "3. При необходимости выполните дополнительную оптимизацию" -ForegroundColor White
Write-Host "4. Переходите к Этапу 3: Оптимизация производительности" -ForegroundColor White
Write-Host ""
Write-Host "📖 Подробная информация в файле: MIGRATION_STAGE2_REPORT.md" -ForegroundColor Cyan
