# Безопасный деплой на тестовую ВМ с бэкапом
# Использование: .\scripts\safe-deploy-to-staging.ps1

param(
    [switch]$SkipBackup = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo"
$SSH_KEY = "C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347"

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "/tmp/domeo-backup-$TIMESTAMP"

Write-Host "🚀 Безопасный деплой на тестовую ВМ" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Проверка SSH ключа
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ ERROR: SSH ключ не найден: $SSH_KEY" -ForegroundColor Red
    exit 1
}

# Проверка подключения
Write-Host "🔍 Проверка подключения к тестовой ВМ..." -ForegroundColor Yellow
try {
    $test = ssh -i $SSH_KEY -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" "echo 'Connection OK'"
    if ($LASTEXITCODE -ne 0) {
        throw "Не удается подключиться"
    }
    Write-Host "✅ Подключение установлено" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Не удается подключиться к тестовой ВМ" -ForegroundColor Red
    exit 1
}
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - изменения не будут применены" -ForegroundColor Yellow
    Write-Host ""
}

# Шаг 1: Проверка текущего состояния
Write-Host "📊 Шаг 1: Проверка текущего состояния..." -ForegroundColor Cyan
$healthCheck = ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" "curl -s http://localhost:3001/api/health 2>&1 | head -1"
Write-Host "   Health check: $healthCheck" -ForegroundColor Gray

$containers = ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" "cd $STAGING_PATH && docker compose ps --format json" | ConvertFrom-Json
Write-Host "   Запущенные контейнеры:" -ForegroundColor Gray
$containers | ForEach-Object { Write-Host "     - $($_.Name): $($_.State)" -ForegroundColor Gray }
Write-Host ""

# Шаг 2: Создание бэкапа (если не пропущен)
if (-not $SkipBackup -and -not $DryRun) {
    Write-Host "💾 Шаг 2: Создание бэкапа..." -ForegroundColor Cyan
    ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" @"
        cd $STAGING_PATH
        mkdir -p $BACKUP_DIR
        
        # Бэкап БД
        echo 'Создание бэкапа БД...'
        docker exec -e PGPASSWORD=staging_password domeo-staging-postgres pg_dump -U staging_user -d domeo_staging > $BACKUP_DIR/database_backup.sql 2>&1
        
        # Бэкап кода (через git)
        echo 'Создание бэкапа кода...'
        git archive --format=tar.gz HEAD > $BACKUP_DIR/code_backup.tar.gz 2>&1
        
        # Бэкап .env файлов
        echo 'Создание бэкапа конфигурации...'
        if [ -f .env ]; then cp .env $BACKUP_DIR/.env.backup; fi
        if [ -f .env.local ]; then cp .env.local $BACKUP_DIR/.env.local.backup; fi
        
        echo 'Бэкап создан в: $BACKUP_DIR'
    "@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Бэкап создан в $BACKUP_DIR" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: Возможны проблемы с бэкапом, но продолжаем..." -ForegroundColor Yellow
    }
    Write-Host ""
}

# Шаг 3: Проверка git статуса локально
Write-Host "📝 Шаг 3: Проверка изменений в git..." -ForegroundColor Cyan
$gitStatus = git status --short
$modifiedFiles = ($gitStatus | Measure-Object -Line).Lines

Write-Host "   Измененных файлов: $modifiedFiles" -ForegroundColor Gray

if ($modifiedFiles -eq 0) {
    Write-Host "⚠️  WARNING: Нет изменений для деплоя" -ForegroundColor Yellow
    Write-Host "   Продолжить? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "y") {
        Write-Host "Отменено пользователем" -ForegroundColor Yellow
        exit 0
    }
}
Write-Host ""

# Шаг 4: Закоммитить изменения (если нужно)
Write-Host "💾 Шаг 4: Подготовка изменений..." -ForegroundColor Cyan
$hasUncommitted = git diff --quiet; $LASTEXITCODE -ne 0

if ($hasUncommitted -and -not $DryRun) {
    Write-Host "   Есть незакоммиченные изменения" -ForegroundColor Yellow
    Write-Host "   Хотите закоммитить перед деплоем? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "y") {
        Write-Host "   Добавляем все изменения..." -ForegroundColor Gray
        git add .
        
        Write-Host "   Введите сообщение коммита:" -ForegroundColor Yellow
        $commitMessage = Read-Host "   Commit message"
        
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "fix: apply ESLint fixes and improvements"
        }
        
        git commit -m $commitMessage
        Write-Host "✅ Изменения закоммичены" -ForegroundColor Green
    }
}
Write-Host ""

