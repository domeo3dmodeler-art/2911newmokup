# Найти postgresql.conf и показать текущие listen_addresses и port
# Запуск: powershell -ExecutionPolicy Bypass -File scripts\fix-pg-listening.ps1

$pgPaths = @(
    "C:\Program Files\PostgreSQL\15\data\postgresql.conf",
    "C:\Program Files\PostgreSQL\16\data\postgresql.conf",
    "C:\Program Files\PostgreSQL\14\data\postgresql.conf"
)
$found = $null
foreach ($p in $pgPaths) {
    if (Test-Path $p) { $found = $p; break }
}
if (-not $found) {
    Write-Host "postgresql.conf not found in standard paths. Checking registry..."
    $pgService = Get-WmiObject Win32_Service -Filter "Name='postgresql-x64-15'" -ErrorAction SilentlyContinue
    if ($pgService) {
        $binPath = $pgService.PathName
        # PathName often like "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" runservice -N "postgresql-x64-15"
        if ($binPath -match 'PostgreSQL\\(\d+)\\bin') {
            $ver = $matches[1]
            $confPath = "C:\Program Files\PostgreSQL\$ver\data\postgresql.conf"
            if (Test-Path $confPath) { $found = $confPath }
        }
    }
}
if (-not $found) {
    Write-Host "ERROR: postgresql.conf not found. Specify path manually."
    exit 1
}
Write-Host "Found: $found"
Write-Host ""
$content = Get-Content $found -Raw
$lines = Get-Content $found
Write-Host "Current listen_addresses and port:"
$lines | Select-String -Pattern "^\s*#?\s*(listen_addresses|port)\s*=" | ForEach-Object { Write-Host $_.Line }
Write-Host ""
Write-Host "To fix: open the file as Administrator, uncomment and set:"
Write-Host "  listen_addresses = 'localhost'"
Write-Host "  port = 5432"
Write-Host "Then run: Restart-Service -Name 'postgresql-x64-15'"
Write-Host ""
Write-Host "Full path to open: $found"
