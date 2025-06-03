# Service Health Checker (Windows PowerShell)
# Checks if services are running and responding

# Colors for output
function Write-Log { param($Message) Write-Host "[HEALTH] $Message" -ForegroundColor Cyan }
function Write-Error-Log { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning-Log { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

# Function to wait for service to be ready
function Wait-ForService {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$MaxWait = 30
    )
    
    Write-Log "Waiting for $ServiceName to be ready..."
    
    $Count = 0
    
    while ($Count -lt $MaxWait) {
        try {
            $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                Write-Success "$ServiceName is ready!"
                return $true
            }
        }
        catch {
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

# Function to check if service is responding
function Test-ServiceHealth {
    param(
        [string]$Url,
        [string]$ServiceName
    )
    
    try {
        $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($Response.StatusCode -eq 200) {
            Write-Success "$ServiceName is responding"
            return $true
        }
        else {
            Write-Error-Log "$ServiceName returned status code: $($Response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Error-Log "$ServiceName is not responding: $($_.Exception.Message)"
        return $false
    }
}

# Function to get service status
function Get-ServiceStatus {
    param(
        [int]$Port,
        [string]$ServiceName,
        [string]$Url
    )
    
    # Import port manager functions
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    . "$ScriptDir\port_manager.ps1"
    
    $ProcessId = Get-ProcessOnPort $Port
    
    if ($ProcessId) {
        try {
            $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                Write-Success "$ServiceName is running (PID: $ProcessId) ✅"
                return $true
            }
            else {
                Write-Warning-Log "$ServiceName process found but not responding (PID: $ProcessId) ⚠️"
                return $false
            }
        }
        catch {
            Write-Warning-Log "$ServiceName process found but not responding (PID: $ProcessId) ⚠️"
            return $false
        }
    }
    else {
        Write-Error-Log "$ServiceName is not running ❌"
        return $false
    }
}

# Function to check all application services
function Test-AllServices {
    Write-Log "Checking all services..."
    
    $BackendOk = $false
    $FrontendOk = $false
    
    Write-Host ""
    Write-Host "🔧 Backend Service (Port 8000):"
    $BackendOk = Get-ServiceStatus 8000 "Backend API" "http://localhost:8000/api/health"
    
    Write-Host ""
    Write-Host "🌐 Frontend Service (Port 3000):"
    $FrontendOk = Get-ServiceStatus 3000 "Frontend App" "http://localhost:3000"
    
    Write-Host ""
    if ($BackendOk -and $FrontendOk) {
        Write-Success "All services are running properly"
        return $true
    }
    else {
        Write-Warning-Log "Some services are not running properly"
        return $false
    }
}

# Main function when script is called directly
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    param(
        [Parameter(Position=0)]
        [ValidateSet("wait", "check", "status", "all")]
        [string]$Action,
        
        [Parameter(Position=1)]
        [string]$Url,
        
        [Parameter(Position=2)]
        [string]$ServiceName,
        
        [Parameter(Position=3)]
        [int]$PortOrTimeout,
        
        [Parameter(Position=4)]
        [int]$Timeout = 30
    )
    
    switch ($Action) {
        "wait" {
            if (-not $Url -or -not $ServiceName) {
                Write-Host "Usage: .\health_checker.ps1 wait <url> <service_name> [timeout]" -ForegroundColor White
                exit 1
            }
            $TimeoutValue = if ($PortOrTimeout) { $PortOrTimeout } else { 30 }
            Wait-ForService $Url $ServiceName $TimeoutValue
        }
        "check" {
            if (-not $Url -or -not $ServiceName) {
                Write-Host "Usage: .\health_checker.ps1 check <url> <service_name>" -ForegroundColor White
                exit 1
            }
            Test-ServiceHealth $Url $ServiceName
        }
        "status" {
            if (-not $PortOrTimeout -or -not $ServiceName -or -not $Url) {
                Write-Host "Usage: .\health_checker.ps1 status <port> <service_name> <url>" -ForegroundColor White
                exit 1
            }
            Get-ServiceStatus $PortOrTimeout $ServiceName $Url
        }
        "all" {
            Test-AllServices
        }
        default {
            Write-Host "Usage: .\health_checker.ps1 {wait|check|status|all} [options]" -ForegroundColor White
            Write-Host ""
            Write-Host "Commands:" -ForegroundColor White
            Write-Host "  wait <url> <name> [timeout]   Wait for service to be ready"
            Write-Host "  check <url> <name>            Check if service responds"
            Write-Host "  status <port> <name> <url>    Get service status"
            Write-Host "  all                           Check all application services"
            exit 1
        }
    }
}
