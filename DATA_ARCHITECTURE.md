# 🗄️ Data Architecture - Complete Guide

## Overview

Your app now has a **dual-layer data architecture**:
1. **Local SQLite** (rich, detailed data) - your primary storage
2. **Cloud API** (simplified data) - for syncing and cloud features

**Key principle**: Everything is saved locally first, then synced to cloud when available.

---

## 📊 Local Data Storage (SQLite)

**Location**: `/home/yousef/Desktop/Project/hardmode-pomo/my_database.db`

### Tables

#### 1. `day` table
Tracks each day's pomodoro session:
```sql
CREATE TABLE day (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,      -- "2025-10-17"
    target_pomos INTEGER NOT NULL,  -- Your daily goal (e.g., 16)
    finished_pomos INTEGER DEFAULT 0,
    start_time TEXT,                -- When you started today
    end_time TEXT,                  -- When you finished
    comment TEXT,                   -- Optional daily notes
    -- End of day reflection (NEW)
    day_rating INTEGER CHECK(day_rating BETWEEN 1 AND 5),  -- 1-5 stars
    main_distraction TEXT,          -- What got in your way
    reflection_notes TEXT           -- Additional thoughts
);
```

**What gets saved**:
- ✅ Your daily pomodoro goal (set in Daily Intent dialog)
- ✅ How many you completed
- ✅ Start/end timestamps
- ✅ **End-of-day rating (1-5 stars)** 🌙 NEW
- ✅ **Main distraction/obstacle** 🌙 NEW
- ✅ **Reflection notes** 🌙 NEW
- ✅ Any other notes you add

#### 2. `pomo` table
Tracks each individual pomodoro session:
```sql
CREATE TABLE pomo (
    id INTEGER PRIMARY KEY,
    day_id INTEGER REFERENCES day(id),
    start_time TEXT NOT NULL,       -- ISO timestamp
    end_time TEXT,                  -- ISO timestamp
    duration_sec INTEGER NOT NULL,  -- Usually 1500 (25 min)
    aborted INTEGER DEFAULT 0,      -- 0 = completed, 1 = aborted
    focus_score INTEGER,            -- 1-5 rating (not used yet)
    reason TEXT,                    -- Why aborted?
    note TEXT,                      -- Session notes
    task TEXT NOT NULL,             -- "Fix bug in login"
    context_switch INTEGER DEFAULT 0
);
```

**What gets saved**:
- ✅ **Task name** - which task you worked on
- ✅ **Duration** - how long the session was
- ✅ **Start/end times** - exact timestamps
- ✅ **Completion status** - finished or aborted
- ✅ **Reason** - if aborted, why (user_abort, app_quit, etc.)
- ✅ Notes (if you add any)

#### 3. `sync_mapping` table
Tracks what's been synced to the cloud API:
```sql
CREATE TABLE sync_mapping (
    pomo_id INTEGER PRIMARY KEY,
    api_task_id INTEGER,            -- ID in cloud database
    api_session_id INTEGER,         -- Session ID in cloud
    synced_at TEXT,                 -- When synced
    needs_update INTEGER DEFAULT 0  -- Pending sync flag
);
```

**What this does**:
- Maps your local pomodoro IDs to cloud IDs
- Tracks what needs to be synced
- Allows offline work with later sync

#### 4. `settings` table
App settings:
```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

#### 5. `event_log` table
System events and errors:
```sql
CREATE TABLE event_log (
    id INTEGER PRIMARY KEY,
    ts TEXT NOT NULL,
    level TEXT NOT NULL,    -- info/warn/error
    event TEXT NOT NULL,
    metadata TEXT          -- JSON data
);
```

---

## ☁️ Cloud Data Storage (API)

**Location**: `backend/pomo.db` (when backend is running)

### Tables

#### 1. `tasks` table
Simplified task tracking:
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    is_completed BOOLEAN DEFAULT 0
);
```

**What syncs here**:
- ✅ Task names
- ✅ Creation timestamp
- ✅ Completion status

#### 2. `pomodoro_sessions` table
Simplified session tracking:
```sql
CREATE TABLE pomodoro_sessions (
    id INTEGER PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    duration_minutes INTEGER DEFAULT 25,
    is_completed BOOLEAN DEFAULT 0
);
```

**What syncs here**:
- ✅ Which task it's for
- ✅ Start/end times
- ✅ Duration
- ✅ Completion status

---

## 🔄 How Data Flows

### When You Start a Pomodoro:

1. **Click "Start focus"**
2. Select a task from your task list
3. Timer starts

**Data saved**:
```
Local DB (my_database.db):
├── day table: Updated finished_pomos counter
├── pomo table: New row created with:
│   ├── task = "Review pull requests"
│   ├── start_time = "2025-10-17T14:30:00"
│   ├── duration_sec = 1500
│   └── aborted = 0

Cloud API (if online):
├── tasks table: New row created:
│   ├── name = "Review pull requests"
│   ├── created_at = "2025-10-17T14:30:00"
│   └── is_completed = 0
└── sync_mapping table: Links local pomo_id to api_task_id
```

### When You Complete a Pomodoro:

