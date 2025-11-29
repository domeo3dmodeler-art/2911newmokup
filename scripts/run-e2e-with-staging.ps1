# Скрипт для запуска E2E тестов с staging БД
# Использование: .\scripts\run-e2e-with-staging.ps1

Write-Host "E2E Tests with Staging Database" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Настройки
$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PORT = "5432"
$LOCAL_PORT = "5432"
$SSH_KEY = "C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347"
$DATABASE_URL = "postgresql://staging_user:staging_password@localhost:5432/domeo_staging"

# Шаг 1: Проверка SSH ключа
Write-Host "Step 1: Checking SSH key..." -ForegroundColor Yellow
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "ERROR: SSH key not found at $SSH_KEY" -ForegroundColor Red
    exit 1
}
Write-Host "OK: SSH key found" -ForegroundColor Green
Write-Host ""

# Шаг 2: Проверка доступности staging сервера
Write-Host "Step 2: Checking staging server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${STAGING_HOST}:3001/api/health" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 204) {
        Write-Host "OK: Staging server is available" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Staging server returned status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Staging server is not available: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check network connectivity" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Шаг 3: Проверка SSH туннеля
Write-Host "Step 3: Checking SSH tunnel..." -ForegroundColor Yellow
$tunnelProcess = Get-Process | Where-Object { $_.ProcessName -eq "ssh" -and $_.CommandLine -like "*5432*" } | Select-Object -First 1
$portInUse = Get-NetTCPConnection -LocalPort $LOCAL_PORT -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "OK: Port $LOCAL_PORT is in use (SSH tunnel may be running)" -ForegroundColor Green
} else {
    Write-Host "WARNING: Port $LOCAL_PORT is not in use" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To set up SSH tunnel, run in a separate terminal:" -ForegroundColor Cyan
    Write-Host "  npm run test:e2e:tunnel" -ForegroundColor Gray
    Write-Host "  OR" -ForegroundColor Gray
    Write-Host "  ssh -L ${LOCAL_PORT}:localhost:${STAGING_PORT} -i `"$SSH_KEY`" ${STAGING_USER}@${STAGING_HOST} -N" -ForegroundColor Gray
    Write-Host ""
    $response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($response -ne "y") {
        exit 0
    }
}
Write-Host ""

# Шаг 4: Настройка .env.local
Write-Host "Step 4: Configuring .env.local..." -ForegroundColor Yellow
$envLocalPath = ".env.local"

if (Test-Path $envLocalPath) {
    $envContent = Get-Content $envLocalPath -Raw
    
    # Проверяем, есть ли уже DATABASE_URL
    if ($envContent -match "DATABASE_URL") {
        Write-Host "INFO: DATABASE_URL already exists in .env.local" -ForegroundColor Gray
        $update = Read-Host "Do you want to update it? (y/n)"
        if ($update -eq "y") {
            $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=`"$DATABASE_URL`""
            $envContent | Set-Content $envLocalPath -NoNewline
            Write-Host "OK: DATABASE_URL updated" -ForegroundColor Green
        }
    } else {
        # Добавляем DATABASE_URL
        Add-Content -Path $envLocalPath -Value "`nDATABASE_URL=`"$DATABASE_URL`""
        Write-Host "OK: DATABASE_URL added to .env.local" -ForegroundColor Green
    }
} else {
    # Создаем .env.local
    "DATABASE_URL=`"$DATABASE_URL`"" | Set-Content $envLocalPath
    Write-Host "OK: Created .env.local with DATABASE_URL" -ForegroundColor Green
}
Write-Host ""

# Шаг 5: Проверка подключения к БД
Write-Host "Step 5: Testing database connection..." -ForegroundColor Yellow
Write-Host "Generating Prisma client..." -ForegroundColor Gray
$env:DATABASE_URL = $DATABASE_URL
$prismaGen = npm run prisma:generate 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "WARNING: Prisma client generation failed" -ForegroundColor Yellow
    Write-Host $prismaGen -ForegroundColor Gray
}
Write-Host ""

# Шаг 6: Запуск тестов
Write-Host "Step 6: Running E2E tests..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Setting DATABASE_URL environment variable..." -ForegroundColor Gray
$env:DATABASE_URL = $DATABASE_URL

Write-Host "Starting Playwright tests..." -ForegroundColor Cyan
npm run test:e2e

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Tests completed!" -ForegroundColor Cyan

