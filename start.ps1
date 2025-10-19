# Crypto Orderbook Startup Script
Write-Host "Starting Crypto Orderbook..." -ForegroundColor Green
Write-Host ""

# Start the Go backend
Write-Host "[1/3] Starting Go backend..." -ForegroundColor Cyan
$backendPath = $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; go run ./cmd/main.go" -WindowStyle Normal

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start the frontend
Write-Host "[2/3] Starting frontend..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

# Wait for frontend to start
Start-Sleep -Seconds 5

# Open browser
Write-Host "[3/3] Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Done! The application is running." -ForegroundColor Green
Write-Host "- Backend: ws://localhost:8086" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Close the PowerShell windows to stop the application." -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit this window"
