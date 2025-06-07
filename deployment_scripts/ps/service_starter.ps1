# Service Starter (Windows PowerShell)
# Handles starting backend and frontend services

param(
    [Parameter(Position=0)]
    [ValidateSet("backend", "frontend", "both")]
    [string]$Service = "both",
    
    [Parameter(Position=1)]
    [ValidateSet("development", "production")]
    [string]$Environment = "development"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$LogsDir = Join-Path $ProjectRoot "logs"

# Colors for output
function Write-Log { param($Message) Write-Host "[STARTER] $Message" -ForegroundColor Cyan }
function Write-Error-Log { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning-Log { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Header { param($Message) Write-Host $Message -ForegroundColor Magenta }

# Function to start backend
function Start-Backend {
    param([string]$Env = "development")
    
    Write-Header "=== Starting Backend Server ==="
    
    Push-Location $BackendDir
    
    # Create logs directory
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }
    
    if ($Env -eq "production") {
        Write-Log "Starting backend in production mode..."
        $env:NODE_ENV = "production"
        $Process = Start-Process -FilePath "node" -ArgumentList "src/server.js" -PassThru -RedirectStandardOutput "$LogsDir\backend.log" -RedirectStandardError "$LogsDir\backend_error.log" -WindowStyle Hidden
        $Process.Id | Out-File "$LogsDir\backend.pid" -Encoding UTF8
        Write-Success "Backend started in production mode (PID: $($Process.Id))"
    }
    else {
        Write-Log "Starting backend in development mode..."
        if (Get-Command nodemon -ErrorAction SilentlyContinue) {
            $Process = Start-Process -FilePath "nodemon" -ArgumentList "src/server.js" -PassThru -RedirectStandardOutput "$LogsDir\backend.log" -RedirectStandardError "$LogsDir\backend_error.log" -WindowStyle Hidden
        }
        else {
            $Process = Start-Process -FilePath "node" -ArgumentList "src/server.js" -PassThru -RedirectStandardOutput "$LogsDir\backend.log" -RedirectStandardError "$LogsDir\backend_error.log" -WindowStyle Hidden
        }
        $Process.Id | Out-File "$LogsDir\backend.pid" -Encoding UTF8
        Write-Success "Backend started in development mode (PID: $($Process.Id))"
    }
    
    Pop-Location
}

# Function to start frontend
function Start-Frontend {
    param([string]$Env = "development")
    
    Write-Header "=== Starting Frontend Server ==="
    
    Push-Location $FrontendDir
    
    # Create logs directory
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }
    
    if ($Env -eq "production") {
        # Build for production if needed
        if (-not (Test-Path "build")) {
            Write-Log "Building frontend for production..."
            npm run build
        }
        
        Write-Log "Starting frontend in production mode..."
        if (Get-Command serve -ErrorAction SilentlyContinue) {
            $Process = Start-Process -FilePath "serve" -ArgumentList "-s", "build", "-l", "3000" -PassThru -RedirectStandardOutput "$LogsDir\frontend.log" -RedirectStandardError "$LogsDir\frontend_error.log" -WindowStyle Hidden
            $Process.Id | Out-File "$LogsDir\frontend.pid" -Encoding UTF8
            Write-Success "Frontend started in production mode (PID: $($Process.Id))"
        }
        else {
            Write-Warning-Log "Install 'serve' package for production: npm install -g serve"
            Write-Log "Starting with npm start instead..."
            $Process = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "start" -PassThru -RedirectStandardOutput "$LogsDir\frontend.log" -RedirectStandardError "$LogsDir\frontend_error.log" -WindowStyle Hidden
            $Process.Id | Out-File "$LogsDir\frontend.pid" -Encoding UTF8
            Write-Success "Frontend started with npm start (PID: $($Process.Id))"
        }
    }
    else {
        Write-Log "Starting frontend in development mode..."
        # Use cmd to start npm to avoid PowerShell execution issues
        $Process = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "start" -PassThru -RedirectStandardOutput "$LogsDir\frontend.log" -RedirectStandardError "$LogsDir\frontend_error.log" -WindowStyle Hidden
        $Process.Id | Out-File "$LogsDir\frontend.pid" -Encoding UTF8
        Write-Success "Frontend started in development mode (PID: $($Process.Id))"
    }
    
    Pop-Location
}

# Function to start both services
function Start-BothServices {
    param([string]$Env = "development")
    
    Write-Log "Starting both services in $Env mode..."
    
    Start-Backend $Env
    Start-Sleep 3  # Give backend time to start
    Start-Frontend $Env
    
    Write-Success "Both services started"
}

# Main execution
try {
    switch ($Service) {
        "backend" {
            Start-Backend $Environment
        }
        "frontend" {
            Start-Frontend $Environment
        }
        "both" {
            Start-BothServices $Environment
        }
        default {
            Write-Host "Usage: .\service_starter.ps1 {backend|frontend|both} [environment]" -ForegroundColor White
            Write-Host ""
            Write-Host "Commands:" -ForegroundColor White
            Write-Host "  backend [env]     Start backend service"
            Write-Host "  frontend [env]    Start frontend service"
            Write-Host "  both [env]        Start both services"
            Write-Host ""
            Write-Host "Environment:" -ForegroundColor White
            Write-Host "  development (default)"
            Write-Host "  production"
            exit 1
        }
    }
}
catch {
    Write-Error-Log "Failed to start services: $($_.Exception.Message)"
    exit 1
}
