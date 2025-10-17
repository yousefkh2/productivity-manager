# 🚀 Quick Start Guide - Cloud-Enabled Hardmode Pomodoro

## What You Have Now

A **fully cloud-enabled productivity tracker** that syncs across all your devices! ✨

## Start Using in 3 Steps

### Step 1: Start the Backend

```bash
cd backend
go run main.go
```

You should see:
```
🚀 Server starting on port 8080...
```

### Step 2: Launch the App

```bash
python -m hardmode.main
```

### Step 3: Start Working!

1. **Set your daily goal** (default: 16 pomodoros)
2. **Plan your tasks** - Click "+ Add Task" to add tasks with estimates
3. **Start focus** - Click "Start focus" to begin a 25-minute pomodoro
4. **Sync your data** - Click the green "☁️ Sync" button to backup to cloud
5. **End your day** - Click "🌙 End Day" to save reflection

## Features at a Glance

### 🎯 Daily Planning
- Set target pomodoros for the day
- Add tasks with planned pomodoro estimates
- Prioritize tasks (automatic ordering)
- Add mid-day tasks with reasons

### ⏱️ Smart Timer
- 25-minute focus sessions
- Auto break suggestions (skip if needed)
- Task tracking per pomodoro
- Context switch detection

### 📊 Rich Tracking
- Focus scores (1-5 stars)
- Personal notes per session
- Distraction reasons
- Task completion tracking

### ☁️ Cloud Sync (NEW!)
- **One-click sync** to cloud
- **Automatic pull** on startup
- **Visual status indicator**
- **Multi-device support**

### 🌙 End-of-Day Reflection
- Rate your day (1-5 stars)
- Note main distraction
- Write reflection notes
- Auto-syncs to cloud

## UI Overview

```
┌─────────────────────────────────────────┐
│ Daily goal: 0 / 16 pomodoros            │
│                                         │
│ Today's Tasks:           [+ Add Task]  │
│ ┌───────────────────────────────────┐  │
│ │ 📝 Write docs (0/5 planned)       │  │
│ │ 📝 Code review (0/3 planned)      │  │
│ │ ⚡ Fix bug (0/2 mid-day)          │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [Start focus] [Abort] [📝] [🌙 End]   │
│                                         │
│ 🎯 Progress: 0/16 (0%) ░░░░░░░░░░     │
│ ⏱️  ETA: Finish around 05:00 PM        │
│ 📊 Total focus today: 6h 40m           │
│                                         │
│ ☁️ Cloud: Connected     [☁️ Sync]      │
│                                         │
│ Welcome to Hardmode Pomodoro            │
└─────────────────────────────────────────┘
```

## Sync Features

### Visual Indicators

**Status Label** (bottom left):
- 🟢 `☁️ Cloud: Connected` - Ready to sync
- 🔴 `☁️ Cloud: Offline` - Working locally only
- 🟠 `☁️ Cloud: Syncing...` - Sync in progress
- 🟢 `☁️ Cloud: Synced` - Last sync successful

**Sync Button** (bottom right):
- Click to manually sync today's data
- Shows detailed report after sync
- Disabled when offline

### Automatic Sync

The app automatically pulls latest data from cloud when you open it (after 2 seconds). This means:

✅ Work on laptop → Sync  
✅ Switch to desktop → Opens app → Gets your data automatically!

## Multi-Device Workflow

### Morning - Laptop
```
1. Open app
2. Plan day: 16 pomodoros, 3 tasks
3. Complete 4 pomodoros
4. Click "☁️ Sync"
5. ✅ Data in cloud
```

### Afternoon - Desktop
```
1. Open app
2. Automatically pulls: 4/16 done, 3 tasks ✨
3. Complete 8 more pomodoros
4. Click "☁️ Sync"
5. ✅ Updates cloud
```

### Evening - Laptop
```
1. Open app
2. Automatically pulls: 12/16 done ✨
3. Complete final 4 pomodoros
4. End day with reflection
5. Click "☁️ Sync"
6. ✅ Day complete in cloud
```

## Task Management

### Right-Click Menu

Right-click any task to:
- ✏️ Rename task
- ✅ Mark as complete/incomplete
- 🗑️ Delete task

