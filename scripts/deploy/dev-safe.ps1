# 🏠 Безопасная локальная разработка (PowerShell)
# Использование: .\dev-safe.ps1

Write-Host "🏠 Запуск безопасной локальной разработки..." -ForegroundColor Green

# Проверяем, что мы в правильной директории
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Запустите скрипт из корня проекта" -ForegroundColor Red
    exit 1
}

# Проверяем Node.js
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js версия: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не установлен" -ForegroundColor Red
    exit 1
}

# Создаем бэкап текущего состояния (если нужно)
if (Test-Path ".env") {
    Write-Host "💾 Создаем бэкап .env файла..." -ForegroundColor Yellow
    $backupName = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item ".env" $backupName
}

# Устанавливаем зависимости
Write-Host "📦 Проверяем зависимости..." -ForegroundColor Yellow
npm install

# Генерируем Prisma клиент
Write-Host "🗄️ Генерируем Prisma клиент..." -ForegroundColor Yellow
npx prisma generate

# Применяем миграции (только для локальной разработки)
Write-Host "🔄 Применяем миграции..." -ForegroundColor Yellow
npx prisma db push

# Запускаем dev сервер
Write-Host "🚀 Запускаем dev сервер..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Приложение будет доступно по адресу: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📊 Prisma Studio: npx prisma studio" -ForegroundColor Cyan
Write-Host "🛑 Для остановки: Ctrl+C" -ForegroundColor Cyan
Write-Host ""

npm run dev
