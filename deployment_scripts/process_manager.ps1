# Process Management Utility (Windows PowerShell)
# Handles killing application-specific processes

# Colors for output
function Write-Log { param($Message) Write-Host "[PROCESS] $Message" -ForegroundColor Cyan }
function Write-Error-Log { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning-Log { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

# Function to kill processes by pattern
function Stop-ProcessByPattern {
    param(
        [string]$Pattern,
        [string]$ServiceName = "Process"
    )
    
    Write-Log "Cleaning up $ServiceName processes..."
    
    try {
        $Processes = Get-Process | Where-Object { $_.ProcessName -like "*$Pattern*" -or $_.CommandLine -like "*$Pattern*" }
        
        if ($Processes) {
            Write-Log "Found $ServiceName processes: $($Processes.Id -join ', ')"
            
            foreach ($Process in $Processes) {
                try {
                    # Graceful termination
                    Write-Log "Attempting graceful shutdown of process $($Process.Id)"
                    $Process.CloseMainWindow() | Out-Null
                    Start-Sleep 2
                    
                    # Check if still running
                    $StillRunning = Get-Process -Id $Process.Id -ErrorAction SilentlyContinue
                    if ($StillRunning) {
                        Write-Warning-Log "Force killing process $($Process.Id)"
                        Stop-Process -Id $Process.Id -Force
                    }
                }
                catch {
                    Write-Warning-Log "Error stopping process $($Process.Id): $($_.Exception.Message)"
                }
            }
            
            Write-Success "$ServiceName processes cleaned up"
        }
        else {
            Write-Log "No $ServiceName processes found"
        }
    }
    catch {
        Write-Error-Log "Error cleaning up $ServiceName processes: $($_.Exception.Message)"
    }
}

# Function to stop PM2 processes (if PM2 is installed)
function Stop-PM2Processes {
    if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
        Write-Log "PM2 not installed, skipping"
        return
    }
    
    Write-Log "Stopping specific PM2 processes..."
    
    try {
        # Only stop our specific PM2 processes
        & pm2 stop agentic-mesh-backend 2>$null
        & pm2 stop agentic-mesh-frontend 2>$null
        & pm2 delete agentic-mesh-backend 2>$null
        & pm2 delete agentic-mesh-frontend 2>$null
        
        Write-Success "Specific PM2 processes cleaned up"
    }
    catch {
        Write-Warning-Log "Error stopping PM2 processes: $($_.Exception.Message)"
    }
}

# Function to stop only PID-tracked processes from our logs
function Stop-TrackedProcesses {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectRoot = Split-Path -Parent $ScriptDir
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
                }
                else {
                    Write-Log "Backend PID file exists but process not running"
                }
            }
            Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
        }
        catch {
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
                }
                else {
                    Write-Log "Frontend PID file exists but process not running"
                }
            }
            Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
        }
        catch {
            Write-Warning-Log "Error stopping frontend process: $($_.Exception.Message)"
            Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
        }
    }
}

# Function to stop application processes - ONLY port-based killing now
function Stop-AppProcesses {
    Write-Log "Stopping application processes (port-based only)..."
    
    # First try to stop tracked processes cleanly
    Stop-TrackedProcesses
    
    # Stop PM2 processes (only our specific ones)
    Stop-PM2Processes
    
    # Note: We no longer kill by pattern to avoid affecting other services
    # Port-specific killing is handled in the main scripts
    
    Write-Success "Application processes stop sequence completed"
}

# Main function when script is called directly
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    param(
        [Parameter(Position=0)]
        [ValidateSet("pattern", "pm2", "tracked", "all")]
        [string]$Action,
        
        [Parameter(Position=1)]
        [string]$Pattern,
        
        [Parameter(Position=2)]
        [string]$ServiceName = "Process"
    )
    
    switch ($Action) {
        "pattern" {
            if (-not $Pattern) {
                Write-Host "Usage: .\process_manager.ps1 pattern <pattern> [service_name]" -ForegroundColor White
                exit 1
            }
            Stop-ProcessByPattern $Pattern $ServiceName
        }
        "pm2" {
            Stop-PM2Processes
        }
        "tracked" {
            Stop-TrackedProcesses
        }
        "all" {
            Stop-AppProcesses
        }
        default {
            Write-Host "Usage: .\process_manager.ps1 {pattern|pm2|tracked|all} [options]" -ForegroundColor White
            Write-Host ""
            Write-Host "Commands:" -ForegroundColor White
            Write-Host "  pattern <pattern> [name]  Kill processes matching pattern"
            Write-Host "  pm2                       Stop specific PM2 processes"
            Write-Host "  tracked                   Stop processes tracked in PID files"
            Write-Host "  all                       Stop application processes (safe mode)"
            exit 1
        }
    }
}
