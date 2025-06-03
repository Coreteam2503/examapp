# Stop Script (Windows PowerShell)
# Stops all application services

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Colors for output
function Write-Log { param($Message) Write-Host "[STOP] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Header { param($Message) Write-Host $Message -ForegroundColor Magenta }

# Import utility functions
. "$ScriptDir\port_manager.ps1"
. "$ScriptDir\process_manager.ps1"

# Main stop function
function Stop-Application {
    Write-Header "=== Stopping Agentic Mesh Quiz App ==="
    
    # Stop tracked processes first
    Stop-TrackedProcesses
    
    # Kill processes on specific ports
    Stop-ProcessOnPort 3000 "Frontend"
    Stop-ProcessOnPort 8000 "Backend"
    
    # Stop PM2 processes
    Stop-PM2Processes
    
    Write-Success "Application stopped successfully!"
    
    Write-Host ""
    Write-Host "To start the application again, run:" -ForegroundColor Yellow
    Write-Host "  .\deployment_scripts\restart.ps1" -ForegroundColor Yellow
}

# Run the stop function
Stop-Application
