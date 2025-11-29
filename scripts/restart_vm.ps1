# Скрипт для перезапуска приложения на ВМ (PowerShell)
# Использование: .\scripts\restart_vm.ps1 -Host "130.193.40.35" -User "ubuntu" -KeyPath "C:\path\to\key.pem"

param(
    [string]$Host = "130.193.40.35",
    [string]$User = "ubuntu",
    [string]$KeyPath = ""
)

Write-Host "🔄 Перезапуск сервиса domeo на ВМ $Host..." -ForegroundColor Cyan

if ($KeyPath) {
    $sshCommand = "ssh -i `"$KeyPath`" ${User}@${Host} 'sudo systemctl restart domeo && sudo systemctl status domeo --no-pager -l'"
} else {
    $sshCommand = "ssh ${User}@${Host} 'sudo systemctl restart domeo && sudo systemctl status domeo --no-pager -l'"
}

Invoke-Expression $sshCommand

Write-Host "✅ Сервис перезапущен!" -ForegroundColor Green

