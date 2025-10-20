# Crypto Orderbook Startup Guide

## Quick Start

### Windows
1. Double-click the desktop shortcut **OR** run `start.bat`
2. Wait for the browser to open automatically
3. Click the **red X button** in the top-left of the web interface to shut down everything

### macOS / Linux
1. Open Terminal
2. Navigate to the project directory
3. Run: `./start.sh`
4. Wait for the browser to open automatically
5. Click the **red X button** in the top-left of the web interface to shut down everything

## What Happens

### Startup:
- Backend (Go) starts in a separate terminal window
- Frontend (Vite dev server) starts in another terminal window
- Browser opens to http://localhost:5173
- Launcher window closes automatically after 3 seconds

### Shutdown (via red X button):
- Frontend sends shutdown signal to backend
- Backend gracefully closes all exchange connections
- Backend kills the frontend dev server process
- All terminal windows close automatically
- Browser tab attempts to close

## Ports Used

- **Backend WebSocket**: ws://localhost:8086
- **Frontend Dev Server**: http://localhost:5173

## Manual Shutdown

If you need to manually stop the application:

### Windows:
```cmd
taskkill /F /IM go.exe
taskkill /F /FI "WINDOWTITLE eq *Crypto Orderbook*"
```

### macOS/Linux:
```bash
pkill -f "go run"
pkill -f "npm run dev"
# Or kill by port:
lsof -ti:8086 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

## Troubleshooting

**Browser doesn't open automatically:**
- Manually open: http://localhost:5173

**Terminal windows don't close:**
- Restart the application using the startup script
- Make sure you clicked the red X button in the browser

**Port already in use:**
- Make sure no other instances are running
- Use the manual shutdown commands above
