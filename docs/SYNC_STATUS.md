# Current Architecture: Local vs. Cloud Sync Status

## TL;DR

**Your app is currently HYBRID with limited sync:**

✅ **What DOES sync to cloud (Go backend):**
- Basic task CRUD (name, description, completion status)
- Pomodoro sessions (task_id, duration, timestamps)
- Basic statistics

❌ **What DOES NOT sync (local-only rich data):**
- Daily planning data (target pomodoros, day rating, reflection)
- Task planning fields (planned_pomodoros, plan_priority, planned_at)
- Mid-day addition tracking (added_mid_day, reason_added)
- Task-to-day relationships (daily_tasks table)
- End-of-day reflection (day_rating, main_distraction, notes)
- Event logs
- Settings

## Current State Analysis

### Go Backend Schema (Cloud)

```go
// What exists in backend/main.go:

tasks table:
- id
- name
- description
- created_at
- completed_at
- is_completed

pomodoro_sessions table:
- id
- task_id
- start_time
- end_time
- duration
- completed
```

**Missing from Go backend:**
- `day` table (your planning/reflection data)
- `daily_tasks` table (plan vs. actual tracking)
- `pomo` table fields (aborted, focus_score, reason, note, context_switch)
- Settings table
- Event log table
- All the new fields we added today!

### Python Local Schema (Rich)

```sql
-- What exists in schema.sql:

day table:
- id, date, target_pomos, finished_pomos
- start_time, end_time, comment
- day_rating, main_distraction, reflection_notes

pomo table:
- id, day_id, start_time, end_time, duration_sec
- aborted, focus_score, reason, note, task, context_switch

daily_tasks table: (NEW - we added today!)
- id, day_id, task_name
- planned_pomodoros, planned_at, plan_priority
- pomodoros_spent, completed, completed_at
- added_mid_day, reason_added

sync_mapping table:
- local_pomo_id, remote_session_id

settings table:
- key, value

event_log table:
- id, ts, level, event, metadata
```

### What Actually Syncs

**In DataManager (`hardmode/data/manager.py`):**

1. **Pomodoro sessions sync** (lines 108-183):
   ```python
   def start_pomo(...)
       # Saves locally
       # DOES sync to API via create_session()
   ```

2. **Tasks PARTIALLY sync**:
   - Basic task creation syncs
   - BUT: No daily_tasks, no planning data, no priorities

3. **Everything else is LOCAL-ONLY**:
   - Daily planning (target, priorities)
   - Task planning (planned_pomodoros, plan_priority)
   - Mid-day tracking (added_mid_day, reason_added)
   - End-of-day reflection (rating, distraction, notes)
   - Task rename, manual entry, context menu actions

## Why This Matters

### Current Limitations

**Scenario 1: You use app on Computer A, then Computer B**
- ✅ Your basic tasks sync
- ✅ Your pomodoro sessions sync
- ❌ Your daily plan doesn't sync (target, priorities)
- ❌ Your task estimates don't sync (planned_pomodoros)
- ❌ Your mid-day additions don't sync (reason_added)
- ❌ Your end-of-day reflections don't sync
- **Result:** Computer B shows partial data, loses all analytics context

**Scenario 2: You work on phone, then desktop**
- ❌ Can't plan your day (no daily_intent API endpoint)
- ❌ Can't see your task list with priorities
- ❌ Can't log mid-day additions with reasons
- ❌ Can't add manual pomodoros
- **Result:** Phone workflow doesn't exist yet

**Scenario 3: You deploy to cloud**
- ✅ API works, basic data syncs
- ❌ All your rich analytics features don't work remotely
- ❌ Any client connecting to cloud backend gets basic features only
- **Result:** Cloud deployment is missing 80% of your features

## What Needs to Happen for Full Sync

### Phase 1: Extend Go Backend Schema

Add these tables to match your local schema:

```go
// backend/main.go additions needed:

type Day struct {
    ID           int       `json:"id"`
    Date         string    `json:"date"`
    TargetPomos  int       `json:"target_pomos"`
    FinishedPomos int      `json:"finished_pomos"`
    StartTime    time.Time `json:"start_time"`
    EndTime      *time.Time `json:"end_time"`
    Comment      string    `json:"comment"`
    // Reflection fields
    DayRating       *int   `json:"day_rating"`
    MainDistraction string `json:"main_distraction"`
    ReflectionNotes string `json:"reflection_notes"`
}

type DailyTask struct {
    ID              int       `json:"id"`
    DayID           int       `json:"day_id"`
    TaskName        string    `json:"task_name"`
    // Planning
    PlannedPomodoros int      `json:"planned_pomodoros"`
    PlannedAt        *time.Time `json:"planned_at"`
    PlanPriority     *int     `json:"plan_priority"`
    // Execution
    PomodorosSpent  int       `json:"pomodoros_spent"`
    Completed       bool      `json:"completed"`
    CompletedAt     *time.Time `json:"completed_at"`
    // Metadata
    AddedMidDay     bool      `json:"added_mid_day"`
    ReasonAdded     string    `json:"reason_added"`
}

type PomodoroDetail struct {
    ID            int       `json:"id"`
    DayID         int       `json:"day_id"`
    StartTime     time.Time `json:"start_time"`
    EndTime       *time.Time `json:"end_time"`
    DurationSec   int       `json:"duration_sec"`
    Aborted       bool      `json:"aborted"`
    FocusScore    *int      `json:"focus_score"`
    Reason        string    `json:"reason"`
    Note          string    `json:"note"`
    Task          string    `json:"task"`
    ContextSwitch bool      `json:"context_switch"`
}
```

