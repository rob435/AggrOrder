#!/bin/bash

echo "Starting Crypto Orderbook..."
echo ""

# Start the Go backend in the background
echo "[1/3] Starting Go backend..."
go run ./cmd/main.go &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 3

# Start the frontend in the background
echo "[2/3] Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

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
echo "Press Ctrl+C to stop the application."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to catch Ctrl+C
trap cleanup INT

# Wait for processes
wait
