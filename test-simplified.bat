@echo off
echo === Testing Tasks 34 and 35 with Simplified Routes ===
echo.
echo Waiting 2 seconds for server to be ready...
timeout /t 2 /nobreak > nul
echo.

echo === Testing Basic Server Health ===
echo GET /api/health
curl -s http://localhost:8000/api/health
echo.
echo.

echo GET /api/debug  
curl -s http://localhost:8000/api/debug
echo.
echo.

echo === Testing Role Management (Task 34) ===
echo GET /api/roles
curl -s http://localhost:8000/api/roles
echo.
echo.

echo GET /api/roles/test
curl -s http://localhost:8000/api/roles/test
echo.
echo.

echo GET /api/roles/health
curl -s http://localhost:8000/api/roles/health
echo.
echo.

echo === Testing Points System (Task 35) ===
echo GET /api/points
curl -s http://localhost:8000/api/points
echo.
echo.

echo GET /api/points/test
curl -s http://localhost:8000/api/points/test
echo.
echo.

echo GET /api/points/config
curl -s http://localhost:8000/api/points/config
echo.
echo.

echo GET /api/points/health
curl -s http://localhost:8000/api/points/health
echo.
echo.

echo === Test Summary ===
echo.
echo If you see JSON responses above:
echo - Task 34: Advanced Role Management system is working
echo - Task 35: Points and Scoring system is working
echo.
echo Both tasks were already completed according to your tasks.json file!
echo.
pause