### Phase 2: Add API Endpoints

```go
// New endpoints needed in backend/main.go:

// Day management
GET    /api/days/{date}           // Get day by date
POST   /api/days                  // Create/update day
PUT    /api/days/{id}             // Update day
GET    /api/days/{id}/tasks       // Get daily tasks

// Daily tasks
GET    /api/days/{day_id}/tasks   // Get tasks for a day
POST   /api/days/{day_id}/tasks   // Add task to day
PUT    /api/daily-tasks/{id}      // Update daily task
DELETE /api/daily-tasks/{id}      // Delete daily task

// Enhanced pomodoro
POST   /api/pomodoros             // Create detailed pomo
GET    /api/pomodoros/{id}        // Get pomo details
PUT    /api/pomodoros/{id}        // Update pomo (e.g., add review)

// Reflection
PUT    /api/days/{id}/reflection  // Save end-of-day reflection

// Manual entry
POST   /api/days/{id}/manual-pomodoros  // Add manual pomodoros
```

### Phase 3: Update Python DataManager

```python
# hardmode/data/manager.py additions:

def sync_day(self, day_id: int) -> bool:
    """Sync entire day to cloud"""
    # Get local day
    day = self.local.get_day_by_id(day_id)
    # POST to /api/days
    # Return success

def sync_daily_tasks(self, day_id: int) -> bool:
    """Sync daily tasks with planning data"""
    tasks = self.local.get_daily_tasks(day_id)
    # POST each to /api/days/{day_id}/tasks
    # Return success

def sync_reflection(self, day_id: int) -> bool:
    """Sync end-of-day reflection"""
    day = self.local.get_day_by_id(day_id)
    # PUT to /api/days/{id}/reflection
    # Return success
```

### Phase 4: Implement Bidirectional Sync

```python
def pull_from_cloud(self, date: str) -> None:
    """Pull day data from cloud"""
    # GET /api/days/{date}
    # Merge with local (conflict resolution)
    # Update local DB

def push_to_cloud(self, date: str) -> None:
    """Push day data to cloud"""
    # Get all local data for date
    # POST to cloud endpoints
    # Update sync_mapping

def auto_sync(self) -> None:
    """Auto-sync when online"""
    # Find unsynced days
    # Push each to cloud
    # Pull updates from cloud
```

## Immediate Actions

### Option A: Full Cloud Sync (Recommended for "work from anywhere")

**Effort:** Medium (2-3 days)
**Benefit:** Complete data portability

1. **Extend Go backend** with day, daily_tasks, enhanced pomo tables
2. **Add API endpoints** for all operations
3. **Update DataManager** to sync everything
4. **Test bidirectional sync** (Computer A ↔ Cloud ↔ Computer B)
5. **Deploy to cloud** (Render, Railway, Fly.io)

**Result:** App works identically on any device, full feature parity

### Option B: Local-First with Export/Import (Faster)

**Effort:** Low (few hours)
**Benefit:** Quick portability without backend changes

1. **Add export button** → Exports entire database to JSON
2. **Add import button** → Imports database JSON
3. **Use sync service** (Dropbox, Google Drive) for the export file

**Result:** Manual sync, but works across devices

### Option C: Hybrid (What you have now)

**Effort:** None
**Benefit:** Basic sync, rich local features

**Trade-off:** Different experience on different devices, no mobile support

## Recommendation

**For your stated goal ("work from anywhere, syncable"):**

→ **Go with Option A: Full Cloud Sync**

**Why:**
1. You're learning cloud deployment anyway
2. You've already built the rich local schema
3. The Go backend exists, just needs extension
4. You'll have a portfolio-worthy full-stack app
5. Opens door to mobile client later

**Implementation Plan:**
1. **Week 1:** Extend Go backend schema + endpoints (backend work)
2. **Week 2:** Update Python sync logic (client work)
3. **Week 3:** Test + deploy to cloud + document

**Alternative if time-constrained:**
→ **Option B** gets you portable data in 2-3 hours

Would you like me to start implementing Option A (full cloud sync)?

## Current Deployment Status

```
┌─────────────────────┐
│  Python Desktop App │  ← All your rich features live here
│  (Local SQLite)     │
└──────────┬──────────┘
           │
           │ Partial sync (basic tasks/sessions only)
           │
           ▼
┌─────────────────────┐
│  Go Backend (API)   │  ← Basic schema, missing 80% of features
│  (SQLite)           │
└──────────┬──────────┘
           │
           │ Can deploy to cloud, but...
           │
           ▼
┌─────────────────────┐
│  Cloud (Render/etc) │  ← Would only sync basic data
└─────────────────────┘
```

**Bottom Line:** Your rich local app is amazing, but it's not cloud-portable yet. To truly "work from anywhere," we need to extend the Go backend to match your local schema.
