# Port Management Utility (Windows PowerShell)
# Handles killing processes on specific ports

# Colors for output
function Write-Log { param($Message) Write-Host "[PORT] $Message" -ForegroundColor Cyan }
function Write-Error-Log { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning-Log { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

# Function to get process ID on a specific port
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

# Function to kill processes on a specific port
function Stop-ProcessOnPort {
    param(
        [int]$Port,
        [string]$ServiceName = "Service"
    )
    
    Write-Log "Cleaning up port $Port ($ServiceName)..."
    
    $ProcessId = Get-ProcessOnPort $Port
    
    if ($ProcessId) {
        Write-Log "Found process on port $Port with PID: $ProcessId"
        
        try {
            # Graceful termination
            $Process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
            if ($Process) {
                Write-Log "Attempting graceful shutdown of process $ProcessId"
                $Process.CloseMainWindow() | Out-Null
                Start-Sleep 2
                
                # Check if still running
                $Process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
                if ($Process) {
                    Write-Warning-Log "Force killing process $ProcessId"
                    Stop-Process -Id $ProcessId -Force
                    Start-Sleep 1
                }
            }
            
            # Final verification
            $FinalProcessId = Get-ProcessOnPort $Port
            if ($FinalProcessId) {
                Write-Error-Log "Failed to kill process on port $Port"
                return $false
            }
            else {
                Write-Success "Port $Port is now free"
                return $true
            }
        }
        catch {
            Write-Error-Log "Error killing process on port $Port`: $($_.Exception.Message)"
            return $false
        }
    }
    else {
        Write-Log "Port $Port is already free"
        return $true
    }
}

# Function to check if port is available
function Test-PortFree {
    param([int]$Port)
    
    $ProcessId = Get-ProcessOnPort $Port
    return ($ProcessId -eq $null)
}

# Function to wait for port to be free
function Wait-ForPortFree {
    param(
        [int]$Port,
        [int]$MaxWait = 10
    )
    
    $Count = 0
    
    while (-not (Test-PortFree $Port) -and $Count -lt $MaxWait) {
        Write-Log "Waiting for port $Port to be free... ($Count/$MaxWait)"
        Start-Sleep 1
        $Count++
    }
    
    if ($Count -eq $MaxWait) {
        Write-Error-Log "Port $Port is still in use after ${MaxWait}s"
        return $false
    }
    
    return $true
}

# Main function when script is called directly
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    param(
        [Parameter(Position=0)]
        [ValidateSet("kill", "check", "wait")]
        [string]$Action,
        
        [Parameter(Position=1)]
        [int]$Port,
        
        [Parameter(Position=2)]
        [string]$ServiceName = "Service",
        
        [Parameter(Position=3)]
        [int]$Timeout = 10
    )
    
    switch ($Action) {
        "kill" {
            if (-not $Port) {
                Write-Host "Usage: .\port_manager.ps1 kill <port> [service_name]" -ForegroundColor White
                exit 1
            }
            Stop-ProcessOnPort $Port $ServiceName
        }
        "check" {
            if (-not $Port) {
                Write-Host "Usage: .\port_manager.ps1 check <port>" -ForegroundColor White
                exit 1
            }
            if (Test-PortFree $Port) {
                Write-Success "Port $Port is free"
            }
            else {
                Write-Warning-Log "Port $Port is in use"
                $ProcessId = Get-ProcessOnPort $Port
                if ($ProcessId) {
                    $Process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
                    if ($Process) {
                        Write-Host "Process: $($Process.Name) (PID: $ProcessId)"
                    }
                }
            }
        }
        "wait" {
            if (-not $Port) {
                Write-Host "Usage: .\port_manager.ps1 wait <port> [timeout]" -ForegroundColor White
                exit 1
            }
            Wait-ForPortFree $Port $Timeout
        }
        default {
            Write-Host "Usage: .\port_manager.ps1 {kill|check|wait} <port> [options]" -ForegroundColor White
            Write-Host ""
            Write-Host "Commands:" -ForegroundColor White
            Write-Host "  kill <port> [name]     Kill processes on port"
            Write-Host "  check <port>           Check if port is free"
            Write-Host "  wait <port> [timeout]  Wait for port to be free"
            exit 1
        }
    }
}
