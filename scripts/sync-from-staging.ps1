# Скрипт для получения рабочего кода с тестовой ВМ (staging)
# Использование: .\scripts\sync-from-staging.ps1

param(
    [switch]$Backup = $true,
    [switch]$DryRun = $false
)

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo"
$LOCAL_PATH = "."

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📥 ПОЛУЧЕНИЕ КОДА С ТЕСТОВОЙ ВМ" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📡 Подключение к тестовой ВМ..." -ForegroundColor Yellow
Write-Host "   Host: $STAGING_HOST" -ForegroundColor Gray
Write-Host "   User: $STAGING_USER" -ForegroundColor Gray
Write-Host "   Remote Path: $STAGING_PATH" -ForegroundColor Gray
Write-Host "   Local Path: $LOCAL_PATH`n" -ForegroundColor Gray

# Проверка SSH подключения
Write-Host "🔍 Проверка SSH подключения..." -ForegroundColor Yellow
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes $STAGING_USER@$STAGING_HOST "echo 'OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка SSH подключения к $STAGING_HOST" -ForegroundColor Red
    Write-Host "   Убедитесь, что:" -ForegroundColor Yellow
    Write-Host "   1. SSH ключ настроен (ssh-keygen -t rsa)" -ForegroundColor Gray
    Write-Host "   2. Ключ добавлен на сервер (ssh-copy-id $STAGING_USER@$STAGING_HOST)" -ForegroundColor Gray
    Write-Host "   3. Сервер доступен" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ SSH подключение установлено" -ForegroundColor Green

# Проверка существования директории на сервере
Write-Host "`n🔍 Проверка существования директории на сервере..." -ForegroundColor Yellow
$dirCheck = ssh $STAGING_USER@$STAGING_HOST "if [ -d '$STAGING_PATH' ]; then echo 'EXISTS'; else echo 'NOT_FOUND'; fi" 2>&1
if ($dirCheck -notmatch "EXISTS") {
    Write-Host "❌ Директория $STAGING_PATH не найдена на сервере" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Директория найдена" -ForegroundColor Green

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

if ($DryRun) {
    Write-Host "`n🔍 DRY RUN - показываю, что будет скопировано..." -ForegroundColor Yellow
    Write-Host "`n📋 Список файлов на сервере:" -ForegroundColor Cyan
    ssh $STAGING_USER@$STAGING_HOST "cd $STAGING_PATH; find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.json' \) | head -20" 2>&1
    Write-Host "`n⚠️  Это был DRY RUN. Для реального копирования запустите без --DryRun" -ForegroundColor Yellow
    exit 0
}

# Получение кода с сервера
Write-Host "`n📥 Получение кода с сервера..." -ForegroundColor Yellow

# Создаем временную директорию для rsync
$tempDir = "temp_sync_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    # Используем rsync для синхронизации (если доступен) или scp
    $rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue
    
    if ($rsyncAvailable) {
        Write-Host "   Используется rsync..." -ForegroundColor Gray
        # Исключаем node_modules, .next, и другие ненужные директории
        $excludePatterns = @(
            "--exclude=node_modules",
            "--exclude=.next",
            "--exclude=.git",
            "--exclude=*.log",
            "--exclude=.env",
            "--exclude=backup_*",
            "--exclude=temp_sync_*"
        )
        
        $rsyncArgs = @(
            "-avz",
            "--progress"
        ) + $excludePatterns + @(
            "$STAGING_USER@${STAGING_HOST}:$STAGING_PATH/",
            "$tempDir/"
        )
        
        & rsync $rsyncArgs 2>&1 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    } else {
        Write-Host "   Используется scp..." -ForegroundColor Gray
        # Используем scp для копирования
        scp -r "$STAGING_USER@${STAGING_HOST}:$STAGING_PATH/*" $tempDir/ 2>&1 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка при получении кода с сервера" -ForegroundColor Red
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    Write-Host "✅ Код получен с сервера" -ForegroundColor Green
    
    # Копируем файлы в текущую директорию
    Write-Host "`n📋 Копирование файлов в текущую директорию..." -ForegroundColor Yellow
    
    # Исключаем определенные файлы и директории
    $excludeItems = @(
        "node_modules",
        ".next",
        ".git",
        "*.log",
        ".env",
        "backup_*",
        "temp_sync_*",
        "prisma/dev.db*"
    )
    
    Get-ChildItem -Path $tempDir -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($tempDir.Length + 1)
        $shouldExclude = $false
        
        foreach ($exclude in $excludeItems) {
            if ($relativePath -like $exclude -or $relativePath -match [regex]::Escape($exclude)) {
                $shouldExclude = $true
                break
            }
        }
        
        if (-not $shouldExclude) {
            $destPath = Join-Path $LOCAL_PATH $relativePath
            $parentDir = Split-Path $destPath -Parent
            
            if (-not (Test-Path $parentDir)) {
                New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
            }
            
            if ($_.PSIsContainer) {
                if (-not (Test-Path $destPath)) {
                    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
                }
            } else {
                Copy-Item -Path $_.FullName -Destination $destPath -Force
            }
        }
    }
    
    Write-Host "✅ Файлы скопированы" -ForegroundColor Green
    
    # Очистка временной директории
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Ошибка: $_" -ForegroundColor Red
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
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

