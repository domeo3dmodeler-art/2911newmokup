# 🌿 Создание feature ветки для безопасной разработки (PowerShell)
# Использование: .\create-feature.ps1 feature-name

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureName
)

$FeatureBranch = "feature/$FeatureName"

Write-Host "🌿 Создание feature ветки: $FeatureBranch" -ForegroundColor Green

# Проверяем, что мы в Git репозитории
if (-not (Test-Path ".git")) {
    Write-Host "❌ Это не Git репозиторий. Запустите сначала .\init-git-workflow.ps1" -ForegroundColor Red
    exit 1
}

# Проверяем, что ветка develop существует
try {
    git show-ref --verify --quiet refs/heads/develop
    $developExists = $true
} catch {
    $developExists = $false
}

if (-not $developExists) {
    Write-Host "❌ Ветка develop не найдена. Запустите сначала .\init-git-workflow.ps1" -ForegroundColor Red
    exit 1
}

# Переключаемся на develop и обновляем
Write-Host "🔄 Обновляем develop ветку..." -ForegroundColor Yellow
git checkout develop
git pull origin develop

# Проверяем, что ветка не существует
try {
    git show-ref --verify --quiet refs/heads/$FeatureBranch
    $branchExists = $true
} catch {
    $branchExists = $false
}

if ($branchExists) {
    Write-Host "❌ Ветка $FeatureBranch уже существует" -ForegroundColor Red
    Write-Host "Переключиться на неё: git checkout $FeatureBranch" -ForegroundColor Yellow
    exit 1
}

# Создаем feature ветку
Write-Host "🌿 Создаем ветку $FeatureBranch..." -ForegroundColor Yellow
git checkout -b $FeatureBranch

Write-Host "✅ Feature ветка создана!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Теперь можете разрабатывать:" -ForegroundColor Cyan
Write-Host "  1. .\dev-safe.ps1  # Запуск локальной разработки" -ForegroundColor White
Write-Host "  2. Разрабатывайте новые функции" -ForegroundColor White
Write-Host "  3. git add . && git commit -m 'feat: description'" -ForegroundColor White
Write-Host "  4. git push origin $FeatureBranch" -ForegroundColor White
Write-Host "  5. Создайте Pull Request в GitHub" -ForegroundColor White
Write-Host ""
Write-Host "📋 После завершения разработки:" -ForegroundColor Cyan
Write-Host "  1. Создайте PR: $FeatureBranch → develop" -ForegroundColor White
Write-Host "  2. После мержа автоматически деплоится на staging" -ForegroundColor White
Write-Host "  3. Тестируйте на staging" -ForegroundColor White
Write-Host "  4. Если все ОК, мержите develop → main с тегом" -ForegroundColor White
