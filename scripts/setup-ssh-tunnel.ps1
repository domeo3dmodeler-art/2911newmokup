# Скрипт для создания SSH туннеля к staging БД
# Использование: .\scripts\setup-ssh-tunnel.ps1

Write-Host "Setting up SSH tunnel to staging database" -ForegroundColor Cyan
Write-Host ""

# Настройки
$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PORT = "5432"
$LOCAL_PORT = "5432"
$SSH_KEY = "C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347"

# Проверяем наличие SSH ключа
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "ERROR: SSH key not found at $SSH_KEY" -ForegroundColor Red
    Write-Host "Please check the path to your SSH key" -ForegroundColor Yellow
    exit 1
}

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  - Staging host: $STAGING_HOST" -ForegroundColor Gray
Write-Host "  - SSH key: $SSH_KEY" -ForegroundColor Gray
Write-Host "  - Local port: $LOCAL_PORT -> Remote port: $STAGING_PORT" -ForegroundColor Gray
Write-Host ""

# Проверяем, не занят ли локальный порт
$portInUse = Get-NetTCPConnection -LocalPort $LOCAL_PORT -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "WARNING: Port $LOCAL_PORT is already in use" -ForegroundColor Yellow
    Write-Host "You may already have an SSH tunnel running" -ForegroundColor Gray
    Write-Host ""
    $response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($response -ne "y") {
        exit 0
    }
}

Write-Host "Starting SSH tunnel..." -ForegroundColor Cyan
Write-Host "Note: Keep this terminal open while using the tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "To use the database, set in .env.local:" -ForegroundColor Green
Write-Host '  DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/domeo_staging"' -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

# Создаем SSH туннель
ssh -L ${LOCAL_PORT}:localhost:${STAGING_PORT} -i "$SSH_KEY" -N ${STAGING_USER}@${STAGING_HOST}

