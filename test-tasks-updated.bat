@echo off
echo === Testing Tasks 34 and 35 Implementation ===
echo.
echo Waiting 2 seconds for server to be ready...
timeout /t 2 /nobreak > nul
echo.

echo === Testing Health Check ===
echo GET /api/health
curl -s http://localhost:8000/api/health
echo.
echo.

echo === Testing Role Management API (Task 34) ===
echo GET /api/roles/test
curl -s http://localhost:8000/api/roles/test
echo.
echo.

echo GET /api/roles (basic endpoint)
curl -s http://localhost:8000/api/roles
echo.
echo.

echo GET /api/roles/permissions
curl -s http://localhost:8000/api/roles/permissions
echo.
echo.

echo === Testing Points System API (Task 35) ===
echo GET /api/points/test
curl -s http://localhost:8000/api/points/test
echo.
echo.

echo GET /api/points/config
curl -s http://localhost:8000/api/points/config
echo.
echo.

echo GET /api/points/global-stats-public
curl -s http://localhost:8000/api/points/global-stats-public
echo.
echo.

echo === Testing Complete ===
echo.
echo If you see JSON responses above without errors, both Task 34 and Task 35 are working!
echo.
echo Summary:
echo - Task 34 (Advanced Role Management): Should show role system status
echo - Task 35 (Points and Scoring System): Should show points system configuration
echo.
echo To restart the backend with changes, press Ctrl+C in the backend window, then run start-backend.bat again.
echo.
pause
