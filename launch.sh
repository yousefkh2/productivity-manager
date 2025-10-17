#!/bin/bash
# Quick launcher for Hardmode Pomodoro
# Double-click this file (or run it) to start everything

cd "$(dirname "$0")"

echo "🚀 Starting Hardmode Pomodoro..."
echo ""

# Check if backend is running
if ! lsof -i :8080 >/dev/null 2>&1; then
    echo "📡 Starting backend API..."
    ./dev.sh start
    sleep 2
else
    echo "✓ Backend already running"
fi

# Start desktop app
echo "🖥️  Starting desktop app..."
echo ""
source .venv/bin/activate
python -m hardmode.main
