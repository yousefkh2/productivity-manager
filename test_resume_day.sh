#!/usr/bin/env bash
# Test script to verify day state restoration

echo "🧪 Testing Day State Restoration..."
echo ""

cd /home/yousef/Desktop/Project/hardmode-pomo
source .venv/bin/activate

# Get today's date
TODAY=$(date +%Y-%m-%d)

echo "1. Checking current state for $TODAY..."
sqlite3 my_database.db "
  SELECT 
    date, 
    target_pomos, 
    finished_pomos, 
    CASE WHEN day_rating IS NULL THEN 'Active' ELSE 'Ended' END as status
  FROM day 
  WHERE date = '$TODAY'
" || echo "   No record for today yet"

echo ""
echo "2. Starting app..."
echo "   - If today exists and not ended: Should resume (no dialogs)"
echo "   - If today doesn't exist or ended: Should show daily intent"
echo ""
echo "   Check the app behavior!"
echo ""

# Start app in background to check console output
python -m hardmode.main
