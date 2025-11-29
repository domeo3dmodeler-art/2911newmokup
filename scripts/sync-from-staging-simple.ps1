# Simple script to sync code from staging VM
param(
    [switch]$Backup = $true
)

$STAGING_HOST = "130.193.40.35"
$STAGING_USER = "ubuntu"
$STAGING_PATH = "/opt/domeo"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SYNCING CODE FROM STAGING VM" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check SSH connection
Write-Host "Checking SSH connection..." -ForegroundColor Yellow
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "${STAGING_USER}@${STAGING_HOST}" "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to $STAGING_HOST" -ForegroundColor Red
    Write-Host "Make sure SSH key is configured" -ForegroundColor Yellow
    exit 1
}
Write-Host "SSH connection OK" -ForegroundColor Green

# Check directory exists
Write-Host ""
Write-Host "Checking directory on server..." -ForegroundColor Yellow
$dirCheck = ssh "${STAGING_USER}@${STAGING_HOST}" "test -d '$STAGING_PATH' && echo EXISTS || echo NOT_FOUND" 2>&1
if ($dirCheck -notmatch "EXISTS") {
    Write-Host "ERROR: Directory $STAGING_PATH not found" -ForegroundColor Red
    exit 1
}
Write-Host "Directory found" -ForegroundColor Green

# Create backup
if ($Backup) {
    Write-Host ""
    Write-Host "Creating backup..." -ForegroundColor Yellow
    $backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    $importantPaths = @("app", "lib", "prisma", "package.json", "next.config.mjs", ".env.local")
    foreach ($path in $importantPaths) {
        if (Test-Path $path) {
            $destPath = Join-Path $backupDir $path
            $parentDir = Split-Path $destPath -Parent
            if (-not (Test-Path $parentDir)) {
                New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
            }
            Copy-Item -Path $path -Destination $destPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Backup created: $backupDir" -ForegroundColor Green
}

# Sync files using tar over ssh (more reliable)
Write-Host ""
Write-Host "Downloading code from server..." -ForegroundColor Yellow

$tempDir = "temp_sync_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $tempDir | Out-Null
$tarFile = "staging_code_$(Get-Date -Format 'yyyyMMdd_HHmmss').tar.gz"

try {
    Write-Host "Creating archive on server..." -ForegroundColor Gray
    # Create tar archive on server, excluding node_modules, .next, etc.
    ssh "${STAGING_USER}@${STAGING_HOST}" "cd '$STAGING_PATH' && tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='*.log' --exclude='.env' --exclude='backup_*' --exclude='temp_sync_*' -czf /tmp/$tarFile ." 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create archive on server" -ForegroundColor Red
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    Write-Host "Downloading archive..." -ForegroundColor Gray
    # Download the archive
    scp "${STAGING_USER}@${STAGING_HOST}:/tmp/$tarFile" $tarFile 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to download archive" -ForegroundColor Red
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    Write-Host "Extracting archive..." -ForegroundColor Gray
    # Extract archive
    tar -xzf $tarFile -C $tempDir 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to extract archive" -ForegroundColor Red
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $tarFile -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    # Clean up archive on server
    ssh "${STAGING_USER}@${STAGING_HOST}" "rm -f /tmp/$tarFile" 2>&1 | Out-Null
    # Clean up local archive
    Remove-Item -Path $tarFile -Force -ErrorAction SilentlyContinue
    
    Write-Host "Code downloaded" -ForegroundColor Green
    
    # Copy files to current directory
    Write-Host ""
    Write-Host "Copying files to current directory..." -ForegroundColor Yellow
    
    $excludeItems = @("node_modules", ".next", ".git", "*.log", ".env", "backup_*", "temp_sync_*", "prisma/dev.db*")
    
    Get-ChildItem -Path $tempDir -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($tempDir.Length + 1)
        $shouldExclude = $false
        
        foreach ($exclude in $excludeItems) {
            if ($relativePath -like $exclude) {
                $shouldExclude = $true
                break
            }
        }
        
        if (-not $shouldExclude) {
            $destPath = Join-Path "." $relativePath
            $parentDir = Split-Path $destPath -Parent
            
            if (-not (Test-Path $parentDir)) {
                New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
            }
            
            if ($_.PSIsContainer) {
                if (-not (Test-Path $destPath)) {
                    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
                }
            } else {
                Copy-Item -Path $_.FullName -Destination $destPath -Force
            }
        }
    }
    
    Write-Host "Files copied" -ForegroundColor Green
    
    # Cleanup
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SYNC COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. npm install" -ForegroundColor Gray
Write-Host "  2. npm run prisma:generate" -ForegroundColor Gray
Write-Host "  3. npm run prisma:migrate" -ForegroundColor Gray
Write-Host "  4. npm run dev" -ForegroundColor Gray
Write-Host ""

