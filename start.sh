#!/bin/bash

echo "Starting Crypto Orderbook..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Start the Go backend in the background
echo "[1/3] Starting Go backend..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - run in background with nohup
    cd "$SCRIPT_DIR" && nohup go run ./cmd/main.go > /dev/null 2>&1 &
    BACKEND_PID=$!
else
    # Linux
    gnome-terminal --title="Crypto Orderbook - Backend" -- bash -c "cd '$SCRIPT_DIR' && go run ./cmd/main.go; exit" 2>/dev/null || \
    xterm -T "Crypto Orderbook - Backend" -e "bash -c 'cd $SCRIPT_DIR && go run ./cmd/main.go; exit'" &
fi

# Wait for backend to start
sleep 3

# Start the frontend in the background
echo "[2/3] Starting frontend..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - run in background with nohup
    cd "$SCRIPT_DIR/frontend" && nohup npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
else
    # Linux
    gnome-terminal --title="Crypto Orderbook - Frontend" -- bash -c "cd '$SCRIPT_DIR/frontend' && npm run dev; exit" 2>/dev/null || \
    xterm -T "Crypto Orderbook - Frontend" -e "bash -c 'cd $SCRIPT_DIR/frontend && npm run dev; exit'" &
fi

# Wait for frontend to start
sleep 5

# Open the browser
echo "[3/3] Opening browser..."
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:5173
else
    echo "Please open http://localhost:5173 in your browser"
fi

echo ""
echo "Done! The application is running."
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "- Backend: ws://localhost:8086 (PID: $BACKEND_PID)"
    echo "- Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
else
    echo "- Backend: ws://localhost:8086"
    echo "- Frontend: http://localhost:5173"
fi
echo ""
echo "Click the red X button in the browser to shut down everything."

# Auto-close terminal on Mac
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Closing this window in 2 seconds..."
    sleep 2
    osascript -e 'tell application "Terminal" to close first window' & exit
else
    echo "You can close this window."
fi