**Data updated**:
```
Local DB:
├── pomo table: Row updated with:
│   ├── end_time = "2025-10-17T14:55:00"
│   ├── aborted = 0
│   └── actual_duration = 1500

Cloud API (if online):
├── pomodoro_sessions table: New row created:
│   ├── task_id = (linked to task)
│   ├── started_at = "2025-10-17T14:30:00"
│   ├── completed_at = "2025-10-17T14:55:00"
│   ├── duration_minutes = 25
│   └── is_completed = 1
└── sync_mapping table: Updated with api_session_id
```

### When You Abort a Pomodoro:

**Data saved**:
```
Local DB:
├── pomo table: Row updated with:
│   ├── end_time = "2025-10-17T14:40:00"
│   ├── aborted = 1
│   ├── reason = "user_abort"
│   └── actual_duration = 600 (10 minutes)

Cloud API (if online):
├── pomodoro_sessions table: Row created with:
│   └── is_completed = 0
```

### When Offline:

**What happens**:
```
✅ All data saved locally to my_database.db
⚠️  API sync skipped
📝 sync_mapping.needs_update = 1 (marked for later sync)

When you come back online:
🔄 DataManager.reconnect() syncs pending data
✅ Cloud API gets updated automatically
```

---

## 📁 Task Management Data

### Task List Storage

Your daily tasks are **currently stored in memory** during the session:

```python
# In main_window.py
self.daily_tasks = []  # List of TaskItem objects

# Each TaskItem has:
class TaskItem:
    name: str              # "Review code"
    pomodoros_spent: int   # How many pomodoros on this task
```

**Important**: Tasks planned in the task dialog are **not persisted** between app restarts yet. They only exist during your current session.

**What IS persisted**:
- ✅ The task name in each completed `pomo` row
- ✅ You can see which tasks you worked on by querying the database

**What is NOT persisted** (yet):
- ❌ Your planned task list
- ❌ Task priority or order
- ❌ Task descriptions or notes

---

## 🔍 Viewing Your Data

### Check Local Database:

```bash
# See all tables
sqlite3 my_database.db ".tables"

# See today's pomodoros
sqlite3 my_database.db "
  SELECT task, start_time, end_time, aborted 
  FROM pomo 
  WHERE date(start_time) = date('now')
  ORDER BY start_time
"

# See your daily stats
sqlite3 my_database.db "
  SELECT date, target_pomos, finished_pomos 
  FROM day 
  ORDER BY date DESC 
  LIMIT 7
"

# See what tasks you worked on most
sqlite3 my_database.db "
  SELECT task, COUNT(*) as sessions, 
         SUM(duration_sec)/60 as total_minutes
  FROM pomo 
  WHERE aborted = 0
  GROUP BY task 
  ORDER BY sessions DESC
"
```

### Check Cloud Database (when backend running):

```bash
# See all tasks
sqlite3 backend/pomo.db "SELECT * FROM tasks"

# See all sessions
sqlite3 backend/pomo.db "
  SELECT s.id, t.name, s.started_at, s.duration_minutes, s.is_completed
  FROM pomodoro_sessions s
  JOIN tasks t ON s.task_id = t.id
  ORDER BY s.started_at DESC
"

# Get statistics
curl http://localhost:8080/api/statistics
```

---

## 🎯 Data Guarantees

### What NEVER Gets Lost:

✅ **Every pomodoro session** - saved to local DB immediately
✅ **Task names** - recorded in each pomo row
✅ **Start/end times** - precise timestamps
✅ **Daily goals** - your target pomodoros
✅ **Completion status** - whether you finished or aborted

### What Syncs to Cloud:

✅ Task names and creation time
✅ Session start/end times
✅ Duration and completion status
✅ Automatically when online

### What Stays Local Only:

📍 **Focus scores** (not implemented yet)
📍 **Detailed notes** on sessions
📍 **Context switch flags**
📍 **Event logs**

---

## 🚀 Next Steps for Data Persistence

### Recommended Improvements:

1. **Persist Task List**:
   - Add a `daily_tasks` table to local DB
   - Save planned tasks with priority/order
   - Reload task list when app starts

2. **Task Statistics**:
   - Add view showing pomodoros per task
   - Track task completion
   - Show historical task data

3. **Backup & Export**:
   - Export to CSV/JSON
   - Import previous sessions
   - Backup to cloud storage

4. **Sync Improvements**:
   - Batch sync multiple sessions
   - Conflict resolution
   - Sync status indicator

---

## 📖 Summary

**Your data is safe!** Here's what persists:

| Data | Local DB | Cloud API | Current Status |
|------|----------|-----------|----------------|
| Daily goal | ✅ | ❌ | Persisted |
| Pomodoro sessions | ✅ | ✅ | Synced |
| Task names | ✅ | ✅ | Synced |
| Start/end times | ✅ | ✅ | Synced |
| Completion status | ✅ | ✅ | Synced |
| Abort reason | ✅ | ❌ | Local only |
| Planned tasks | ❌ | ❌ | In-memory only |
| Focus scores | ✅ | ❌ | Not used yet |
| Session notes | ✅ | ❌ | Not used yet |

**Bottom line**: Every pomodoro you complete is saved forever in `my_database.db` with full details. Cloud sync happens automatically when online, but all critical data is always safe locally.
