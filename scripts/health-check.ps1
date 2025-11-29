# 🔍 PowerShell скрипт проверки работоспособности всех сервисов
# Использование: .\scripts\health-check.ps1

param(
    [switch]$GenerateReport,
    [string]$ReportPath = "health-report-$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
)

# Настройка
$ErrorActionPreference = "Continue"

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
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️ $Message" "Yellow"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️ $Message" "Cyan"
}

# Проверка доступности сервиса
function Test-Service {
    param(
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 10
    )
    
    Write-Info "Проверяем $Name : $Url"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds
        Write-Success "$Name - OK (Status: $($response.StatusCode))"
        return $true
    } catch {
        Write-Error "$Name - FAILED: $($_.Exception.Message)"
        return $false
    }
}

# Проверка Docker контейнеров
function Test-Containers {
    Write-Info "Проверяем статус Docker контейнеров..."
    
    try {
        if (Test-Path "docker-compose.production.yml") {
            $containers = docker-compose -f docker-compose.production.yml ps
            if ($containers) {
                $running = ($containers | Select-String "Up").Count
                $total = ($containers | Select-String "domeo").Count
                
                if ($running -eq $total -and $total -gt 0) {
                    Write-Success "Все контейнеры запущены ($running/$total)"
                } else {
                    Write-Error "Не все контейнеры запущены ($running/$total)"
                }
            } else {
                Write-Warning "Контейнеры не найдены"
            }
        } else {
            Write-Warning "docker-compose.production.yml не найден"
        }
    } catch {
        Write-Warning "Не удалось проверить контейнеры: $($_.Exception.Message)"
    }
}

# Проверка использования ресурсов
function Test-Resources {
    Write-Info "Проверяем использование ресурсов..."
    
    try {
        $stats = docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemUsage}}" 2>$null
        if ($stats) {
            $stats | ForEach-Object {
                $parts = $_ -split ","
                if ($parts.Count -ge 3) {
                    $container = $parts[0]
                    $cpu = $parts[1] -replace "%", ""
                    $memory = $parts[2] -split "/" | Select-Object -First 1
                    
                    Write-Info "📊 $container - CPU: ${cpu}%, Memory: $memory"
                    
                    # Проверка критических значений
                    if ([double]$cpu -gt 90) {
                        Write-Warning "⚠️ Высокое использование CPU у $container : ${cpu}%"
                    }
                    
                    if ($memory -match "MiB" -and [double]($memory -replace "MiB", "") -gt 1000) {
                        Write-Warning "⚠️ Высокое использование памяти у $container : $memory"
                    }
                }
            }
        } else {
            Write-Warning "Статистика Docker недоступна"
        }
    } catch {
        Write-Warning "Не удалось получить статистику: $($_.Exception.Message)"
    }
}

# Проверка базы данных
function Test-Database {
    Write-Info "Проверяем подключение к базе данных..."
    
    try {
        if (Test-Path "package.json") {
            $packageContent = Get-Content "package.json" -Raw
            if ($packageContent -match "prisma") {
                # Проверяем через API
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
                if ($response.StatusCode -eq 204) {
                    Write-Success "База данных подключена"
                } else {
                    Write-Error "Проблемы с подключением к базе данных"
                }
            } else {
                Write-Warning "Prisma не настроен"
            }
        } else {
            Write-Warning "package.json не найден"
        }
    } catch {
        Write-Warning "Не удалось проверить базу данных: $($_.Exception.Message)"
    }
}

# Проверка основных API endpoints
function Test-ApiEndpoints {
    Write-Info "Проверяем основные API endpoints..."
    
    $baseUrl = "http://localhost:3000"
    $endpoints = @(
        @{Url="/api/health"; Name="Health API"},
        @{Url="/api/catalog/categories"; Name="Catalog API"},
        @{Url="/api/catalog/products"; Name="Products API"},
        @{Url="/api/users"; Name="Users API"}
    )
    
    $allPassed = $true
    foreach ($endpoint in $endpoints) {
        if (-not (Test-Service "$baseUrl$($endpoint.Url)" $endpoint.Name 5)) {
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Success "Все API endpoints работают"
    } else {
        Write-Error "Некоторые API endpoints не работают"
    }
}

# Проверка веб-интерфейса
function Test-WebInterface {
    Write-Info "Проверяем веб-интерфейс..."
    
    $pages = @(
        @{Url="/"; Name="Главная страница"},
        @{Url="/dashboard"; Name="Dashboard"},
        @{Url="/catalog"; Name="Каталог"}
    )
    
    $allPassed = $true
    foreach ($page in $pages) {
        if (-not (Test-Service "http://localhost:3000$($page.Url)" $page.Name 10)) {
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Success "Все страницы веб-интерфейса доступны"
    } else {
        Write-Warning "Некоторые страницы недоступны"
    }
}

# Проверка логов на ошибки
function Test-Logs {
    Write-Info "Проверяем логи на критические ошибки..."
    
    try {
        if (Test-Path "docker-compose.production.yml") {
            $logs = docker-compose -f docker-compose.production.yml logs --tail=100 2>$null
            if ($logs) {
                $errorCount = ($logs | Select-String -Pattern "error|exception|fatal" -CaseSensitive:$false).Count
                
                if ($errorCount -gt 0) {
                    Write-Warning "⚠️ Найдено $errorCount ошибок в логах"
                    $logs | Select-String -Pattern "error|exception|fatal" -CaseSensitive:$false | Select-Object -First 5
                } else {
                    Write-Success "Критических ошибок в логах не найдено"
                }
            } else {
                Write-Warning "Логи недоступны"
            }
        } else {
            Write-Warning "docker-compose.production.yml не найден"
        }
    } catch {
        Write-Warning "Не удалось проверить логи: $($_.Exception.Message)"
    }
}

# Генерация отчета
function New-HealthReport {
    param([string]$ReportPath)
    
    Write-Info "Генерируем отчет: $ReportPath"
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $report = @"
=== ОТЧЕТ О РАБОТОСПОСОБНОСТИ СИСТЕМЫ ===
Дата: $timestamp
==========================================

=== СТАТУС КОНТЕЙНЕРОВ ===
$(docker-compose -f docker-compose.production.yml ps 2>$null)

=== ИСПОЛЬЗОВАНИЕ РЕСУРСОВ ===
$(docker stats --no-stream 2>$null)

=== ПОСЛЕДНИЕ ЛОГИ ===
$(docker-compose -f docker-compose.production.yml logs --tail=50 2>$null)

"@
    
    $report | Out-File -FilePath $ReportPath -Encoding UTF8
    Write-Success "📄 Отчет сохранен: $ReportPath"
}

# Основная функция
function Main {
    Write-ColorOutput "🔍 Запуск проверки работоспособности системы" "Magenta"
    Write-Host ""
    
    Test-Containers
    Write-Host ""
    
    Test-Resources
    Write-Host ""
    
    Test-Database
    Write-Host ""
    
    Test-ApiEndpoints
    Write-Host ""
    
    Test-WebInterface
    Write-Host ""
    
    Test-Logs
    Write-Host ""
    
    if ($GenerateReport) {
        New-HealthReport $ReportPath
        Write-Host ""
    }
    
    Write-Success "🎉 Все проверки завершены!"
    Write-Success "🌐 Система работает корректно"
}

# Запуск основной функции
Main
