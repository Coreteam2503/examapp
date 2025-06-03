# Quick Backend Restart Script
Write-Host "[RESTART] Stopping backend process..." -ForegroundColor Cyan

# Kill process on port 8000
try {
    $Connection = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($Connection) {
        $ProcessId = $Connection.OwningProcess
        Write-Host "Found process $ProcessId on port 8000" -ForegroundColor Yellow
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Process stopped" -ForegroundColor Green
    }
} catch {
    Write-Host "No process found on port 8000" -ForegroundColor Gray
}

# Kill by PID file if it exists
$PidFile = "logs\backend.pid"
if (Test-Path $PidFile) {
    $PID = Get-Content $PidFile -ErrorAction SilentlyContinue
    if ($PID) {
        Write-Host "Killing tracked PID: $PID" -ForegroundColor Yellow
        Stop-Process -Id $PID -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "[RESTART] Starting backend with fallback quiz generator..." -ForegroundColor Cyan
Set-Location backend

# Start backend and capture PID
$Process = Start-Process -FilePath "node" -ArgumentList "src/server.js" -PassThru -WindowStyle Normal
$Process.Id | Out-File "..\logs\backend.pid" -Encoding UTF8

Write-Host "[SUCCESS] Backend restarted (PID: $($Process.Id))!" -ForegroundColor Green
Write-Host "[INFO] Backend API: http://localhost:8000/api" -ForegroundColor White
Write-Host "[INFO] Health Check: http://localhost:8000/api/health" -ForegroundColor White
Write-Host "[INFO] Check logs\backend.log for startup messages" -ForegroundColor White

Set-Location ..
Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
Read-Host