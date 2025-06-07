@echo off
REM Windows Batch wrapper for restart.ps1

echo Starting Agentic Mesh Quiz App...
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
if "%1"=="--production" (
    powershell -ExecutionPolicy Bypass -File "restart.ps1" -Production
) else if "%1"=="--development" (
    powershell -ExecutionPolicy Bypass -File "restart.ps1" -Development
) else if "%1"=="--skip-deps" (
    powershell -ExecutionPolicy Bypass -File "restart.ps1" -SkipDeps
) else if "%1"=="--help" (
    powershell -ExecutionPolicy Bypass -File "restart.ps1" -Help
) else (
    powershell -ExecutionPolicy Bypass -File "restart.ps1" %*
)

pause
