# 🚀 Автоматический запуск SSH туннеля для локальной разработки
# Использование: .\scripts\start-ssh-tunnel.ps1

Write-Host "🔐 Запуск SSH туннеля к staging БД..." -ForegroundColor Green

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$LOCAL_PORT = "5432"
$REMOTE_PORT = "5432"

# Проверяем, не занят ли локальный порт
$portInUse = Get-NetTCPConnection -LocalPort $LOCAL_PORT -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Порт $LOCAL_PORT уже занят!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Возможно, SSH туннель уже запущен в другом терминале." -ForegroundColor Gray
    Write-Host "Проверьте активные подключения:" -ForegroundColor Gray
    Write-Host "  netstat -an | findstr $LOCAL_PORT" -ForegroundColor Cyan
    Write-Host ""
    $response = Read-Host "Продолжить и переподключиться? (y/n)"
    if ($response -ne "y") {
        exit 0
    }
}

Write-Host ""
Write-Host "📋 Конфигурация:" -ForegroundColor Cyan
Write-Host "  - Staging host: $STAGING_HOST" -ForegroundColor Gray
Write-Host "  - Локальный порт: $LOCAL_PORT -> Удаленный порт: $REMOTE_PORT" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ SSH туннель будет создан:" -ForegroundColor Green
Write-Host "   localhost:$LOCAL_PORT -> $STAGING_HOST:$REMOTE_PORT" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 После создания туннеля используйте в .env.local:" -ForegroundColor Yellow
Write-Host '   DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/domeo_staging?schema=public"' -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Оставьте этот терминал открытым!" -ForegroundColor Yellow
Write-Host "   Туннель работает пока терминал открыт" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 Для остановки: Ctrl+C" -ForegroundColor Red
Write-Host ""
Write-Host "🔗 Устанавливаю SSH туннель..." -ForegroundColor Green
Write-Host ""

# Создаем SSH туннель
ssh -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} -N ${STAGING_USER}@${STAGING_HOST}

