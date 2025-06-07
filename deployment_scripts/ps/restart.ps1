# Agentic Mesh Quiz App - Restart Script (Windows PowerShell)
# Stops existing processes and starts the application

param(
    [switch]$Production,
    [switch]$Development,
    [switch]$SkipDeps,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"
$LogsDir = Join-Path $ProjectRoot "logs"

# Default environment
if ($Production) {
    $Environment = "production"
} elseif ($Development) {
    $Environment = "development"
} else {
    $Environment = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }
}
$SkipDependencies = $SkipDeps

# Colors for output (using Write-Host with colors)
function Write-Log { param($Message) Write-Host "[RESTART] $Message" -ForegroundColor Cyan }
function Write-Error-Log { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning-Log { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Header { param($Message) Write-Host $Message -ForegroundColor Magenta }

# Import utility functions
# Fallback function definitions in case sourcing fails
function Get-ProcessOnPort {
    param([int]$Port)
    try {
        $Connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($Connection) {
            return $Connection.OwningProcess
        }
        return $null
    }
    catch {
        return $null
    }
}

function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName = "Service")
    Write-Log "Cleaning up port $Port ($ServiceName)..."
    $ProcessId = Get-ProcessOnPort $Port
    if ($ProcessId) {
        Write-Log "Found process on port $Port with PID: $ProcessId"
        try {
            $Process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
            if ($Process) {
                Write-Log "Attempting graceful shutdown of process $ProcessId"
                $Process.CloseMainWindow() | Out-Null
                Start-Sleep 2
                $Process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
                if ($Process) {
                    Write-Warning-Log "Force killing process $ProcessId"
                    Stop-Process -Id $ProcessId -Force
                    Start-Sleep 1
                }
            }
            $FinalProcessId = Get-ProcessOnPort $Port
            if ($FinalProcessId) {
                Write-Error-Log "Failed to kill process on port $Port"
                return $false
            } else {
                Write-Success "Port $Port is now free"
                return $true
            }
        } catch {
            Write-Error-Log "Error killing process on port $Port`: $($_.Exception.Message)"
            return $false
        }
    } else {
        Write-Log "Port $Port is already free"
        return $true
    }
}

