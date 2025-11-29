# Скрипт синхронизации кода для Hot Reload на staging
# Использование: .\scripts\sync-to-staging.ps1

param(
    [switch]$Watch = $false,
    [switch]$Force = $false
)

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo-staging"
$LOCAL_PATH = "C:\01_conf\0411"

# Пути для синхронизации (только код, без node_modules и .next)
$SYNC_PATHS = @(
    "app",
    "components",
    "lib",
    "public",
    "prisma",
    "scripts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tailwind.config.js",
    "next.config.mjs",
    "postcss.config.js"
)

Write-Host "🔄 Синхронизация кода с staging ВМ..." -ForegroundColor Cyan
Write-Host "   Host: $STAGING_HOST" -ForegroundColor Gray
Write-Host "   Path: $STAGING_PATH" -ForegroundColor Gray
Write-Host ""

# Проверка SSH подключения
Write-Host "🔍 Проверка SSH подключения..." -ForegroundColor Yellow
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes $STAGING_USER@$STAGING_HOST "echo 'OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка SSH подключения к $STAGING_HOST" -ForegroundColor Red
    Write-Host "   Убедитесь что SSH ключ настроен" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH подключение работает" -ForegroundColor Green
Write-Host ""

# Создание директории на staging если не существует
Write-Host "📁 Проверка директории на staging..." -ForegroundColor Yellow
ssh $STAGING_USER@$STAGING_HOST "mkdir -p $STAGING_PATH" 2>&1 | Out-Null
Write-Host "✅ Директория готова" -ForegroundColor Green
Write-Host ""

# Функция синхронизации через rsync
function Sync-Code {
    Write-Host "📤 Синхронизация файлов..." -ForegroundColor Cyan
    
    $excludePatterns = @(
        "--exclude=node_modules",
        "--exclude=.next",
        "--exclude=.git",
        "--exclude=.env.local",
        "--exclude=.env.staging",
        "--exclude=*.log",
        "--exclude=.DS_Store"
    )
    
    # Проверяем наличие rsync на staging
    $hasRsync = ssh $STAGING_USER@$STAGING_HOST "which rsync" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Используем rsync (быстрее)" -ForegroundColor Green
        
        # Используем rsync если доступен
        $rsyncCmd = "rsync -avz --delete $($excludePatterns -join ' ') `"$LOCAL_PATH/`" $STAGING_USER@$STAGING_HOST:$STAGING_PATH/"
        
        # Синхронизируем только нужные пути
        foreach ($path in $SYNC_PATHS) {
            $localPath = Join-Path $LOCAL_PATH $path
            if (Test-Path $localPath) {
                Write-Host "   → $path" -ForegroundColor Gray
                rsync -avz --delete $excludePatterns "$localPath" "$STAGING_USER@$STAGING_HOST:$STAGING_PATH/$path" 2>&1 | Out-Null
            }
        }
    } else {
        Write-Host "⚠️  rsync не найден, используем scp" -ForegroundColor Yellow
        
        # Используем scp для каждого пути
        foreach ($path in $SYNC_PATHS) {
            $localPath = Join-Path $LOCAL_PATH $path
            if (Test-Path $localPath) {
                Write-Host "   → $path" -ForegroundColor Gray
                
                # Создаем директорию на удаленном сервере
                $remoteDir = Split-Path -Path $path -Parent
                if ($remoteDir) {
                    ssh $STAGING_USER@$STAGING_HOST "mkdir -p $STAGING_PATH/$remoteDir" 2>&1 | Out-Null
                }
                
                # Копируем файл/директорию
                scp -r "$localPath" "$STAGING_USER@$STAGING_HOST:$STAGING_PATH/$path" 2>&1 | Out-Null
            }
        }
    }
    
    Write-Host "✅ Синхронизация завершена" -ForegroundColor Green
    Write-Host ""
}

# Функция перезапуска контейнера
function Restart-Container {
    Write-Host "🔄 Перезапуск контейнера..." -ForegroundColor Yellow
    
    ssh $STAGING_USER@$STAGING_HOST @"
        cd $STAGING_PATH
        docker compose -f docker-compose.staging-dev.yml restart staging-app
    "@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Контейнер перезапущен" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Контейнер может быть не запущен, попробуйте запустить вручную" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Основная логика
if ($Watch) {
    Write-Host "👀 Режим наблюдения включен (Ctrl+C для остановки)" -ForegroundColor Cyan
    Write-Host ""
    
    # Используем git для отслеживания изменений
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $LOCAL_PATH
    $watcher.IncludeSubdirectories = $true
    $watcher.Filter = "*.*"
    $watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::FileName
    
    $action = {
        $changedFile = $Event.SourceEventArgs.FullPath
        $relativePath = $changedFile.Replace($LOCAL_PATH, "").TrimStart("\")
        
        # Проверяем что файл в нужных путях
        $shouldSync = $false
        foreach ($syncPath in $SYNC_PATHS) {
            if ($relativePath.StartsWith($syncPath)) {
                $shouldSync = $true
                break
            }
        }
        
        # Игнорируем системные файлы
        if ($relativePath -match "node_modules|\.next|\.git|\.env") {
            return
        }
        
        if ($shouldSync) {
            Write-Host "📝 Изменен: $relativePath" -ForegroundColor Yellow
            Start-Sleep -Seconds 1  # Небольшая задержка для завершения записи
            
            # Синхронизируем только этот файл
            $localFile = Join-Path $LOCAL_PATH $relativePath
            if (Test-Path $localFile) {
                $remoteDir = Split-Path -Path $relativePath -Parent
                if ($remoteDir) {
                    ssh $STAGING_USER@$STAGING_HOST "mkdir -p $STAGING_PATH/$remoteDir" 2>&1 | Out-Null
                }
                scp "$localFile" "$STAGING_USER@$STAGING_HOST:$STAGING_PATH/$relativePath" 2>&1 | Out-Null
                Write-Host "   ✅ Синхронизировано" -ForegroundColor Green
            }
        }
    }
    
    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action | Out-Null
    
    $watcher.EnableRaisingEvents = $true
    
    Write-Host "✅ Наблюдение запущено. Изменения будут синхронизироваться автоматически." -ForegroundColor Green
    Write-Host "   Нажмите Ctrl+C для остановки" -ForegroundColor Gray
    Write-Host ""
    
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } finally {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
    }
} else {
    # Одноразовая синхронизация
    Sync-Code
    
    if ($Force) {
        Restart-Container
    } else {
        Write-Host "💡 Для перезапуска контейнера используйте: .\scripts\sync-to-staging.ps1 -Force" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Готово!" -ForegroundColor Green
Write-Host "   Staging: http://130.193.40.35:3001" -ForegroundColor Cyan

