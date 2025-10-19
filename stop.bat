@echo off
echo Stopping Crypto Orderbook...
echo.

REM Kill processes on port 8086 (backend)
echo Stopping backend (port 8086)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8086') do (
    taskkill //F //PID %%a 2>nul
)

REM Kill processes on port 5173 (frontend)
echo Stopping frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill //F //PID %%a 2>nul
)

echo.
echo Done! All processes stopped.
pause
