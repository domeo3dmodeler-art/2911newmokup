# 🔄 PowerShell скрипт для синхронизации данных между Production и Staging
# Использование: .\sync-data-between-environments.ps1 <source_env> <target_env>
# Пример: .\sync-data-between-environments.ps1 production staging

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceEnv,
    
    [Parameter(Mandatory=$true)]
    [string]$TargetEnv
)

Write-Host "🔄 Синхронизация данных из $SourceEnv в $TargetEnv..." -ForegroundColor Cyan

# Настройки Production
$PROD_HOST = "130.193.40.35"
$PROD_USER = "ubuntu"
$PROD_PATH = "/opt/domeo"
$PROD_KEY = "production_key"

# Настройки Staging
$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo"
$STAGING_KEY = "staging_key"

# Определяем исходные и целевые параметры
if ($SourceEnv -eq "production" -and $TargetEnv -eq "staging") {
    $SOURCE_HOST = $PROD_HOST
    $SOURCE_USER = $PROD_USER
    $SOURCE_PATH = $PROD_PATH
    $SOURCE_KEY = $PROD_KEY
    
    $TARGET_HOST = $STAGING_HOST
    $TARGET_USER = $STAGING_USER
    $TARGET_PATH = $STAGING_PATH
    $TARGET_KEY = $STAGING_KEY
} elseif ($SourceEnv -eq "staging" -and $TargetEnv -eq "production") {
    $SOURCE_HOST = $STAGING_HOST
    $SOURCE_USER = $STAGING_USER
    $SOURCE_PATH = $STAGING_PATH
    $SOURCE_KEY = $STAGING_KEY
    
    $TARGET_HOST = $PROD_HOST
    $TARGET_USER = $PROD_USER
    $TARGET_PATH = $PROD_PATH
    $TARGET_KEY = $PROD_KEY
} else {
    Write-Host "❌ Неподдерживаемая комбинация сред. Поддерживается только production -> staging или staging -> production." -ForegroundColor Red
    exit 1
}

Write-Host "📡 Проверяем подключение к исходной VM ($SOURCE_HOST)..." -ForegroundColor Yellow
try {
    $testConnection = ssh -i $SOURCE_KEY -o ConnectTimeout=10 "$SOURCE_USER@$SOURCE_HOST" "echo 'Connection OK'"
    if ($LASTEXITCODE -ne 0) {
        throw "Connection failed"
    }
    Write-Host "✅ Подключение к исходной VM успешно." -ForegroundColor Green
} catch {
    Write-Host "❌ Не удается подключиться к исходной VM." -ForegroundColor Red
    exit 1
}

Write-Host "📡 Проверяем подключение к целевой VM ($TARGET_HOST)..." -ForegroundColor Yellow
try {
    $testConnection = ssh -i $TARGET_KEY -o ConnectTimeout=10 "$TARGET_USER@$TARGET_HOST" "echo 'Connection OK'"
    if ($LASTEXITCODE -ne 0) {
        throw "Connection failed"
    }
    Write-Host "✅ Подключение к целевой VM успешно." -ForegroundColor Green
} catch {
    Write-Host "❌ Не удается подключиться к целевой VM." -ForegroundColor Red
    exit 1
}

# 1. Синхронизация базы данных
Write-Host "💾 Создаем бэкап базы данных на исходной VM..." -ForegroundColor Yellow
ssh -i $SOURCE_KEY "$SOURCE_USER@$SOURCE_HOST" "cd $SOURCE_PATH/prisma/database && cp dev.db dev.db.backup"

Write-Host "📥 Копируем базу данных с исходной VM на локальную машину..." -ForegroundColor Yellow
scp -i $SOURCE_KEY "$SOURCE_USER@$SOURCE_HOST`:$SOURCE_PATH/prisma/database/dev.db" "./temp_db_backup.db"

Write-Host "💾 Создаем бэкап базы данных на целевой VM..." -ForegroundColor Yellow
ssh -i $TARGET_KEY "$TARGET_USER@$TARGET_HOST" "cd $TARGET_PATH/prisma/database && cp dev.db dev.db.backup"

Write-Host "📤 Загружаем базу данных на целевую VM..." -ForegroundColor Yellow
scp -i $TARGET_KEY "./temp_db_backup.db" "$TARGET_USER@$TARGET_HOST`:$TARGET_PATH/prisma/database/dev.db"

Write-Host "🗑️ Удаляем временный файл базы данных..." -ForegroundColor Yellow
Remove-Item "./temp_db_backup.db" -Force

Write-Host "✅ База данных успешно синхронизирована." -ForegroundColor Green

# 2. Синхронизация файлов загрузок (public/uploads)
Write-Host "📂 Создаем архив файлов загрузок на исходной VM..." -ForegroundColor Yellow
ssh -i $SOURCE_KEY "$SOURCE_USER@$SOURCE_HOST" "cd $SOURCE_PATH/public && tar -czf uploads_backup.tar.gz uploads"

Write-Host "📥 Копируем архив файлов загрузок с исходной VM на локальную машину..." -ForegroundColor Yellow
scp -i $SOURCE_KEY "$SOURCE_USER@$SOURCE_HOST`:$SOURCE_PATH/public/uploads_backup.tar.gz" "./temp_uploads_backup.tar.gz"

Write-Host "🗑️ Удаляем старые файлы загрузок на целевой VM и распаковываем новый архив..." -ForegroundColor Yellow
scp -i $TARGET_KEY "./temp_uploads_backup.tar.gz" "$TARGET_USER@$TARGET_HOST`:/tmp/"
ssh -i $TARGET_KEY "$TARGET_USER@$TARGET_HOST" "cd $TARGET_PATH/public && rm -rf uploads && tar -xzf /tmp/temp_uploads_backup.tar.gz && rm /tmp/temp_uploads_backup.tar.gz"

Write-Host "🗑️ Удаляем временный архив файлов загрузок..." -ForegroundColor Yellow
Remove-Item "./temp_uploads_backup.tar.gz" -Force

Write-Host "✅ Файлы загрузок успешно синхронизированы." -ForegroundColor Green

Write-Host "🚀 Перезапускаем приложение на целевой VM для применения изменений..." -ForegroundColor Yellow
ssh -i $TARGET_KEY "$TARGET_USER@$TARGET_HOST" "cd $TARGET_PATH && pm2 restart domeo-staging || npm start"

Write-Host "🎉 Синхронизация данных завершена успешно!" -ForegroundColor Green
