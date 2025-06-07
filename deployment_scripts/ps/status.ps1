# Status Script (Windows PowerShell)
# Shows the status of all application services

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Import utility functions
. "$ScriptDir\health_checker.ps1"

# Main status function
function Show-ApplicationStatus {
    Write-Host "=== Agentic Mesh Quiz App Status ===" -ForegroundColor Magenta
    Write-Host ""
    
    # Check all services
    Test-AllServices
    
    Write-Host ""
    Write-Host "Quick Commands:" -ForegroundColor Yellow
    Write-Host "  Start app: .\deployment_scripts\restart.ps1" -ForegroundColor Yellow
    Write-Host "  Stop app:  .\deployment_scripts\stop.ps1" -ForegroundColor Yellow
    Write-Host "  View logs: Get-Content logs\backend.log -Tail 20" -ForegroundColor Yellow
}

# Run the status function
Show-ApplicationStatus
