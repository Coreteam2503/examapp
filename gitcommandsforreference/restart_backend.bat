@echo off
echo [RESTART] Stopping backend process...

REM Kill process on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo Found process %%a on port 8000
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill by PID file if it exists
if exist "logs\backend.pid" (
    set /p PID=<logs\backend.pid
    echo Killing PID !PID!
    taskkill /PID !PID! /F >nul 2>&1
    del logs\backend.pid
)

echo [RESTART] Starting backend with fallback quiz generator...
cd backend
start "Backend Server" node src/server.js

echo [SUCCESS] Backend restart initiated!
echo [INFO] Check logs\backend.log for startup messages
echo [INFO] Backend API: http://localhost:8000/api
echo [INFO] Health Check: http://localhost:8000/api/health

pause