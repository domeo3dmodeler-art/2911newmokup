# Запуск локальной разработки
# Использование: .\start-dev.ps1

Write-Host "🚀 Запуск локальной разработки Domeo..." -ForegroundColor Green
Write-Host ""

# Проверка .env.local
if (-not (Test-Path .env.local)) {
    Write-Host "⚠️  .env.local не найден, создаю..." -ForegroundColor Yellow
    @"
DATABASE_URL="postgresql://domeo:staging_password@localhost:5432/domeo_staging?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
NEXTAUTH_SECRET="local-dev-secret-change-in-production-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
LOG_LEVEL="debug"
"@ | Out-File -FilePath .env.local -Encoding utf8
    Write-Host "✅ .env.local создан" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Инструкция:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Терминал 1 - SSH туннель:" -ForegroundColor White
Write-Host "   npm run dev:tunnel" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Терминал 2 - Dev сервер:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Откройте браузер:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Или запустите автоматически:" -ForegroundColor Yellow
Write-Host "   npm run dev:start" -ForegroundColor Gray
Write-Host ""

