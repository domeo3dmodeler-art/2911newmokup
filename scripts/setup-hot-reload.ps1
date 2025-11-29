# Скрипт для копирования docker-compose.staging-dev.yml на staging ВМ
# Использование: .\scripts\setup-hot-reload.ps1

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo-staging"
$SSH_KEY = "C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347"

Write-Host "🚀 Настройка Hot Reload на staging ВМ..." -ForegroundColor Cyan
Write-Host ""

# Проверка SSH подключения
Write-Host "🔍 Проверка SSH подключения..." -ForegroundColor Yellow
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ SSH ключ не найден: $SSH_KEY" -ForegroundColor Red
    Write-Host "   Используйте SSH без ключа или обновите путь" -ForegroundColor Yellow
    $useKey = $false
} else {
    $useKey = $true
}

# Проверка подключения
$testCmd = if ($useKey) { 
    "ssh -i $SSH_KEY -o ConnectTimeout=5 $STAGING_USER@$STAGING_HOST 'echo OK'" 
} else { 
    "ssh -o ConnectTimeout=5 $STAGING_USER@$STAGING_HOST 'echo OK'" 
}

try {
    $result = Invoke-Expression $testCmd 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Connection failed"
    }
    Write-Host "✅ SSH подключение работает" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка SSH подключения" -ForegroundColor Red
    Write-Host "   Проверьте доступ к $STAGING_HOST" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Создание директории на staging
Write-Host "📁 Создание директории на staging..." -ForegroundColor Yellow
$mkdirCmd = if ($useKey) {
    "ssh -i $SSH_KEY $STAGING_USER@$STAGING_HOST 'mkdir -p $STAGING_PATH'"
} else {
    "ssh $STAGING_USER@$STAGING_HOST 'mkdir -p $STAGING_PATH'"
}
Invoke-Expression $mkdirCmd | Out-Null
Write-Host "✅ Директория создана" -ForegroundColor Green
Write-Host ""

# Копирование docker-compose.staging-dev.yml
Write-Host "📤 Копирование docker-compose.staging-dev.yml..." -ForegroundColor Yellow
if (-not (Test-Path "docker-compose.staging-dev.yml")) {
    Write-Host "❌ Файл docker-compose.staging-dev.yml не найден!" -ForegroundColor Red
    exit 1
}

$scpCmd = if ($useKey) {
    scp -i "$SSH_KEY" docker-compose.staging-dev.yml "${STAGING_USER}@${STAGING_HOST}:${STAGING_PATH}/"
} else {
    scp docker-compose.staging-dev.yml "${STAGING_USER}@${STAGING_HOST}:${STAGING_PATH}/"
}
Invoke-Expression $scpCmd | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Файл скопирован" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка копирования файла" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Копирование скрипта синхронизации
Write-Host "📤 Копирование скрипта синхронизации..." -ForegroundColor Yellow
if (Test-Path "scripts\sync-to-staging.sh") {
    $scpScriptCmd = if ($useKey) {
        scp -i "$SSH_KEY" scripts\sync-to-staging.sh "${STAGING_USER}@${STAGING_HOST}:${STAGING_PATH}/scripts/"
    } else {
        scp scripts\sync-to-staging.sh "${STAGING_USER}@${STAGING_HOST}:${STAGING_PATH}/scripts/"
    }
    
    # Создаем директорию scripts на staging
    $mkdirScriptsCmd = if ($useKey) {
        "ssh -i $SSH_KEY $STAGING_USER@$STAGING_HOST 'mkdir -p $STAGING_PATH/scripts'"
    } else {
        "ssh $STAGING_USER@$STAGING_HOST 'mkdir -p $STAGING_PATH/scripts'"
    }
    Invoke-Expression $mkdirScriptsCmd | Out-Null
    
    Invoke-Expression $scpScriptCmd | Out-Null
    
    # Делаем скрипт исполняемым
    $chmodCmd = if ($useKey) {
        "ssh -i $SSH_KEY $STAGING_USER@$STAGING_HOST 'chmod +x $STAGING_PATH/scripts/sync-to-staging.sh'"
    } else {
        "ssh $STAGING_USER@$STAGING_HOST 'chmod +x $STAGING_PATH/scripts/sync-to-staging.sh'"
    }
    Invoke-Expression $chmodCmd | Out-Null
    
    Write-Host "✅ Скрипт синхронизации скопирован" -ForegroundColor Green
}
Write-Host ""

Write-Host "✅ Настройка завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. На staging ВМ выполните:" -ForegroundColor Yellow
Write-Host "   cd $STAGING_PATH" -ForegroundColor Gray
Write-Host "   docker compose -f docker-compose.staging-dev.yml up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "2. На локальной машине синхронизируйте код:" -ForegroundColor Yellow
Write-Host "   .\scripts\sync-to-staging.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Откройте в браузере:" -ForegroundColor Yellow
Write-Host "   http://130.193.40.35:3001" -ForegroundColor Gray
Write-Host ""

