# Task Management Features

## Overview

The app now supports full task lifecycle management including renaming, completion toggling, deletion, and manual pomodoro entry for work done outside the app.

## Features

### 1. Task Context Menu (Right-Click)

**How to Access:**
- Right-click on any task in the task list

**Available Actions:**

#### ✏️ Rename Task
- **Use Case:** Fix typos, clarify task names, update scope
- **Behavior:** 
  - Opens dialog with current name pre-filled
  - Validates for duplicate names
  - Preserves all tracking data (pomodoros, priorities, timestamps)
  - Updates database immediately
- **Example:** "Fix bug" → "Fix login validation bug"

#### ✅ Mark Complete / ↩️ Mark Incomplete
- **Use Case:** Manually mark tasks as done without completing all planned pomodoros
- **Behavior:**
  - Toggles completion status
  - Sets `completed_at` timestamp when marking complete
  - Clears `completed_at` when marking incomplete
  - Task displays with strikethrough when completed
- **Analytics:** Track tasks completed vs. abandoned

#### 🗑️ Delete Task
- **Use Case:** Remove tasks added by mistake or no longer relevant
- **Behavior:**
  - Shows confirmation dialog
  - Removes task from daily list
  - Updates database immediately
  - **Warning:** Cannot be undone!

### 2. Manual Pomodoro Entry

**Button Location:** Between "Abort session" and "🌙 End Day"

**Button Label:** 📝 Manual Entry

**Use Cases:**
- Work done on your phone using a timer app
- Meetings or calls tracked separately
- Deep work sessions away from computer
- Catching up on missed logging

**How It Works:**

1. **Click "📝 Manual Entry"**
2. **Select Task:** Dropdown showing all tasks for today
3. **Enter Count:** Number of pomodoros (1-16)
4. **Confirm:** Click "Add Pomodoros"

**What Gets Updated:**
- ✅ Task's `pomodoros_spent` count increases
- ✅ Day's `finished_pomos` total increases
- ✅ Progress bar and ETA recalculate
- ✅ Task list display updates
- ✅ Database saves immediately

**Success Dialog:**
```
Added 3 pomodoro(s) to 'Write documentation'

Total today: 9/16
```

### 3. Data Integrity

**Task Renaming:**
```sql
-- All tracking data preserved:
- planned_pomodoros (unchanged)
- pomodoros_spent (unchanged)
- plan_priority (unchanged)
- planned_at (unchanged)
- added_mid_day (unchanged)
- reason_added (unchanged)
- completed (unchanged)
```

**Manual Entry:**
```sql
-- Creates NO pomo table entry
-- Just updates counts:
UPDATE daily_tasks SET pomodoros_spent = pomodoros_spent + <count>
UPDATE day SET finished_pomos = finished_pomos + <count>
```

**Why No Pomo Entry?**
- Manual entries lack session data (start_time, duration, focus_score)
- Would skew analytics (e.g., average focus score)
- Keeps manual vs. tracked pomodoros distinguishable

### 4. Analytics Considerations

**Manual Pomodoros in Queries:**

```sql
-- Total pomodoros (including manual)
SELECT SUM(pomodoros_spent) FROM daily_tasks WHERE day_id = ?;

-- Only tracked pomodoros (with session data)
SELECT COUNT(*) FROM pomo WHERE day_id = ?;

-- Manual pomodoros (difference)
SELECT 
    (SELECT SUM(pomodoros_spent) FROM daily_tasks WHERE day_id = ?) -
    (SELECT COUNT(*) FROM pomo WHERE day_id = ?)
AS manual_pomodoros;

-- Manual entry rate
SELECT 
    manual_count,
    tracked_count,
    ROUND(100.0 * manual_count / (manual_count + tracked_count), 1) AS manual_pct
FROM (
    SELECT 
        (SELECT SUM(pomodoros_spent) FROM daily_tasks WHERE day_id = ?) - 
        (SELECT COUNT(*) FROM pomo WHERE day_id = ?) AS manual_count,
        (SELECT COUNT(*) FROM pomo WHERE day_id = ?) AS tracked_count
);
```

**Questions You Can Answer:**
- How often do I work away from the app?
- Which tasks get manual entries? (meetings? phone work?)
- Is manual entry increasing? (degrading tracking discipline?)
- What % of work is tracked vs. manual?

### 5. User Experience

**Task List Display:**
```
📌 Write documentation [5/8 🍅]     ← Regular task
✅ Review PR [3/3 🍅]                ← Completed (strikethrough)
⚡ Urgent bug fix [2/2 🍅]          ← Mid-day addition (yellow)
```

