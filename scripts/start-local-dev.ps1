# 🚀 Автоматический запуск всей локальной разработки
# Использование: .\scripts\start-local-dev.ps1

Write-Host "🚀 Запуск локальной разработки..." -ForegroundColor Green
Write-Host ""

# Проверяем, что мы в правильной директории
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Запустите скрипт из корня проекта" -ForegroundColor Red
    exit 1
}

# Проверяем .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Файл .env.local не найден!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Создайте .env.local со следующим содержимым:" -ForegroundColor Cyan
    Write-Host 'DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/domeo_staging?schema=public"' -ForegroundColor Gray
    Write-Host 'NEXTAUTH_SECRET="local-dev-secret"' -ForegroundColor Gray
    Write-Host 'NEXTAUTH_URL="http://localhost:3000"' -ForegroundColor Gray
    exit 1
}

# Проверяем SSH туннель
Write-Host "🔍 Проверяю SSH туннель..." -ForegroundColor Yellow
$tunnelActive = netstat -an | findstr ":5432" | findstr "LISTENING"
if (-not $tunnelActive) {
    Write-Host "⚠️  SSH туннель не запущен!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Запустите SSH туннель в отдельном терминале:" -ForegroundColor Cyan
    Write-Host "  npm run dev:tunnel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Или запустите вручную:" -ForegroundColor Cyan
    Write-Host "  ssh -L 5432:localhost:5432 ubuntu@130.193.40.35" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Продолжить запуск dev сервера без туннеля? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
} else {
    Write-Host "✅ SSH туннель активен" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Проверяю зависимости..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Устанавливаю зависимости..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🗄️ Генерирую Prisma клиент..." -ForegroundColor Yellow
npm run prisma:generate | Out-Null

Write-Host ""
Write-Host "🚀 Запускаю dev сервер..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Приложение будет доступно по адресу: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔥 Hot reload включен - изменения применяются мгновенно!" -ForegroundColor Cyan
Write-Host "🛑 Для остановки: Ctrl+C" -ForegroundColor Cyan
Write-Host ""

# Запускаем dev сервер
npm run dev

