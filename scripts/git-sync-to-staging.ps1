# Скрипт синхронизации через Git для Hot Reload
# Использование: .\scripts\git-sync-to-staging.ps1 [commit-message]

param(
    [string]$Message = "Auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    [switch]$NoCommit = $false,
    [switch]$NoPush = $false
)

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo"
$BRANCH = "develop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔄 СИНХРОНИЗАЦИЯ ЧЕРЕЗ GIT" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Проверка статуса git
Write-Host "📊 Проверка статуса Git..." -ForegroundColor Yellow
$status = git status --short 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка: это не git репозиторий" -ForegroundColor Red
    exit 1
}

if ($status -and -not $NoCommit) {
    Write-Host "📝 Обнаружены изменения:" -ForegroundColor Cyan
    git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host ""
    
    # Добавляем все изменения
    Write-Host "➕ Добавление изменений..." -ForegroundColor Yellow
    git add -A
    
    # Коммит
    Write-Host "💾 Создание коммита..." -ForegroundColor Yellow
    git commit -m $Message
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка при создании коммита" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Коммит создан: $Message" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Нет изменений для коммита" -ForegroundColor Gray
}

# Push на GitHub
if (-not $NoPush) {
    Write-Host "`n📤 Отправка на GitHub ($BRANCH)..." -ForegroundColor Yellow
    git push origin $BRANCH
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка при отправке на GitHub" -ForegroundColor Red
        Write-Host "   Попробуйте: git push origin $BRANCH" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Код отправлен на GitHub" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Пропущена отправка на GitHub (--NoPush)" -ForegroundColor Gray
}

# Обновление на staging ВМ
Write-Host "`n🔄 Обновление кода на staging ВМ..." -ForegroundColor Yellow
Write-Host "   Host: $STAGING_HOST" -ForegroundColor Gray
Write-Host "   Path: $STAGING_PATH" -ForegroundColor Gray
Write-Host "   Branch: $BRANCH`n" -ForegroundColor Gray

# Проверка SSH подключения
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes $STAGING_USER@$STAGING_HOST "echo 'OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка SSH подключения к $STAGING_HOST" -ForegroundColor Red
    exit 1
}

# Выполняем git pull на staging
Write-Host "📥 Обновление кода на ВМ (git pull)..." -ForegroundColor Yellow
$pullResult = ssh $STAGING_USER@$STAGING_HOST "cd $STAGING_PATH && git fetch origin && git pull origin $BRANCH 2>&1"
Write-Host $pullResult

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Код обновлен на ВМ" -ForegroundColor Green
    
    # Перезапускаем контейнер для применения изменений
    Write-Host "`n🔄 Перезапуск контейнера для применения изменений..." -ForegroundColor Yellow
    ssh $STAGING_USER@$STAGING_HOST "cd $STAGING_PATH && docker compose -f docker-compose.staging-dev.yml restart staging-app" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Контейнер перезапущен" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Ошибка при перезапуске контейнера" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Ошибка при обновлении кода на ВМ" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "🌐 Staging URL: http://$STAGING_HOST`:3001" -ForegroundColor Cyan
Write-Host ""

