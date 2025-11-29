# Скрипт для настройки тестовой базы данных (PowerShell)

Write-Host "🚀 Запуск PostgreSQL контейнера..." -ForegroundColor Cyan
docker-compose up -d db

Write-Host "⏳ Ожидание запуска БД (10 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📦 Генерация Prisma Client..." -ForegroundColor Cyan
npm run prisma:generate

Write-Host "🔄 Применение миграций..." -ForegroundColor Cyan
npm run prisma:migrate:deploy

Write-Host "✅ База данных готова для тестов!" -ForegroundColor Green
Write-Host ""
Write-Host "Теперь можно запустить тесты:" -ForegroundColor Yellow
Write-Host "  npm run test:e2e" -ForegroundColor Yellow

