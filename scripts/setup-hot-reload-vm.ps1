# Скрипт для настройки и запуска hot reload на ВМ (PowerShell)
# Использование: .\scripts\setup-hot-reload-vm.ps1 -Host "130.193.40.35" -User "ubuntu" -KeyPath ""

param(
    [string]$VMHost = "130.193.40.35",
    [string]$User = "ubuntu",
    [string]$KeyPath = "",
    [string]$StagingPath = "/opt/domeo"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HOT RELOAD SETUP ON VM" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия docker-compose.staging-dev.yml локально
if (-not (Test-Path "docker-compose.staging-dev.yml")) {
    Write-Host "ERROR: docker-compose.staging-dev.yml not found locally!" -ForegroundColor Red
    Write-Host "Make sure you are in the project root directory" -ForegroundColor Yellow
    exit 1
}

# Копирование docker-compose.staging-dev.yml на ВМ
Write-Host "Copying docker-compose.staging-dev.yml to VM..." -ForegroundColor Yellow
if ($KeyPath) {
    scp -i $KeyPath docker-compose.staging-dev.yml "${User}@${VMHost}:${StagingPath}/" 2>&1 | Out-Null
} else {
    scp docker-compose.staging-dev.yml "${User}@${VMHost}:${StagingPath}/" 2>&1 | Out-Null
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Error copying file (file may already exist)" -ForegroundColor Yellow
}

# Копирование скрипта setup-hot-reload-vm.sh на ВМ
Write-Host "Copying setup script to VM..." -ForegroundColor Yellow
if ($KeyPath) {
    scp -i $KeyPath scripts/setup-hot-reload-vm.sh "${User}@${VMHost}:${StagingPath}/scripts/" 2>&1 | Out-Null
} else {
    scp scripts/setup-hot-reload-vm.sh "${User}@${VMHost}:${StagingPath}/scripts/" 2>&1 | Out-Null
}

# Выполнение настройки на ВМ
Write-Host ""
Write-Host "Executing setup on VM..." -ForegroundColor Yellow
Write-Host "Host: $VMHost" -ForegroundColor Gray
Write-Host "Path: $StagingPath" -ForegroundColor Gray
Write-Host ""

if ($KeyPath) {
    ssh -i $KeyPath ${User}@${VMHost} "cd $StagingPath; chmod +x scripts/setup-hot-reload-vm.sh; ./scripts/setup-hot-reload-vm.sh"
} else {
    ssh ${User}@${VMHost} "cd $StagingPath; chmod +x scripts/setup-hot-reload-vm.sh; ./scripts/setup-hot-reload-vm.sh"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Staging URL: http://$VMHost`:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use git-sync-to-staging.ps1 to apply changes" -ForegroundColor Yellow
Write-Host ""