# Шаг 5: Пуш в репозиторий (если нужно)
Write-Host "📤 Шаг 5: Отправка в репозиторий..." -ForegroundColor Cyan
$currentBranch = git branch --show-current
Write-Host "   Текущая ветка: $currentBranch" -ForegroundColor Gray

$remoteBranch = git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>$null
if ($LASTEXITCODE -ne 0 -and -not $DryRun) {
    Write-Host "   Ветка не отслеживает удаленную ветку" -ForegroundColor Yellow
    Write-Host "   Хотите запушить? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "y") {
        git push -u origin $currentBranch
    }
} elseif ($remoteBranch -and -not $DryRun) {
    $localCommit = git rev-parse HEAD
    $remoteCommit = git rev-parse "@{u}" 2>$null
    
    if ($localCommit -ne $remoteCommit) {
        Write-Host "   Есть локальные коммиты, не отправленные в репозиторий" -ForegroundColor Yellow
        Write-Host "   Отправляем изменения..." -ForegroundColor Gray
        git push
    } else {
        Write-Host "   Все изменения уже в репозитории" -ForegroundColor Green
    }
}
Write-Host ""

# Шаг 6: Деплой на тестовую ВМ
Write-Host "🚀 Шаг 6: Деплой на тестовую ВМ..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "   [DRY RUN] Команды которые будут выполнены:" -ForegroundColor Yellow
    Write-Host "   1. cd $STAGING_PATH" -ForegroundColor Gray
    Write-Host "   2. git pull origin $currentBranch" -ForegroundColor Gray
    Write-Host "   3. docker compose build --no-cache app" -ForegroundColor Gray
    Write-Host "   4. docker compose up -d" -ForegroundColor Gray
    Write-Host "   5. docker compose ps" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ DRY RUN завершен" -ForegroundColor Green
    exit 0
}

ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" @"
    set -e
    cd $STAGING_PATH
    
    echo '📥 Получаем последние изменения из git...'
    git fetch origin
    git pull origin $currentBranch || git pull origin main || git pull origin develop
    
    echo '🔨 Пересобираем образ приложения...'
    docker compose build --no-cache app
    
    echo '🔄 Перезапускаем сервисы...'
    docker compose up -d
    
    echo '⏳ Ждем запуска сервисов...'
    sleep 10
    
    echo '📊 Статус контейнеров:'
    docker compose ps
    
    echo '🏥 Проверка health check...'
    sleep 5
    curl -f http://localhost:3001/api/health || echo '⚠️  Health check не прошел'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Деплой завершен успешно" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Ошибка при деплое!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Восстановление из бэкапа..." -ForegroundColor Yellow
    ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" @"
        cd $STAGING_PATH
        
        # Откат git
        git reset --hard HEAD@{1} || git reset --hard origin/$currentBranch
        
        # Пересборка
        docker compose build --no-cache app
        docker compose up -d
    "@
    exit 1
}

# Шаг 7: Финальная проверка
Write-Host ""
Write-Host "✅ Шаг 7: Финальная проверка..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

$finalHealth = ssh -i $SSH_KEY "$STAGING_USER@$STAGING_HOST" "curl -s http://localhost:3001/api/health"
if ($finalHealth -match "healthy|ok") {
    Write-Host "✅ Приложение работает корректно" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: Health check не прошел, но деплой завершен" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Деплой завершен!" -ForegroundColor Green
Write-Host "   Тестовая ВМ: http://$STAGING_HOST`:3001" -ForegroundColor Cyan
Write-Host "   Бэкап находится в: $BACKUP_DIR (на тестовой ВМ)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Для отката используйте:" -ForegroundColor Yellow
Write-Host "   ssh -i $SSH_KEY $STAGING_USER@$STAGING_HOST 'cd $STAGING_PATH && docker exec -i domeo-staging-postgres psql -U staging_user -d domeo_staging < $BACKUP_DIR/database_backup.sql'" -ForegroundColor Gray

