# 📊 PowerShell скрипт мониторинга обеих сред
# Использование: .\monitor-environments.ps1

param(
    [switch]$Detailed
)

Write-Host "📊 Мониторинг сред Domeo" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Настройки
$PRODUCTION_HOST = "130.193.40.35"
$PRODUCTION_PORT = "3000"
$STAGING_HOST = "130.193.40.35"
$STAGING_PORT = "3001"

# Функция проверки health check
function Test-Health {
    param($Host, $Port, $EnvName)
    
    Write-Host "🔍 Проверяем $EnvName ($Host`:$Port)..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://$Host`:$Port/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 204) {
            Write-Host "✅ $EnvName`: OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $EnvName`: FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $EnvName`: FAILED ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Функция проверки главной страницы
function Test-MainPage {
    param($Host, $Port, $EnvName)
    
    Write-Host "🌐 Проверяем главную страницу $EnvName..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://$Host`:$Port" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $EnvName главная страница: OK ($($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $EnvName главная страница: FAILED ($($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $EnvName главная страница: FAILED ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Функция проверки времени ответа
function Test-ResponseTime {
    param($Host, $Port, $EnvName)
    
    Write-Host "⏱️  Проверяем время ответа $EnvName..." -ForegroundColor Yellow
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "http://$Host`:$Port/api/health" -UseBasicParsing -TimeoutSec 10
        $stopwatch.Stop()
        
        $responseTimeMs = [math]::Round($stopwatch.ElapsedMilliseconds, 2)
        Write-Host "📈 $EnvName время ответа: ${responseTimeMs}ms" -ForegroundColor Cyan
        
        if ($responseTimeMs -lt 2000) {
            Write-Host "✅ $EnvName время ответа: OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  $EnvName время ответа: МЕДЛЕННО" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ $EnvName время ответа: FAILED ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Основная проверка
Write-Host ""
Write-Host "🚀 Начинаем мониторинг..." -ForegroundColor Cyan
Write-Host ""

# Проверяем Production
Write-Host "=== PRODUCTION ===" -ForegroundColor Magenta
$prodHealth = Test-Health $PRODUCTION_HOST $PRODUCTION_PORT "Production"
$prodPage = Test-MainPage $PRODUCTION_HOST $PRODUCTION_PORT "Production"
$prodTime = Test-ResponseTime $PRODUCTION_HOST $PRODUCTION_PORT "Production"

Write-Host ""

# Проверяем Staging
Write-Host "=== STAGING ===" -ForegroundColor Magenta
$stagingHealth = Test-Health $STAGING_HOST $STAGING_PORT "Staging"
$stagingPage = Test-MainPage $STAGING_HOST $STAGING_PORT "Staging"
$stagingTime = Test-ResponseTime $STAGING_HOST $STAGING_PORT "Staging"

Write-Host ""

# Итоговый отчет
Write-Host "📋 ИТОГОВЫЙ ОТЧЕТ" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# Production статус
if ($prodHealth -and $prodPage -and $prodTime) {
    Write-Host "✅ Production: ВСЕ ОК" -ForegroundColor Green
} else {
    Write-Host "❌ Production: ПРОБЛЕМЫ" -ForegroundColor Red
    if (-not $prodHealth) { Write-Host "   - Health check не работает" -ForegroundColor Red }
    if (-not $prodPage) { Write-Host "   - Главная страница недоступна" -ForegroundColor Red }
    if (-not $prodTime) { Write-Host "   - Медленный ответ" -ForegroundColor Red }
}

# Staging статус
if ($stagingHealth -and $stagingPage -and $stagingTime) {
    Write-Host "✅ Staging: ВСЕ ОК" -ForegroundColor Green
} else {
    Write-Host "❌ Staging: ПРОБЛЕМЫ" -ForegroundColor Red
    if (-not $stagingHealth) { Write-Host "   - Health check не работает" -ForegroundColor Red }
    if (-not $stagingPage) { Write-Host "   - Главная страница недоступна" -ForegroundColor Red }
    if (-not $stagingTime) { Write-Host "   - Медленный ответ" -ForegroundColor Red }
}

Write-Host ""

# Общий статус
$totalErrors = 0
if (-not $prodHealth) { $totalErrors++ }
if (-not $prodPage) { $totalErrors++ }
if (-not $prodTime) { $totalErrors++ }
if (-not $stagingHealth) { $totalErrors++ }
if (-not $stagingPage) { $totalErrors++ }
if (-not $stagingTime) { $totalErrors++ }

if ($totalErrors -eq 0) {
    Write-Host "🎉 ВСЕ СИСТЕМЫ РАБОТАЮТ НОРМАЛЬНО!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ ($totalErrors ошибок)" -ForegroundColor Yellow
    exit 1
}