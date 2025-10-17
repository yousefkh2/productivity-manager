#!/usr/bin/env bash
# Test script for single instance lock

set -e

echo "🧪 Testing Single Instance Lock..."
echo ""

# Clean up any existing instances and lock files
echo "1. Cleaning up..."
pkill -f "python -m hardmode.main" 2>/dev/null || true
rm -f /tmp/hardmode-pomo.lock
sleep 1

# Start first instance in background
echo "2. Starting first instance..."
cd /home/yousef/Desktop/Project/hardmode-pomo
source .venv/bin/activate
python -m hardmode.main > /tmp/instance1.log 2>&1 &
FIRST_PID=$!
echo "   First instance PID: $FIRST_PID"
sleep 2

# Check if first instance is running
if ps -p $FIRST_PID > /dev/null; then
    echo "   ✓ First instance is running"
else
    echo "   ❌ First instance failed to start"
    exit 1
fi

# Try to start second instance
echo ""
echo "3. Attempting to start second instance..."
echo "   (This should FAIL with an error message)"
echo ""

if python -m hardmode.main 2>&1 | head -5; then
    echo ""
    echo "   ❌ PROBLEM: Second instance started (it shouldn't!)"
    pkill -f "python -m hardmode.main"
    exit 1
else
    EXIT_CODE=$?
    echo ""
    echo "   ✓ SUCCESS: Second instance was blocked (exit code: $EXIT_CODE)"
fi

# Cleanup
echo ""
echo "4. Cleaning up..."
kill $FIRST_PID 2>/dev/null || true
pkill -f "python -m hardmode.main" 2>/dev/null || true
rm -f /tmp/hardmode-pomo.lock /tmp/instance1.log

echo ""
echo "✅ Test complete! Single instance lock is working."
