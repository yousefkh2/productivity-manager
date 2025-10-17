# Quick Reference Card

## Start the App
```bash
./launch.sh
```

## Manual Commands
```bash
./dev.sh start      # Start backend
./dev.sh desktop    # Start app
./dev.sh status     # Check status
./dev.sh test       # Test API
./dev.sh restart    # Restart backend
```

## Check Your Data
```bash
# API statistics
curl http://localhost:8080/api/statistics

# List tasks
curl http://localhost:8080/api/tasks

# List sessions
curl http://localhost:8080/api/sessions
```

## Query Local Database
```bash
sqlite3 my_database.db

# Today's pomodoros
SELECT * FROM pomo WHERE date(start_time) = date('now');

# Average focus score
SELECT AVG(focus_score) FROM pomo WHERE focus_score IS NOT NULL;

# Total time focused today
SELECT SUM(duration_sec)/60 FROM pomo 
WHERE date(start_time) = date('now') AND aborted = 0;
```

## Connection Status
- 🟢 "☁️ Connected to API" = Online, syncing
- 🟠 "📴 Offline" = Local only, will sync later

## Files to Read
1. `START_HERE.md` - Start here tomorrow!
2. `INTEGRATION_COMPLETE.md` - What you have
3. `DEPLOYMENT.md` - Deploy to cloud
4. `README.md` - Full docs

## Troubleshooting
```bash
# Backend not running?
./dev.sh restart

# Test integration
python3 test_integration.py

# Check logs
./dev.sh logs
```

## Deploy to Cloud (Later)
See `DEPLOYMENT.md` for full guide:
1. Push to GitHub
2. Deploy on Render/Railway
3. Update API_URL
4. Done! Access from anywhere

---
**Start tomorrow: `./launch.sh`** 🚀