function Stop-TrackedProcesses {
    $LogsDir = Join-Path $ProjectRoot "logs"
    Write-Log "Stopping tracked processes from PID files..."
    
    # Stop backend if PID file exists
    $BackendPidFile = Join-Path $LogsDir "backend.pid"
    if (Test-Path $BackendPidFile) {
        try {
            $BackendPid = Get-Content $BackendPidFile -ErrorAction SilentlyContinue
            if ($BackendPid) {
                $Process = Get-Process -Id $BackendPid -ErrorAction SilentlyContinue
                if ($Process) {
                    Write-Log "Stopping tracked backend process (PID: $BackendPid)"
                    $Process.CloseMainWindow() | Out-Null
                    Start-Sleep 2
                    $Process = Get-Process -Id $BackendPid -ErrorAction SilentlyContinue
                    if ($Process) {
                        Write-Warning-Log "Force killing backend process"
                        Stop-Process -Id $BackendPid -Force
                    }
                    Write-Success "Backend process stopped"
                } else {
                    Write-Log "Backend PID file exists but process not running"
                }
            }
            Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Warning-Log "Error stopping backend process: $($_.Exception.Message)"
            Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Stop frontend if PID file exists
    $FrontendPidFile = Join-Path $LogsDir "frontend.pid"
    if (Test-Path $FrontendPidFile) {
        try {
            $FrontendPid = Get-Content $FrontendPidFile -ErrorAction SilentlyContinue
            if ($FrontendPid) {
                $Process = Get-Process -Id $FrontendPid -ErrorAction SilentlyContinue
                if ($Process) {
                    Write-Log "Stopping tracked frontend process (PID: $FrontendPid)"
                    $Process.CloseMainWindow() | Out-Null
                    Start-Sleep 2
                    $Process = Get-Process -Id $FrontendPid -ErrorAction SilentlyContinue
                    if ($Process) {
                        Write-Warning-Log "Force killing frontend process"
                        Stop-Process -Id $FrontendPid -Force
                    }
                    Write-Success "Frontend process stopped"
                } else {
                    Write-Log "Frontend PID file exists but process not running"
                }
            }
            Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Warning-Log "Error stopping frontend process: $($_.Exception.Message)"
            Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
        }
    }
}

function Start-BothServices {
    param([string]$Env = "development")
    Write-Log "Starting both services in $Env mode..."
    
    # Start Backend
    Write-Header "=== Starting Backend Server ==="
    Push-Location $BackendDir
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }
    if ($Env -eq "production") {
        Write-Log "Starting backend in production mode..."
        $env:NODE_ENV = "production"
        $Process = Start-Process -FilePath "node" -ArgumentList "src/server.js" -PassThru -RedirectStandardOutput "$LogsDir\backend.log" -RedirectStandardError "$LogsDir\backend_error.log" -WindowStyle Hidden
        $Process.Id | Out-File "$LogsDir\backend.pid" -Encoding UTF8
        Write-Success "Backend started in production mode (PID: $($Process.Id))"
    } else {
        Write-Log "Starting backend in development mode..."
        if (Get-Command nodemon -ErrorAction SilentlyContinue) {
            $Process = Start-Process -FilePath "nodemon" -ArgumentList "src/server.js" -PassThru -RedirectStandardOutput "$LogsDir\backend.log" -RedirectStandardError "$LogsDir\backend_error.log" -WindowStyle Hidden
        } else {
            $Process = Start-Process -FilePath "node" -ArgumentList "src/server.js" -PassThru -RedirectStandardOutput "$LogsDir\backend.log" -RedirectStandardError "$LogsDir\backend_error.log" -WindowStyle Hidden
        }
        $Process.Id | Out-File "$LogsDir\backend.pid" -Encoding UTF8
        Write-Success "Backend started in development mode (PID: $($Process.Id))"
    }
    Pop-Location
    
    Start-Sleep 3  # Give backend time to start
    
    # Start Frontend
    Write-Header "=== Starting Frontend Server ==="
    Push-Location $FrontendDir
    if ($Env -eq "production") {
        if (-not (Test-Path "build")) {
            Write-Log "Building frontend for production..."
            npm run build
        }
        Write-Log "Starting frontend in production mode..."
        if (Get-Command serve -ErrorAction SilentlyContinue) {
            $Process = Start-Process -FilePath "serve" -ArgumentList "-s", "build", "-l", "3000" -PassThru -RedirectStandardOutput "$LogsDir\frontend.log" -RedirectStandardError "$LogsDir\frontend_error.log" -WindowStyle Hidden
            $Process.Id | Out-File "$LogsDir\frontend.pid" -Encoding UTF8
            Write-Success "Frontend started in production mode (PID: $($Process.Id))"
        } else {
            Write-Warning-Log "Install 'serve' package for production: npm install -g serve"
            Write-Log "Starting with npm start instead..."
            $Process = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -RedirectStandardOutput "$LogsDir\frontend.log" -RedirectStandardError "$LogsDir\frontend_error.log" -WindowStyle Hidden
            $Process.Id | Out-File "$LogsDir\frontend.pid" -Encoding UTF8
            Write-Success "Frontend started with npm start (PID: $($Process.Id))"
        }
    } else {
        Write-Log "Starting frontend in development mode..."
        $Process = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -RedirectStandardOutput "$LogsDir\frontend.log" -RedirectStandardError "$LogsDir\frontend_error.log" -WindowStyle Hidden
        $Process.Id | Out-File "$LogsDir\frontend.pid" -Encoding UTF8
        Write-Success "Frontend started in development mode (PID: $($Process.Id))"
    }
    Pop-Location
    
    Write-Success "Both services started"
}

function Wait-ForService {
    param([string]$Url, [string]$ServiceName, [int]$MaxWait = 30)
    Write-Log "Waiting for $ServiceName to be ready..."
    $Count = 0
    while ($Count -lt $MaxWait) {
        try {
            $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                Write-Success "$ServiceName is ready!"
                return $true
            }
        } catch {
            # Service not ready yet, continue waiting
        }
        Start-Sleep 2
        $Count += 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    Write-Warning-Log "$ServiceName not ready after ${MaxWait}s"
    return $false
}

function Install-AllDependencies {
    Write-Header "=== Checking Prerequisites ==="
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error-Log "Node.js is not installed"
        exit 1
    }
    $NodeVersion = & node --version
    Write-Log "Node.js version: $NodeVersion"
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error-Log "npm is not installed"
        exit 1
    }
    $NpmVersion = & npm --version
    Write-Log "npm version: $NpmVersion"
    if (-not (Test-Path $BackendDir)) {
        Write-Error-Log "Backend directory not found: $BackendDir"
        exit 1
    }
    if (-not (Test-Path $FrontendDir)) {
        Write-Error-Log "Frontend directory not found: $FrontendDir"
        exit 1
    }
    Write-Success "Prerequisites check passed"
    
    # Install Backend Dependencies
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
    } catch {
        Write-Error-Log "Failed to install backend dependencies: $($_.Exception.Message)"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    # Install Frontend Dependencies
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
    } catch {
        Write-Error-Log "Failed to install frontend dependencies: $($_.Exception.Message)"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Success "All dependencies installed"
}

