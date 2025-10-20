#!/bin/bash

echo "Starting Crypto Orderbook..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Start the Go backend in the background
echo "[1/3] Starting Go backend..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "cd '"$SCRIPT_DIR"' && go run ./cmd/main.go; exit"'
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
    # macOS
    osascript -e 'tell app "Terminal" to do script "cd '"$SCRIPT_DIR/frontend"' && npm run dev; exit"'
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
echo "- Backend: ws://localhost:8086"
echo "- Frontend: http://localhost:5173"
echo ""
echo "Click the red X button in the browser to shut down everything."
echo "This window will close in 3 seconds..."
sleep 3
exit
