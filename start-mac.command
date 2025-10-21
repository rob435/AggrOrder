#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Starting Crypto Orderbook..."
echo ""

# Start the Go backend in the background
echo "[1/3] Starting Go backend..."
cd "$SCRIPT_DIR" && nohup go run ./cmd/main.go > /dev/null 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start the frontend in the background
echo "[2/3] Starting frontend..."
cd "$SCRIPT_DIR/frontend" && nohup npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Open the browser
echo "[3/3] Opening browser..."
open http://localhost:5173

echo ""
echo "Done! The application is running."
echo "- Backend: ws://localhost:8086 (PID: $BACKEND_PID)"
echo "- Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "Click the red X button in the browser to shut down everything."
echo ""

# Close this terminal window
osascript -e 'tell application "Terminal" to close (every window whose name contains "start-mac.command")' &
exit
