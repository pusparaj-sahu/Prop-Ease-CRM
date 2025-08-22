@echo off
echo Starting PropEase CRM Development Environment...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd PropEase-CRM && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:4000/api
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
