# Скрипт для получения рабочего кода с тестовой ВМ через Git
# Использование: .\scripts\sync-from-staging-git.ps1

param(
    [string]$Branch = "develop",
    [switch]$Backup = $true
)

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📥 ПОЛУЧЕНИЕ КОДА С ТЕСТОВОЙ ВМ (GIT)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📡 Подключение к тестовой ВМ..." -ForegroundColor Yellow
Write-Host "   Host: $STAGING_HOST" -ForegroundColor Gray
Write-Host "   User: $STAGING_USER" -ForegroundColor Gray
Write-Host "   Remote Path: $STAGING_PATH" -ForegroundColor Gray
Write-Host "   Branch: $Branch`n" -ForegroundColor Gray

# Проверка SSH подключения
Write-Host "🔍 Проверка SSH подключения..." -ForegroundColor Yellow
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes $STAGING_USER@$STAGING_HOST "echo 'OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка SSH подключения к $STAGING_HOST" -ForegroundColor Red
    Write-Host "   Убедитесь, что SSH ключ настроен" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ SSH подключение установлено" -ForegroundColor Green

# Проверка существования git репозитория на сервере
Write-Host "`n🔍 Проверка git репозитория на сервере..." -ForegroundColor Yellow
$gitCheck = ssh $STAGING_USER@$STAGING_HOST "cd $STAGING_PATH; git rev-parse --git-dir 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git репозиторий не найден на сервере" -ForegroundColor Red
    Write-Host "   Используйте альтернативный скрипт: .\scripts\sync-from-staging.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Git репозиторий найден" -ForegroundColor Green

# Получение информации о репозитории
Write-Host "`n📋 Информация о репозитории на сервере:" -ForegroundColor Yellow
$remoteUrl = ssh $STAGING_USER@$STAGING_HOST "cd $STAGING_PATH; git config --get remote.origin.url 2>&1"
$currentBranch = ssh $STAGING_USER@$STAGING_HOST "cd $STAGING_PATH; git branch --show-current 2>&1"
$lastCommit = ssh $STAGING_USER@$STAGING_HOST "cd $STAGING_PATH; git log -1 --oneline 2>&1"

Write-Host "   Remote URL: $remoteUrl" -ForegroundColor Gray
Write-Host "   Current Branch: $currentBranch" -ForegroundColor Gray
Write-Host "   Last Commit: $lastCommit" -ForegroundColor Gray

# Создание бэкапа текущего кода
if ($Backup) {
    Write-Host "`n💾 Создание бэкапа текущего кода..." -ForegroundColor Yellow
    $backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    # Копируем важные файлы и директории
    $importantPaths = @(
        "app",
        "lib",
        "prisma",
        "package.json",
        "next.config.mjs",
        ".env.local"
    )
    
    foreach ($path in $importantPaths) {
        if (Test-Path $path) {
            $destPath = Join-Path $backupDir $path
            $parentDir = Split-Path $destPath -Parent
            if (-not (Test-Path $parentDir)) {
                New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
            }
            Copy-Item -Path $path -Destination $destPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host "✅ Бэкап создан: $backupDir" -ForegroundColor Green
}

# Проверка текущего git статуса локально
Write-Host "`n🔍 Проверка локального git репозитория..." -ForegroundColor Yellow
$localGitCheck = git rev-parse --git-dir 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Локальный git репозиторий не найден" -ForegroundColor Yellow
    Write-Host "   Инициализируем git репозиторий..." -ForegroundColor Gray
    git init
    git remote add origin $remoteUrl 2>&1 | Out-Null
}

# Получение кода с сервера
Write-Host "`n📥 Получение кода с сервера..." -ForegroundColor Yellow

# Вариант 1: Если есть доступ к удаленному репозиторию
if ($remoteUrl -match "github|gitlab|bitbucket") {
    Write-Host "   Используется удаленный репозиторий: $remoteUrl" -ForegroundColor Gray
    
    # Обновляем remote URL если нужно
    $currentRemote = git config --get remote.origin.url 2>&1
    if ($currentRemote -ne $remoteUrl) {
        if ($currentRemote) {
            git remote set-url origin $remoteUrl
        } else {
            git remote add origin $remoteUrl
        }
    }
    
    # Получаем код из удаленного репозитория
    Write-Host "   Получение изменений из $Branch..." -ForegroundColor Gray
    git fetch origin $Branch 2>&1 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    # Проверяем, есть ли локальные изменения
    $localChanges = git status --short 2>&1
    if ($localChanges) {
        Write-Host "`n⚠️  Обнаружены локальные изменения:" -ForegroundColor Yellow
        git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        Write-Host "`n💡 Создаю stash для сохранения изменений..." -ForegroundColor Yellow
        git stash push -m "Auto-stash before sync from staging $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" 2>&1 | Out-Null
        Write-Host "✅ Изменения сохранены в stash" -ForegroundColor Green
    }
    
    # Переключаемся на нужную ветку
    Write-Host "`n🔄 Переключение на ветку $Branch..." -ForegroundColor Yellow
    git checkout -B $Branch origin/$Branch 2>&1 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    Write-Host "✅ Код получен из удаленного репозитория" -ForegroundColor Green
} else {
    # Вариант 2: Прямое копирование с сервера через git bundle
    Write-Host "   Создание git bundle на сервере..." -ForegroundColor Gray
    $bundleFile = "staging_bundle_$(Get-Date -Format 'yyyyMMdd_HHmmss').bundle"
    
    ssh $STAGING_USER@$STAGING_HOST "cd $STAGING_PATH; git bundle create /tmp/$bundleFile $Branch 2>&1" | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка при создании bundle на сервере" -ForegroundColor Red
        exit 1
    }
    
    # Копируем bundle на локальную машину
    Write-Host "   Копирование bundle с сервера..." -ForegroundColor Gray
    scp "$STAGING_USER@${STAGING_HOST}:/tmp/$bundleFile" $bundleFile 2>&1 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка при копировании bundle" -ForegroundColor Red
        exit 1
    }
    
    # Импортируем bundle в локальный репозиторий
    Write-Host "   Импорт bundle в локальный репозиторий..." -ForegroundColor Gray
    git fetch $bundleFile $Branch 2>&1 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    # Переключаемся на ветку
    git checkout -B $Branch FETCH_HEAD 2>&1 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    # Удаляем bundle
    Remove-Item $bundleFile -Force -ErrorAction SilentlyContinue
    
    # Удаляем bundle с сервера
    ssh $STAGING_USER@$STAGING_HOST "rm -f /tmp/$bundleFile" 2>&1 | Out-Null
    
    Write-Host "✅ Код получен через git bundle" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ КОД УСПЕШНО ПОЛУЧЕН С ТЕСТОВОЙ ВМ" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📝 Следующие шаги:" -ForegroundColor Yellow
Write-Host "   1. Проверьте изменения: git status" -ForegroundColor Gray
Write-Host "   2. Установите зависимости: npm install" -ForegroundColor Gray
Write-Host "   3. Сгенерируйте Prisma клиент: npm run prisma:generate" -ForegroundColor Gray
Write-Host "   4. Примените миграции: npm run prisma:migrate" -ForegroundColor Gray
Write-Host "   5. Запустите сервер: npm run dev" -ForegroundColor Gray
Write-Host ""

