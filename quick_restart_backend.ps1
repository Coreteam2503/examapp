# Quick restart backend script
param()

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"
$LogsDir = Join-Path $ProjectRoot "logs"

# Colors for output
function Write-Log { param($Message) Write-Host "[RESTART] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning-Log { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

Write-Log "Restarting backend with fallback quiz generator..."

# Kill existing backend process
$BackendPidFile = Join-Path $LogsDir "backend.pid"
if (Test-Path $BackendPidFile) {
    $BackendPid = Get-Content $BackendPidFile -ErrorAction SilentlyContinue
    if ($BackendPid) {
        $Process = Get-Process -Id $BackendPid -ErrorAction SilentlyContinue
        if ($Process) {
            Write-Log "Stopping backend process (PID: $BackendPid)"
            $Process.CloseMainWindow() | Out-Null
            Start-Sleep 2
            $Process = Get-Process -Id $BackendPid -ErrorAction SilentlyContinue
            if ($Process) {
                Write-Warning-Log "Force killing backend process"
                Stop-Process -Id $BackendPid -Force
            }
            Write-Success "Backend process stopped"
        }
    }
    Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
}

# Also kill anything on port 8000
try {
    $Connection = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($Connection) {
        $ProcessId = $Connection.OwningProcess
        $Process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if ($Process) {
            Write-Log "Killing process on port 8000 (PID: $ProcessId)"
            Stop-Process -Id $ProcessId -Force
            Start-Sleep 1
        }
    }
} catch {
    # Port not in use, continue
}

# Start backend
Push-Location $BackendDir

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

Write-Log "Starting backend with fallback quiz generator..."
$Process = Start-Process -FilePath "node" -ArgumentList "src/server.js" -PassThru -RedirectStandardOutput "$LogsDir\backend.log" -RedirectStandardError "$LogsDir\backend_error.log" -WindowStyle Hidden
$Process.Id | Out-File "$LogsDir\backend.pid" -Encoding UTF8
Write-Success "Backend restarted (PID: $($Process.Id))"

Pop-Location

Write-Success "Backend restart completed! Quiz generation should now work with the fallback generator."
Write-Log "Backend API: http://localhost:8000/api"
Write-Log "Health Check: http://localhost:8000/api/health"
