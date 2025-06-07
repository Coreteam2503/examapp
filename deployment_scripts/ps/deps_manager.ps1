# Dependencies Manager (Windows PowerShell)
# Handles installation of project dependencies

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

# Colors for output
function Write-Log { param($Message) Write-Host "[DEPS] $Message" -ForegroundColor Cyan }
function Write-Error-Log { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning-Log { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Header { param($Message) Write-Host $Message -ForegroundColor Magenta }

# Function to check prerequisites
function Test-Prerequisites {
    Write-Header "=== Checking Prerequisites ==="
    
    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error-Log "Node.js is not installed"
        exit 1
    }
    $NodeVersion = & node --version
    Write-Log "Node.js version: $NodeVersion"
    
    # Check npm
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error-Log "npm is not installed"
        exit 1
    }
    $NpmVersion = & npm --version
    Write-Log "npm version: $NpmVersion"
    
    # Check project directories
    if (-not (Test-Path $BackendDir)) {
        Write-Error-Log "Backend directory not found: $BackendDir"
        exit 1
    }
    
    if (-not (Test-Path $FrontendDir)) {
        Write-Error-Log "Frontend directory not found: $FrontendDir"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Function to install backend dependencies
function Install-BackendDependencies {
    Write-Header "=== Installing Backend Dependencies ==="
    
    Push-Location $BackendDir
    
    if (-not (Test-Path "package.json")) {
        Write-Error-Log "Backend package.json not found"
        Pop-Location
        exit 1
    }
    
    Write-Log "Installing backend dependencies..."
    
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
        Write-Success "Backend dependencies installed"
    }
    catch {
        Write-Error-Log "Failed to install backend dependencies: $($_.Exception.Message)"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Function to install frontend dependencies
function Install-FrontendDependencies {
    Write-Header "=== Installing Frontend Dependencies ==="
    
    Push-Location $FrontendDir
    
    if (-not (Test-Path "package.json")) {
        Write-Error-Log "Frontend package.json not found"
        Pop-Location
        exit 1
    }
    
    Write-Log "Installing frontend dependencies..."
    
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
        Write-Success "Frontend dependencies installed"
    }
    catch {
        Write-Error-Log "Failed to install frontend dependencies: $($_.Exception.Message)"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Function to install both
function Install-AllDependencies {
    Test-Prerequisites
    Install-BackendDependencies
    Install-FrontendDependencies
    Write-Success "All dependencies installed"
}

# Function to clean dependencies
function Remove-Dependencies {
    Write-Header "=== Cleaning Dependencies ==="
    
    Write-Log "Removing node_modules directories..."
    
    $BackendNodeModules = Join-Path $BackendDir "node_modules"
    $FrontendNodeModules = Join-Path $FrontendDir "node_modules"
    
    if (Test-Path $BackendNodeModules) {
        Remove-Item $BackendNodeModules -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log "Removed backend node_modules"
    }
    
    if (Test-Path $FrontendNodeModules) {
        Remove-Item $FrontendNodeModules -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log "Removed frontend node_modules"
    }
    
    Write-Log "Removing package-lock.json files..."
    
    $BackendPackageLock = Join-Path $BackendDir "package-lock.json"
    $FrontendPackageLock = Join-Path $FrontendDir "package-lock.json"
    
    if (Test-Path $BackendPackageLock) {
        Remove-Item $BackendPackageLock -Force -ErrorAction SilentlyContinue
        Write-Log "Removed backend package-lock.json"
    }
    
    if (Test-Path $FrontendPackageLock) {
        Remove-Item $FrontendPackageLock -Force -ErrorAction SilentlyContinue
        Write-Log "Removed frontend package-lock.json"
    }
    
    Write-Success "Dependencies cleaned"
}

# Main function when script is called directly
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    param(
        [Parameter(Position=0)]
        [ValidateSet("check", "backend", "frontend", "both", "all", "clean")]
        [string]$Action = "both"
    )
    
    try {
        switch ($Action) {
            "check" {
                Test-Prerequisites
            }
            "backend" {
                Test-Prerequisites
                Install-BackendDependencies
            }
            "frontend" {
                Test-Prerequisites
                Install-FrontendDependencies
            }
            { $_ -in @("both", "all") } {
                Install-AllDependencies
            }
            "clean" {
                Remove-Dependencies
            }
            default {
                Write-Host "Usage: .\deps_manager.ps1 {check|backend|frontend|both|clean}" -ForegroundColor White
                Write-Host ""
                Write-Host "Commands:" -ForegroundColor White
                Write-Host "  check        Check prerequisites"
                Write-Host "  backend      Install backend dependencies"
                Write-Host "  frontend     Install frontend dependencies"
                Write-Host "  both         Install all dependencies"
                Write-Host "  clean        Remove all dependencies"
                exit 1
            }
        }
    }
    catch {
        Write-Error-Log "Command failed: $($_.Exception.Message)"
        exit 1
    }
}