**Context Menu Styling:**
- Dark theme (#2c3e50 background)
- Light text (#ecf0f1)
- Blue highlight on hover (#3498db)
- Emoji icons for visual scanning

**Manual Entry Dialog:**
- Dark theme consistent with other dialogs
- Dropdown task selector (no typing)
- SpinBox with min=1, max=16
- Clear success feedback

### 6. Keyboard Shortcuts (Future Enhancement)

Potential shortcuts:
- `F2` - Rename selected task
- `Space` - Toggle complete selected task
- `Delete` - Delete selected task
- `Ctrl+M` - Open manual entry dialog

### 7. Best Practices

**When to Rename:**
- ✅ Fix typos immediately
- ✅ Clarify vague tasks ("Fix bug" → "Fix login bug")
- ✅ Update scope changes
- ❌ Don't rename to merge tasks (delete one instead)

**When to Mark Complete Manually:**
- ✅ Task finished but didn't need all planned pomodoros
- ✅ Task blocked, marking as "done" to archive it
- ❌ Don't mark complete if still in progress

**When to Delete:**
- ✅ Duplicate tasks
- ✅ Tasks added by mistake
- ✅ Tasks no longer relevant
- ❌ Don't delete completed tasks (keep for analytics)

**When to Use Manual Entry:**
- ✅ Work done outside app that you want counted
- ✅ Retrospective logging (forgot to start timer)
- ✅ Meeting time you want attributed to a task
- ❌ Don't use to inflate numbers (defeats purpose)

### 8. Common Workflows

**Workflow 1: Rename for Clarity**
1. Right-click task: "Write docs"
2. Select "✏️ Rename Task"
3. Enter: "Write API documentation"
4. Task list updates immediately

**Workflow 2: Complete Early**
1. Task planned for 5 pomodoros, finished in 3
2. Right-click task
3. Select "✅ Mark Complete"
4. Task shows with strikethrough
5. Analytics show: 3 spent vs. 5 planned (60% estimate accuracy)

**Workflow 3: Add Phone Work**
1. Worked on "Research competitors" for 2 pomodoros on phone
2. Click "📝 Manual Entry"
3. Select task: "Research competitors"
4. Enter count: 2
5. Click "Add Pomodoros"
6. Progress updates: 8/16 → 10/16

**Workflow 4: Clean Up Task List**
1. Accidentally added "Meeting notes" twice
2. Right-click duplicate
3. Select "🗑️ Delete Task"
4. Confirm deletion
5. Task removed, analytics unaffected

### 9. Edge Cases Handled

**Rename to Existing Name:**
- ❌ Blocked with warning dialog
- Prevents duplicate task names

**Delete Task with Pomodoros:**
- ✅ Allowed (asks confirmation)
- Pomodoros are removed from daily_tasks
- Day total recalculates correctly

**Manual Entry on Completed Task:**
- ✅ Allowed
- Useful for retrospective adjustments
- Task remains marked as complete

**Manual Entry When No Tasks:**
- ❌ Blocked with info dialog
- Message: "Please add a task first"

### 10. Database Schema Impact

**No Schema Changes Needed:**
- All features use existing fields
- `completed_at` already exists
- Manual entries just update counts

**Audit Trail:**
```sql
-- See all tasks for a day (including deleted)
SELECT * FROM daily_tasks WHERE day_id = ?;

-- Manual vs tracked pomodoros
SELECT 
    d.date,
    SUM(dt.pomodoros_spent) AS total_logged,
    COUNT(DISTINCT p.id) AS tracked_pomos,
    SUM(dt.pomodoros_spent) - COUNT(DISTINCT p.id) AS manual_pomos
FROM day d
JOIN daily_tasks dt ON dt.day_id = d.id
LEFT JOIN pomo p ON p.day_id = d.id AND p.task = dt.task_name
GROUP BY d.date;
```

## Future Enhancements

1. **Bulk Operations:**
   - Select multiple tasks (Ctrl+Click)
   - Mark all as complete
   - Delete multiple at once

2. **Task Templates:**
   - Save common tasks
   - Quick add from template
   - Pre-filled estimates

3. **Task History:**
   - View renamed tasks
   - Undo recent deletions
   - Task change log

4. **Smart Manual Entry:**
   - "Add X pomodoros to last task"
   - Estimate duration from time
   - Suggest task based on time of day

5. **Drag & Drop:**
   - Reorder tasks manually
   - Override plan_priority
   - Visual priority management

---

**Key Principle:** Full control over your task list while maintaining data integrity and analytics accuracy.
