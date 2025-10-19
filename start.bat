@echo off
echo Starting Crypto Orderbook...
echo.

REM Start the Go backend in a new window
echo [1/3] Starting Go backend...
start "Crypto Orderbook - Backend" cmd /k "cd /d %~dp0 && go run ./cmd/main.go"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start the frontend in a new window
echo [2/3] Starting frontend...
start "Crypto Orderbook - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

REM Open the browser
echo [3/3] Opening browser...
start http://localhost:5173

echo.
echo Done! The application is running.
echo - Backend: ws://localhost:8086
echo - Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the application.
pause
