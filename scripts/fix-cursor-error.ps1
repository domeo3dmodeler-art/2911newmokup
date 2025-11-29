# Fix Cursor Error Script
# This script attempts to fix the ConnectError: [invalid_argument] error

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cursor Error Fix Script" -ForegroundColor Cyan
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
        Start-Sleep -Seconds 3
        Write-Host "✓ Cursor closed" -ForegroundColor Green
    } else {
        Write-Host "Exiting. Please close Cursor manually and run this script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Step 1: Clearing Cursor cache..." -ForegroundColor Cyan

# Clear cache directories
$cachePaths = @(
    "$env:APPDATA\Cursor\Cache",
    "$env:APPDATA\Cursor\CachedData",
    "$env:APPDATA\Cursor\Code Cache",
    "$env:LOCALAPPDATA\Cursor\Cache",
    "$env:LOCALAPPDATA\Cursor\CachedData"
)

$cleared = 0
foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "  ✓ Cleared: $path" -ForegroundColor Green
            $cleared++
        } catch {
            Write-Host "  ✗ Failed: $path" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Step 2: Clearing workspace storage..." -ForegroundColor Cyan

# Clear workspace storage (optional - more aggressive)
$workspaceStorage = "$env:APPDATA\Cursor\User\workspaceStorage"
if (Test-Path $workspaceStorage) {
    $folderCount = (Get-ChildItem $workspaceStorage -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "  Found $folderCount workspace storage folders" -ForegroundColor Yellow
    
    $response = Read-Host "Do you want to clear workspace storage? This will reset all workspace settings. (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        try {
            Remove-Item -Recurse -Force "$workspaceStorage\*" -ErrorAction Stop
            Write-Host "  ✓ Cleared workspace storage" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Failed to clear workspace storage" -ForegroundColor Red
        }
    } else {
        Write-Host "  ○ Skipped workspace storage" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Step 3: Clearing TypeScript server cache..." -ForegroundColor Cyan

# Clear TypeScript server cache
$tsCachePaths = @(
    "$env:APPDATA\Cursor\CachedExtensionVSIXs",
    "$env:LOCALAPPDATA\Cursor\CachedExtensionVSIXs"
)

foreach ($path in $tsCachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "  ✓ Cleared: $path" -ForegroundColor Green
        } catch {
            Write-Host "  ○ Skipped: $path" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleared $cleared cache directories" -ForegroundColor $(if ($cleared -gt 0) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "✓ Done! You can now restart Cursor." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Cursor" -ForegroundColor Yellow
Write-Host "  2. Open your workspace" -ForegroundColor Yellow
Write-Host "  3. If error persists, try:" -ForegroundColor Yellow
Write-Host "     - Update Cursor (Help menu -> Check for Updates)" -ForegroundColor Yellow
Write-Host "     - Disable extensions temporarily" -ForegroundColor Yellow
Write-Host "     - Check IMMEDIATE_FIX_STEPS.md for more solutions" -ForegroundColor Yellow
Write-Host ""