# Using built-in functions instead of importing utility scripts
# (to avoid any potential syntax issues with utility scripts)
Write-Log "Using built-in utility functions"

# Add missing variables
$FrontendDir = Join-Path $ProjectRoot "frontend"
$LogsDir = Join-Path $ProjectRoot "logs"

# Function to initialize database
function Initialize-Database {
    Write-Header "=== Initializing Database ==="
    
    Push-Location $BackendDir
    
    if (Test-Path "init-db.js") {
        Write-Log "Running database initialization..."
        node init-db.js
        Write-Success "Database initialized"
    }
    else {
        Write-Warning-Log "Database initialization script not found"
    }
    
    Pop-Location
}

# Function to display final status
function Show-FinalStatus {
    Write-Header "=== Application Status ==="
    
    Write-Host ""
    Write-Log "🚀 Agentic Mesh Quiz App is now running!"
    Write-Host ""
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
    Write-Host "Backend API: http://localhost:8000/api" -ForegroundColor Green
    Write-Host "Health Check: http://localhost:8000/api/health" -ForegroundColor Green
    Write-Host ""
    
    # Show running processes
    $BackendPid = Get-ProcessOnPort 8000
    $FrontendPid = Get-ProcessOnPort 3000
    
    Write-Host "Process Information:" -ForegroundColor Cyan
    Write-Host "  Backend PID: $($BackendPid -or 'Not found')"
    Write-Host "  Frontend PID: $($FrontendPid -or 'Not found')"
    Write-Host ""
    
    # Show logs location
    Write-Host "Logs Location: $LogsDir" -ForegroundColor Cyan
    Write-Host "  Backend: $LogsDir\backend.log"
    Write-Host "  Frontend: $LogsDir\frontend.log"
    Write-Host ""
    
    Write-Host "Useful Commands:" -ForegroundColor Yellow
    Write-Host "  Stop app: .\deployment_scripts\stop.ps1"
    Write-Host "  Check status: .\deployment_scripts\status.ps1"
    Write-Host "  View logs: Get-Content $LogsDir\backend.log -Tail 50 -Wait"
    Write-Host ""
}

# Function to show help
function Show-Help {
    Write-Host "Usage: .\restart.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Production     Start in production mode"
    Write-Host "  -Development    Start in development mode (default)"
    Write-Host "  -SkipDeps       Skip dependency installation"
    Write-Host "  -Help           Show this help message"
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor White
    Write-Host "  1. Stop existing processes ONLY on ports 3000 and 8000"
    Write-Host "  2. Install dependencies (unless -SkipDeps)"
    Write-Host "  3. Initialize the database"
    Write-Host "  4. Start backend and frontend servers"
    Write-Host "  5. Verify services are running"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\restart.ps1                # Start in development mode"
    Write-Host "  .\restart.ps1 -Production    # Start in production mode"
    Write-Host "  .\restart.ps1 -SkipDeps      # Skip dependency installation"
}

# Main restart function
function Start-Restart {
    if ($Help) {
        Show-Help
        return
    }

    Write-Header "=== Agentic Mesh Quiz App - Restart Script ==="
    Write-Log "Environment: $Environment"
    Write-Log "Project Root: $ProjectRoot"
    Write-Host ""
    
    # Step 1: Stop existing processes (ONLY ports 3000 and 8000)
    Write-Header "=== Step 1: Stopping Existing Processes ==="
    Write-Log "Stopping ONLY processes on ports 3000 and 8000..."
    
    # First try to stop tracked processes cleanly
    Stop-TrackedProcesses
    
    # Then kill anything on our specific ports
    Stop-ProcessOnPort 3000 "Frontend"
    Stop-ProcessOnPort 8000 "Backend"
    
    Write-Success "Target processes stopped (ports 3000 and 8000 only)"
    
    # Step 2: Install dependencies (unless skipped)
    if (-not $SkipDependencies) {
        Install-AllDependencies
    }
    else {
        Write-Log "Skipping dependency installation"
    }
    
    # Step 3: Initialize database
    Initialize-Database
    
    # Step 4: Start services
    Start-BothServices $Environment
    
    # Step 5: Wait for services to be ready
    Write-Header "=== Step 5: Verifying Services ==="
    Start-Sleep 5  # Give services time to start
    
    Wait-ForService "http://localhost:8000/api/health" "Backend API" 30
    Wait-ForService "http://localhost:3000" "Frontend App" 30
    
    Write-Success "All services are running"
    
    # Step 6: Show final status
    Show-FinalStatus
    
    Write-Success "Restart completed successfully!"
}

# Set environment variable
$env:NODE_ENV = $Environment

# Run main function
Start-Restart
