# Fix Cursor Error Script - Automatic Version
# This script automatically clears Cursor cache without prompts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cursor Error Fix Script (Auto)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Close Cursor processes
Write-Host "Step 1: Closing Cursor processes..." -ForegroundColor Cyan
$cursorProcesses = Get-Process | Where-Object {$_.ProcessName -like "*cursor*"} -ErrorAction SilentlyContinue
if ($cursorProcesses) {
    $cursorProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  OK: Cursor processes closed" -ForegroundColor Green
} else {
    Write-Host "  OK: No Cursor processes running" -ForegroundColor Green
}

# Step 2: Clear cache directories
Write-Host ""
Write-Host "Step 2: Clearing Cursor cache..." -ForegroundColor Cyan
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
            Write-Host "  OK: Cleared $path" -ForegroundColor Green
            $cleared++
        } catch {
            Write-Host "  SKIP: $path (may be in use)" -ForegroundColor Yellow
        }
    }
}

# Step 3: Clear workspace storage
Write-Host ""
Write-Host "Step 3: Clearing workspace storage..." -ForegroundColor Cyan
$workspaceStorage = "$env:APPDATA\Cursor\User\workspaceStorage"
if (Test-Path $workspaceStorage) {
    $folderCount = (Get-ChildItem $workspaceStorage -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "  Found $folderCount workspace storage folders" -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force "$workspaceStorage\*" -ErrorAction Stop
        Write-Host "  OK: Cleared workspace storage" -ForegroundColor Green
    } catch {
        Write-Host "  SKIP: Workspace storage (may be in use)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK: No workspace storage found" -ForegroundColor Green
}

# Step 4: Clear TypeScript server cache
Write-Host ""
Write-Host "Step 4: Clearing TypeScript server cache..." -ForegroundColor Cyan
$tsCachePaths = @(
    "$env:APPDATA\Cursor\CachedExtensionVSIXs",
    "$env:LOCALAPPDATA\Cursor\CachedExtensionVSIXs"
)

foreach ($path in $tsCachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "  OK: Cleared $path" -ForegroundColor Green
        } catch {
            Write-Host "  SKIP: $path" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleared $cleared cache directories" -ForegroundColor $(if ($cleared -gt 0) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "DONE! You can now restart Cursor." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart Cursor" -ForegroundColor White
Write-Host "2. Open your workspace" -ForegroundColor White
Write-Host "3. The error should be gone" -ForegroundColor White
Write-Host ""

