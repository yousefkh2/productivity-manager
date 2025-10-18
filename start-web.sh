#!/bin/bash

# Hardmode Pomo - Web App Startup Script
# This starts both the Go backend and React frontend

echo "🚀 Starting Hardmode Pomo Web App..."
echo ""

# Check if backend is already running
if pgrep -f "go run main.go" > /dev/null; then
    echo "✓ Backend already running on http://localhost:8080"
else
    echo "▶ Starting Go backend..."
    cd backend
    go run main.go > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    sleep 2
    echo "✓ Backend started on http://localhost:8080 (PID: $BACKEND_PID)"
fi

echo ""

# Check if frontend is already running
if lsof -i:5173 > /dev/null 2>&1; then
    echo "✓ Frontend already running on http://localhost:5173"
else
    echo "▶ Starting React frontend..."
    cd frontend
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    sleep 3
    echo "✓ Frontend started on http://localhost:5173 (PID: $FRONTEND_PID)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Hardmode Pomo is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Open your browser to: http://localhost:5173"
echo ""
echo "📊 Backend API: http://localhost:8080"
echo "📝 Logs: logs/backend.log and logs/frontend.log"
echo ""
echo "To stop:"
echo "  pkill -f 'go run main.go'  # Stop backend"
echo "  pkill -f 'vite'            # Stop frontend"
echo ""
echo "Press Ctrl+C to exit this script (servers will keep running)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
