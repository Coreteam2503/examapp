@echo off
echo Testing API Endpoints for Tasks 34 and 35...
echo.
echo Waiting 3 seconds for server to be ready...
timeout /t 3 /nobreak > nul
echo.

echo === Testing Role Management API (Task 34) ===
echo GET /api/roles
curl -s http://localhost:8000/api/roles
echo.
echo.

echo GET /api/roles/permissions  
curl -s http://localhost:8000/api/roles/permissions
echo.
echo.

echo === Testing Points System API (Task 35) ===
echo GET /api/points/config
curl -s http://localhost:8000/api/points/config
echo.
echo.

echo GET /api/points/global-stats
curl -s http://localhost:8000/api/points/global-stats
echo.
echo.

echo GET /api/health
curl -s http://localhost:8000/api/health
echo.
echo.

echo === Testing Complete ===
echo If you see JSON responses above, both systems are working!
echo If you see connection errors, make sure the backend is running.
pause
