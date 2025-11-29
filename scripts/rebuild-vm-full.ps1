# Полная пересборка образа и перезапуск контейнеров на ВМ
# Использование: .\scripts\rebuild-vm-full.ps1

$ErrorActionPreference = "Stop"

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo"
$SSH_KEY = "C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347"

Write-Host "🚀 Полная пересборка образа и перезапуск контейнеров на ВМ" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

# Проверка SSH ключа
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ ERROR: SSH ключ не найден: $SSH_KEY" -ForegroundColor Red
    exit 1
}

# Проверка подключения
Write-Host "🔍 Проверка подключения к ВМ..." -ForegroundColor Yellow
try {
    $test = ssh -i $SSH_KEY -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" "echo 'Connection OK'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Не удается подключиться"
    }
    Write-Host "✅ Подключение установлено" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Не удается подключиться к ВМ" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Шаг 1: Синхронизация кода через git
Write-Host "📥 Шаг 1: Синхронизация кода через git..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Текущая ветка: $currentBranch" -ForegroundColor Gray

# Push локальных изменений
Write-Host "   Push локальных изменений..." -ForegroundColor Gray
git push origin $currentBranch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Предупреждение: Не удалось выполнить git push" -ForegroundColor Yellow
}

# Pull на ВМ
Write-Host "   Pull изменений на ВМ..." -ForegroundColor Gray
$pullCmd = "bash -c 'cd $STAGING_PATH && git fetch origin && git pull origin $currentBranch 2>&1'"
$pullResult = ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $pullCmd
Write-Host "   $pullResult" -ForegroundColor Gray
Write-Host "✅ Код синхронизирован" -ForegroundColor Green
Write-Host ""

# Шаг 2: Остановка всех контейнеров
Write-Host "🛑 Шаг 2: Остановка всех контейнеров..." -ForegroundColor Yellow
$downCmd = "bash -c 'cd $STAGING_PATH && docker compose -f docker-compose.staging.yml down'"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $downCmd | Out-Null
Write-Host "✅ Контейнеры остановлены" -ForegroundColor Green
Write-Host ""

# Шаг 3: Удаление старых образов (опционально)
Write-Host "🗑️  Шаг 3: Очистка старых образов..." -ForegroundColor Yellow
$pruneCmd = "bash -c 'docker image prune -f'"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $pruneCmd | Out-Null
Write-Host "✅ Старые образы очищены" -ForegroundColor Green
Write-Host ""

# Шаг 4: Полная пересборка образа
Write-Host "🔨 Шаг 4: Полная пересборка образа (это может занять 5-15 минут)..." -ForegroundColor Yellow
$buildCmd = "bash -c 'cd $STAGING_PATH && docker compose -f docker-compose.staging.yml build --no-cache staging-app'"
Write-Host "   Выполняется пересборка..." -ForegroundColor Gray
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $buildCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Ошибка при пересборке образа" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Образ пересобран" -ForegroundColor Green
Write-Host ""

# Шаг 5: Запуск всех контейнеров
Write-Host "🚀 Шаг 5: Запуск всех контейнеров..." -ForegroundColor Yellow
$upCmd = "bash -c 'cd $STAGING_PATH && docker compose -f docker-compose.staging.yml up -d'"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $upCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Ошибка при запуске контейнеров" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Контейнеры запущены" -ForegroundColor Green
Write-Host ""

# Шаг 6: Ожидание запуска
Write-Host "⏳ Шаг 6: Ожидание запуска сервисов (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host ""

# Шаг 7: Проверка статуса
Write-Host "📊 Шаг 7: Проверка статуса контейнеров..." -ForegroundColor Yellow
$psCmd = "bash -c 'cd $STAGING_PATH && docker compose -f docker-compose.staging.yml ps'"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $psCmd
Write-Host ""

# Шаг 8: Проверка логов
Write-Host "📋 Шаг 8: Последние строки логов приложения..." -ForegroundColor Yellow
$logsCmd = "bash -c 'docker logs --tail 20 domeo-staging-app 2>&1'"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $logsCmd
Write-Host ""

# Шаг 9: Health check
Write-Host "🏥 Шаг 9: Проверка health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$healthCmd = "bash -c 'curl -f -s http://localhost:3001/api/health 2>&1 || echo Health check failed'"
$healthResult = ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $healthCmd
if ($healthResult -match '200|204|healthy|OK') {
    Write-Host "✅ Health check: OK" -ForegroundColor Green
} else {
    Write-Host "⚠️  Health check: $healthResult" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "🎉 Готово!" -ForegroundColor Green
Write-Host "   ВМ: http://${STAGING_HOST}:3001" -ForegroundColor Cyan
Write-Host ""

