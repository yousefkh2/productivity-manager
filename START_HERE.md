# 🎯 Ready to Use Tomorrow! - Quick Start Guide

## What's Ready

✅ **Your Hardmode Pomodoro app is fully integrated!**
- Desktop app works perfectly
- All data stored locally (with focus scores, notes, etc.)
- Automatically syncs to API (cloud-ready!)
- Shows connection status in UI
- Works offline seamlessly

## How to Start Using It Tomorrow

### 1. Start the Backend (One-Time Setup)

```bash
cd /home/yousef/Desktop/Project/hardmode-pomo
./dev.sh start
```

This starts the Go API backend on your computer. It will keep running in the background.

**💡 Tip**: Add this to your startup script so it runs automatically!

### 2. Start Your Pomodoro App

```bash
cd /home/yousef/Desktop/Project/hardmode-pomo
source .venv/bin/activate
python -m hardmode.main
```

That's it! You'll see:
- "☁️ Connected to API - Data syncing" at the bottom (green)
- Or "📴 Offline - Data stored locally" if backend isn't running

### 3. Use It Normally!

Everything works exactly as before, but now:
- **Every pomodoro** you complete → Synced to API
- **Every task** you work on → Stored in both places
- **All your data** → Ready for cloud deployment

## What Gets Stored Where

### Local Database (Rich Data)
Your `my_database.db` stores **everything**:
- Days with target/finished pomos
- Pomodoros with focus scores (1-5)
- Detailed notes and reasons
- Context switches
- Event logs
- Full history for analysis

### API Database (Cloud-Ready)
The API stores **simplified data** for cloud access:
- Tasks (what you worked on)
- Sessions (when and how long)
- Basic statistics

**Why both?** 
- Local = Rich data for YOUR analysis
- API = Shareable data for cloud access
- Best of both worlds!

## Connection Status

### When Online (☁️ Connected)
- Every pomodoro syncs to API automatically
- You can see your data from anywhere (when deployed to cloud)
- Full functionality

### When Offline (📴 Offline)
- Everything still works perfectly!
- Data saved locally
- Will sync when you reconnect

## Analyzing Your Data

### Local Analysis (Rich Data)

```bash
# Connect to your database
sqlite3 my_database.db

# See all your pomodoros with focus scores
SELECT 
    date,
    task,
    focus_score,
    note,
    ROUND(duration_sec/60.0, 1) as minutes
FROM pomo p
JOIN day d ON p.day_id = d.id
WHERE aborted = 0
ORDER BY p.start_time DESC
LIMIT 10;

# Average focus score by task
SELECT 
    task,
    AVG(focus_score) as avg_focus,
    COUNT(*) as sessions,
    SUM(duration_sec)/60 as total_minutes
FROM pomo
WHERE aborted = 0 AND focus_score IS NOT NULL
GROUP BY task
ORDER BY avg_focus DESC;

# Your productivity by day
SELECT 
    date,
    target_pomos,
    finished_pomos,
    ROUND(100.0 * finished_pomos / target_pomos, 1) as completion_rate
FROM day
ORDER BY date DESC;
```

### API Analysis (Cloud Data)

```bash
# Check your stats via API
curl http://localhost:8080/api/statistics

# See all tasks
curl http://localhost:8080/api/tasks

# See all sessions
curl http://localhost:8080/api/sessions
```

## Tips for Tomorrow

### 🔥 Best Practice
Start your day with:
```bash
./dev.sh start    # Start backend
./dev.sh desktop  # Start app
```

### 🎯 Set Your Target
- Set target pomodoros (default 8)
- Name your task clearly
- Start focusing!

### 📊 Review Your Progress
At end of day:
```bash
# Quick stats
curl http://localhost:8080/api/statistics

# Or check database directly
sqlite3 my_database.db "SELECT * FROM v_day_summary WHERE date = date('now')"
```

### 💾 Backup Your Data
```bash
# Backup local database
cp my_database.db my_database_backup_$(date +%Y%m%d).db

# Or export to SQL
sqlite3 my_database.db .dump > backup.sql
```

## When You're Ready for Cloud

Later, when you want cloud access:

1. **Deploy backend** (see DEPLOYMENT.md)
   ```bash
   # Deploy to Render/Railway/Fly.io
   # Takes ~15 minutes
   ```

2. **Update API URL**
   ```bash
   export API_URL=https://your-app.onrender.com
   python -m hardmode.main
   ```

3. **All your data syncs automatically!**
   - Existing data uploads to cloud
   - Future pomodoros sync in real-time
   - Access from any computer

## Troubleshooting

### Backend Not Running?
```bash
./dev.sh status  # Check status
./dev.sh restart # Restart backend
./dev.sh logs    # Check logs
```

### App Shows Offline?
1. Check if backend is running: `./dev.sh status`
2. Test API: `curl http://localhost:8080/health`
3. Restart backend: `./dev.sh restart`

### Data Not Syncing?
- App works fine offline
- When backend restarts, pending data syncs automatically
- Check sync status: `python3 test_integration.py`

## Features You Have Now

✅ **Hardmode Timer** - Can't stop once started!  
✅ **Focus Tracking** - Rate your focus (1-5)  
✅ **Context Switch Detection** - Track interruptions  
✅ **Daily Targets** - Set and track goals  
✅ **Task Management** - Name what you're working on  
✅ **Notes & Reasons** - Document your sessions  
✅ **Event Logging** - Track everything  
✅ **Statistics** - Local and API stats  
✅ **Cloud-Ready** - Deploy anytime  
✅ **Offline Support** - Works without internet  
✅ **Auto-Sync** - Seamless data sync  

## Your Data Journey

```
You complete a Pomodoro
         ↓
Saved locally (rich data: focus score, notes, etc.)
         ↓
Synced to API (simplified: task, session duration)
         ↓
Ready for cloud deployment
         ↓
(Later) Deploy to cloud
         ↓
Access your stats from anywhere!
```

## Advanced: Auto-Start Backend

To start backend automatically on login:

### Linux (systemd)
```bash
# Create service file
cat > ~/.config/systemd/user/hardmode-backend.service << 'EOF'
[Unit]
Description=Hardmode Pomodoro Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/yousef/Desktop/Project/hardmode-pomo/backend
ExecStart=/usr/bin/go run main.go
Restart=always

[Install]
WantedBy=default.target
EOF

# Enable and start
systemctl --user enable hardmode-backend
systemctl --user start hardmode-backend
```

### Or Simple Cron
```bash
# Add to crontab
@reboot cd /home/yousef/Desktop/Project/hardmode-pomo && ./dev.sh start
```

## Summary

**Tomorrow morning:**
1. `./dev.sh start` (or it auto-starts!)
2. `./dev.sh desktop`
3. **Start being productive!** 🚀

**Everything you do** is:
- ✅ Saved locally with rich detail
- ✅ Synced to API for cloud access
- ✅ Ready for deployment anytime
- ✅ Available for self-analysis

**Your productivity data is safe, synchronized, and ready to go anywhere!**

---

**Questions? Check:**
- `README.md` - General documentation
- `INTEGRATION.md` - Technical details
- `DEPLOYMENT.md` - Cloud deployment guide
- `PROJECT_SUMMARY.md` - Complete overview

**Happy focusing! 🎯**
