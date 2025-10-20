@echo off
cd /d "%~dp0"
echo Building orderbook...
go build -o orderbook.exe cmd/main.go
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)
echo Starting orderbook...
start /wait orderbook.exe
exit
