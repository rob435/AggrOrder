@echo off
echo Building and starting Crypto Orderbook...
echo.

REM Build the Go backend first
echo [1/4] Building Go backend...
go build -o orderbook.exe cmd/main.go
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

REM Start the built executable in a new window (closes when process exits)
echo [2/4] Starting backend...
start "Crypto Orderbook - Backend" cmd /c "cd /d %~dp0 && orderbook.exe"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start the frontend in a new window (closes when process exits)
echo [3/4] Starting frontend...
start "Crypto Orderbook - Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

REM Open the browser
echo [4/4] Opening browser...
start http://localhost:5173

echo.
echo Done! The application is running.
echo - Backend: ws://localhost:8086
echo - Frontend: http://localhost:5173
echo.
echo Click the red X button in the browser to shut down everything.
echo This window will close in 3 seconds...
timeout /t 3 /nobreak >nul
exit
