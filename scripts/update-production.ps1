# 🚀 PowerShell скрипт полного обновления production среды
# Использование: .\scripts\update-production.ps1

param(
    [switch]$SkipBackup,
    [switch]$Force
)

# Настройка цветов
$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
    throw $Message
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️ $Message" "Yellow"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️ $Message" "Cyan"
}

# Проверка наличия необходимых файлов
function Test-RequiredFiles {
    Write-Info "Проверяем наличие необходимых файлов..."
    
    $requiredFiles = @(
        "docker-compose.production.yml",
        "Dockerfile.production",
        "package.json"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Файл $file не найден!"
        }
    }
    
    Write-Success "Все необходимые файлы найдены"
}

# Создание бэкапа базы данных
function Backup-Database {
    if ($SkipBackup) {
        Write-Warning "Пропускаем создание бэкапа"
        return
    }
    
    Write-Info "Создаем бэкап базы данных..."
    
    $backupDir = "backups"
    $backupFile = "$backupDir\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    try {
        # Проверяем, запущена ли база данных
        $dbStatus = docker-compose -f docker-compose.production.yml ps db 2>$null
        if ($dbStatus -match "Up") {
            docker-compose -f docker-compose.production.yml exec -T db pg_dump -U postgres domeo | Out-File -FilePath $backupFile -Encoding UTF8
            Write-Success "Бэкап создан: $backupFile"
        } else {
            Write-Warning "База данных не запущена, пропускаем бэкап"
        }
    } catch {
        Write-Warning "Не удалось создать бэкап: $($_.Exception.Message)"
    }
}

# Остановка сервисов
function Stop-Services {
    Write-Info "Останавливаем production сервисы..."
    docker-compose -f docker-compose.production.yml down
    Write-Success "Сервисы остановлены"
}

# Обновление кода
function Update-Code {
    Write-Info "Обновляем код из репозитория..."
    
    # Проверяем наличие несохраненных изменений
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning "Обнаружены несохраненные изменения!"
        Write-Host $gitStatus
        if (-not $Force) {
            $response = Read-Host "Продолжить? (y/N)"
            if ($response -ne "y" -and $response -ne "Y") {
                Write-Error "Обновление отменено пользователем"
            }
        }
    }
    
    git pull origin main
    Write-Success "Код обновлен"
}

# Пересборка и запуск
function Rebuild-AndStart {
    Write-Info "Пересобираем и запускаем сервисы..."
    
    # Очистка старых образов
    docker system prune -f
    
    # Пересборка и запуск
    docker-compose -f docker-compose.production.yml up -d --build
    
    Write-Success "Сервисы пересобраны и запущены"
}

# Проверка работоспособности
function Test-Health {
    Write-Info "Проверяем работоспособность сервисов..."
    
    # Ждем запуска сервисов
    Start-Sleep -Seconds 10
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
            if ($response.StatusCode -eq 204) {
                Write-Success "Health check пройден"
                break
            }
        } catch {
            Write-Info "Попытка $attempt/$maxAttempts : сервис еще не готов..."
            Start-Sleep -Seconds 5
            $attempt++
        }
    }
    
    if ($attempt -gt $maxAttempts) {
        Write-Error "Сервис не отвечает после $maxAttempts попыток"
    }
    
    # Дополнительные проверки
    try {
        Invoke-WebRequest -Uri "http://localhost:3000/api/catalog/categories" -Method GET -TimeoutSec 5 | Out-Null
        Invoke-WebRequest -Uri "http://localhost:3000/api/catalog/products" -Method GET -TimeoutSec 5 | Out-Null
        Write-Success "Все API проверки пройдены"
    } catch {
        Write-Error "API проверки не пройдены: $($_.Exception.Message)"
    }
}

# Показать статус сервисов
function Show-Status {
    Write-Info "Статус сервисов:"
    docker-compose -f docker-compose.production.yml ps
    
    Write-Info "Использование ресурсов:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Основная функция
function Main {
    Write-ColorOutput "🚀 Запуск обновления production среды" "Magenta"
    
    Test-RequiredFiles
    Backup-Database
    Stop-Services
    Update-Code
    Rebuild-AndStart
    Test-Health
    Show-Status
    
    Write-Success "🎉 Обновление production среды завершено успешно!"
    Write-Success "🌐 Приложение доступно по адресу: http://localhost:3000"
}

# Запуск основной функции
try {
    Main
} catch {
    Write-Error "Произошла ошибка: $($_.Exception.Message)"
    exit 1
}
