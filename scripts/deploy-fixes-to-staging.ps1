# Безопасный деплой исправлений ТОЛЬКО на тестовую ВМ (staging)
# Production НЕ ТРОГАЕТ!
# Использование: .\scripts\deploy-fixes-to-staging.ps1

param(
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo"
$SSH_KEY = "C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347"

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "/tmp/domeo-backup-$TIMESTAMP"

Write-Host "🚀 Безопасный деплой исправлений на тестовую ВМ" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Проверка SSH ключа
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ ERROR: SSH ключ не найден: $SSH_KEY" -ForegroundColor Red
    exit 1
}

# Проверка подключения
Write-Host "🔍 Проверка подключения к тестовой ВМ..." -ForegroundColor Yellow
try {
    $test = ssh -i $SSH_KEY -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" "echo 'Connection OK'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Не удается подключиться"
    }
    Write-Host "✅ Подключение установлено" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Не удается подключиться к тестовой ВМ" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Проверка текущего состояния
Write-Host "📊 Проверка текущего состояния..." -ForegroundColor Yellow
$healthCheckCmd = "curl -s http://localhost:3001/api/health 2>&1 | head -1"
$healthCheck = ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $healthCheckCmd
if ($healthCheck -match "200|204|healthy") {
    Write-Host "✅ Health check: OK" -ForegroundColor Green
} else {
    Write-Host "⚠️  Health check: $healthCheck" -ForegroundColor Yellow
}
Write-Host ""

# Создание бэкапа (если не пропущен)
if (-not $SkipBackup) {
    Write-Host "💾 Создание бэкапа..." -ForegroundColor Yellow
    $backupCmd1 = "bash -c 'cd $STAGING_PATH ; mkdir -p $BACKUP_DIR'"
    ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $backupCmd1 | Out-Null
    $backupCmd2 = "bash -c 'cd $STAGING_PATH ; docker exec -e PGPASSWORD=staging_password domeo-staging-postgres pg_dump -U staging_user -d domeo_staging > $BACKUP_DIR/database_backup.sql 2>&1'"
    ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $backupCmd2 | Out-Null
    $backupCmd3 = "bash -c 'cd $STAGING_PATH ; git archive --format=tar.gz HEAD > $BACKUP_DIR/code_backup.tar.gz 2>&1'"
    ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $backupCmd3 | Out-Null
    Write-Host "✅ Бэкап создан в $BACKUP_DIR" -ForegroundColor Green
    Write-Host ""
}

# Деплой на тестовую ВМ
Write-Host "🚀 Деплой на тестовую ВМ..." -ForegroundColor Yellow
$currentBranch = git branch --show-current

# Получаем изменения из git
Write-Host "📥 Получение изменений из git..." -ForegroundColor Yellow
$fetchCmd = "bash -c 'cd $STAGING_PATH ; git fetch origin'"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $fetchCmd
$pullCmd1 = "bash -c 'cd $STAGING_PATH ; git pull origin develop 2>&1'"
$pullResult = ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $pullCmd1
if ($LASTEXITCODE -ne 0) {
    $pullCmd2 = "bash -c 'cd $STAGING_PATH ; git pull origin main 2>&1'"
    ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $pullCmd2 | Out-Null
}

# Пересобираем образ
Write-Host "🔨 Пересборка образа приложения..." -ForegroundColor Yellow
$buildCmd = "bash -c 'cd $STAGING_PATH ; docker compose build --no-cache app'"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $buildCmd | Select-Object -Last 10

# Перезапускаем сервисы
Write-Host "🔄 Перезапуск сервисов..." -ForegroundColor Yellow
$upCmd = "bash -c 'cd $STAGING_PATH ; docker compose up -d'"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $upCmd

# Ждем запуска
Write-Host "⏳ Ожидание запуска сервисов..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Проверка статуса
Write-Host "📊 Статус контейнеров:" -ForegroundColor Yellow
$psCmd = "cd $STAGING_PATH ; docker compose ps"
ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $psCmd

# Проверка health check
Write-Host "🏥 Проверка health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$healthCmd = "curl -f http://localhost:3001/api/health 2>&1"
$finalHealthCheck = ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" $healthCmd
if ($LASTEXITCODE -eq 0 -or $finalHealthCheck -match '200|204|healthy') {
    Write-Host "✅ Health check: OK" -ForegroundColor Green
} else {
    Write-Host "⚠️  Health check: $finalHealthCheck" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Готово!" -ForegroundColor Green
Write-Host "   Тестовая ВМ: http://$STAGING_HOST`:3001" -ForegroundColor Cyan
if (-not $SkipBackup) {
    Write-Host "   Backup: $BACKUP_DIR (на тестовой ВМ)" -ForegroundColor Gray
}
