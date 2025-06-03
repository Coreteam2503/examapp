@echo off
REM Windows Batch wrapper for service_starter.ps1

echo Starting services...
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not installed or not in PATH
    echo Please install PowerShell to use this script
    pause
    exit /b 1
)

REM Navigate to script directory
cd /d "%~dp0"

REM Run the PowerShell script with parameters
powershell -ExecutionPolicy Bypass -File "service_starter.ps1" %*

pause
