# Clear Cursor Cache Script
# This script clears Cursor's cache to resolve connection errors

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cursor Cache Cleaner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Cursor is running
$cursorProcesses = Get-Process | Where-Object {$_.ProcessName -like "*cursor*"} -ErrorAction SilentlyContinue

if ($cursorProcesses) {
    Write-Host "⚠️  Cursor is currently running!" -ForegroundColor Yellow
    Write-Host "Please close Cursor before running this script." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to close Cursor now? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Closing Cursor processes..." -ForegroundColor Yellow
        $cursorProcesses | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "✓ Cursor closed" -ForegroundColor Green
    } else {
        Write-Host "Exiting. Please close Cursor manually and run this script again." -ForegroundColor Red
        exit 1
    }
}

# Clear cache directories
$cachePaths = @(
    "$env:APPDATA\Cursor\Cache",
    "$env:APPDATA\Cursor\CachedData",
    "$env:APPDATA\Cursor\Code Cache",
    "$env:LOCALAPPDATA\Cursor\Cache",
    "$env:LOCALAPPDATA\Cursor\CachedData"
)

$cleared = 0
$total = 0

foreach ($path in $cachePaths) {
    $total++
    if (Test-Path $path) {
        try {
            $size = (Get-ChildItem -Path $path -Recurse -ErrorAction SilentlyContinue | 
                     Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            $sizeMB = [math]::Round($size / 1MB, 2)
            
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "✓ Cleared: $path ($sizeMB MB)" -ForegroundColor Green
            $cleared++
        } catch {
            Write-Host "✗ Failed to clear: $path" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "○ Not found: $path" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleared: $cleared / $total cache directories" -ForegroundColor $(if ($cleared -gt 0) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "✓ Done! You can now restart Cursor." -ForegroundColor Green
Write-Host ""
Write-Host "If the error persists, try:" -ForegroundColor Yellow
Write-Host "  1. Restart your computer" -ForegroundColor Yellow
Write-Host "  2. Update Cursor to the latest version" -ForegroundColor Yellow
Write-Host "  3. Check CURSOR_ERROR_DIAGNOSTIC.md for more solutions" -ForegroundColor Yellow
Write-Host ""