### Task States

- `📝 Task name (0/5 planned)` - Planned task, not started
- `📝 Task name (2/5 planned)` - In progress
- `✅ Task name (5/5 planned)` - Completed
- `⚡ Task name (0/2 mid-day)` - Added during day

### Manual Entry

Click "📝 Manual Entry" to add pomodoros completed outside the app.

## Keyboard Shortcuts

- **Enter** (on task input) - Start focus session
- **Escape** (during focus) - Cancel current session

## Data Storage

### Local Database
```
~/.local/share/hardmode_pomodoro/my_database.db
```

All your data is stored here first. Always available offline!

### Cloud Database
```
backend/database.db (or cloud platform)
```

Synced data lives here. Accessible from any device!

## Troubleshooting

### "Sync button is grayed out"

**Cause:** Backend not running or not reachable

**Fix:**
```bash
# Terminal 1: Start backend
cd backend
go run main.go

# Terminal 2: Start app
python -m hardmode.main
```

### "Sync failed" error

**Cause:** Network issue or backend error

**Fix:**
1. Check backend is running: `ps aux | grep "go run main.go"`
2. Check backend logs: `cat /tmp/backend.log`
3. Your data is safe locally! Try sync again later.

### App won't start - "Another instance running"

**Cause:** Previous instance didn't close properly

**Fix:**
```bash
rm -f /tmp/hardmode-pomo.lock
python -m hardmode.main
```

### Data not syncing between devices

**Cause:** Forgot to click sync button

**Remember:**
- Click "☁️ Sync" on first device before closing
- Open app on second device (waits 2 seconds, auto-pulls)
- Or manually click "☁️ Sync" to force pull

## Advanced: Deploy to Cloud

Want to access from anywhere, not just localhost?

### Option 1: Render (Free!)

1. Push code to GitHub
2. Create Render web service
3. Connect repo
4. Deploy!
5. Get URL like: `https://your-app.onrender.com`

### Option 2: Railway/Fly.io

See `docs/CLOUD_SYNC.md` for detailed instructions.

### Update App

```python
# In hardmode/main.py, line 40:
data_manager = DataManager(
    conn, 
    api_url="https://your-app.onrender.com"  # Your cloud URL
)
```

Now sync from anywhere! 🌍

## Documentation

- `docs/CLOUD_SYNC.md` - Complete cloud sync guide
- `docs/SYNC_UI_GUIDE.md` - UI features explained
- `docs/PROJECT_SUMMARY.md` - Everything we built
- `docs/BACKEND_ENHANCEMENT.md` - Backend API reference

## Testing

```bash
# Run comprehensive sync test
python3 test_sync.py

# Expected output:
# ✨ All tests passed! Cloud sync is working perfectly!
```

## Tips & Tricks

### Maximize Productivity
1. Plan your day first thing (set realistic estimates)
2. Use the ETA display to pace yourself
3. Skip breaks when in flow, take them when tired
4. Review your focus scores to identify patterns

### Stay Synced
1. Click sync after completing major milestones
2. Sync before closing app if switching devices
3. Check sync status indicator regularly

### End-of-Day Ritual
1. Click "🌙 End Day"
2. Rate your day honestly
3. Note what distracted you
4. Write brief reflection
5. Sync to cloud
6. Review tomorrow!

## What's Next?

Your app is **production-ready**! Optional enhancements:

- [ ] Deploy backend to cloud
- [ ] Add keyboard shortcuts
- [ ] Add weekly analytics view
- [ ] Add sync history viewer
- [ ] Add dark/light theme toggle

## Getting Help

**Backend issues:** Check `cat /tmp/backend.log`  
**App crashes:** Check terminal output  
**Sync problems:** See troubleshooting section above  

## Credits

Built with:
- **PySide6** - Modern Qt UI framework
- **Go** - High-performance backend
- **SQLite** - Reliable local storage
- **Love** - For productivity and focus ❤️

---

**Status:** ✅ Fully functional, cloud-ready!  
**Version:** 2.0 (Cloud Edition)  
**Date:** October 17, 2025

🚀 **Happy Focusing!**
