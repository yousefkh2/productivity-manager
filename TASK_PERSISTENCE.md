# 📋 Task Persistence - Implementation Complete!

## Problem Solved

**Before**: Daily tasks were **lost** every time you closed the app
- ❌ Tasks only existed in memory
- ❌ Close app → Lose all your planned tasks
- ❌ Reopen → Have to re-add all tasks manually
- ❌ Pomodoros per task count was lost

**Now**: Tasks are **persisted** in the database!
- ✅ Tasks saved automatically
- ✅ Close and reopen → Tasks restored
- ✅ Pomodoro counts per task preserved
- ✅ Task completion status saved

## How It Works

### New Database Table: `daily_tasks`

```sql
CREATE TABLE daily_tasks (
  id INTEGER PRIMARY KEY,
  day_id INTEGER REFERENCES day(id),     -- Links to specific day
  task_name TEXT NOT NULL,                -- "Review code", "Write docs"
  pomodoros_spent INTEGER DEFAULT 0,      -- How many pomos on this task
  completed INTEGER DEFAULT 0,            -- 0 = active, 1 = completed
  created_at TEXT NOT NULL,               -- When task was added
  completed_at TEXT                       -- When marked complete
);
```

### Automatic Save Points

Tasks are automatically saved when:

1. **Adding/editing tasks** - Via "Manage Tasks" dialog
2. **Starting a pomodoro** - Updates pomodoros_spent count
3. **Marking tasks complete** - Updates completion status

### Automatic Restore

When you reopen the app on the same day:

```
1. Check if day exists and not ended
2. If resuming:
   → Load tasks from daily_tasks table
   → Restore task names
   → Restore pomodoro counts
   → Restore completion status
3. Display: "✓ Restored X tasks from today"
```

## Data Flow

### Adding Tasks (Morning):

```
You:
1. Open app → Daily Intent: 16 pomodoros
2. Task Planning → Add tasks:
   - "Review pull requests"
   - "Write documentation"  
   - "Fix critical bug"
3. Click "Done Planning"

Database:
→ INSERT INTO daily_tasks (day_id, task_name, pomodoros_spent, ...)
  VALUES (42, 'Review pull requests', 0, ...)
→ INSERT INTO daily_tasks (day_id, task_name, pomodoros_spent, ...)
  VALUES (42, 'Write documentation', 0, ...)
→ INSERT INTO daily_tasks (day_id, task_name, pomodoros_spent, ...)
  VALUES (42, 'Fix critical bug', 0, ...)

Console:
✓ Saved 3 tasks
```

### Working on Tasks:

```
You:
4. Click "Start focus"
5. Select "Review pull requests"
6. Timer starts

Database:
→ UPDATE daily_tasks 
  SET pomodoros_spent = 1 
  WHERE day_id = 42 AND task_name = 'Review pull requests'

7. Complete pomodoro
8. Start next → Select "Review pull requests" again
9. Complete pomodoro

Database:
→ UPDATE daily_tasks 
  SET pomodoros_spent = 2
  WHERE day_id = 42 AND task_name = 'Review pull requests'
```

### Closing and Reopening (Lunch Break):

```
You:
10. Close app (6 pomodoros completed across tasks)

Later:
11. Reopen app

Console:
✓ Connected to API
✓ Resuming today's session: 6/16 pomodoros completed
✓ Restored 3 tasks from today

App shows:
- "Review pull requests" (2 pomodoros)
- "Write documentation" (3 pomodoros)
- "Fix critical bug" (1 pomodoro)

12. Continue working where you left off!
```

## Implementation Details

### Database Methods:

```python
# hardmode/data/db.py

def save_daily_tasks(day_id: int, tasks: list) -> None:
    """Save all tasks for a day (replaces existing)."""
    # Clear old tasks
    DELETE FROM daily_tasks WHERE day_id = ?
    # Insert new tasks
    INSERT INTO daily_tasks ...

def get_daily_tasks(day_id: int) -> list:
    """Load tasks for a specific day."""
    SELECT task_name, pomodoros_spent, completed
    FROM daily_tasks
    WHERE day_id = ?

def update_task_pomodoros(day_id: int, task_name: str, count: int):
    """Update pomodoro count for a task."""
    UPDATE daily_tasks 
    SET pomodoros_spent = ?
    WHERE day_id = ? AND task_name = ?
```

### UI Integration:

```python
# hardmode/ui/main_window.py

# On startup (resuming):
if existing_day:
    saved_tasks = self.repository.get_daily_tasks(day_id)
    for task_data in saved_tasks:
        task = TaskItem(
            name=task_data['task_name'],
            pomodoros_spent=task_data['pomodoros_spent'],
            completed=task_data['completed']
        )
        self.daily_tasks.append(task)

# When managing tasks:
def _show_task_list():
    self.daily_tasks = show_task_planning_dialog(...)
    self.repository.save_daily_tasks(self.day_id, self.daily_tasks)

# When starting pomodoro:
def _handle_start_clicked():
    task.pomodoros_spent += 1
    self.repository.update_task_pomodoros(day_id, task.name, count)
```

## User Experience

### Scenario: Full Day Workflow

```
8:00 AM - Start Day
→ Daily Intent: 16 pomodoros
→ Add tasks: Code review, Testing, Documentation
→ ✓ Saved 3 tasks

9:00 AM - Start Working
→ Select "Code review"
→ Complete 2 pomodoros
→ Tasks automatically updated in DB

12:00 PM - Lunch Break
→ Close app
→ All data saved automatically

1:00 PM - Resume Work
→ Open app
→ "✓ Resuming: 2/16 pomodoros completed"
→ "✓ Restored 3 tasks from today"
→ Code review shows: 2 pomodoros
→ Continue seamlessly!

5:00 PM - Check Progress
→ Open "Manage Tasks"
→ See exactly where you spent time:
  - Code review: 4 pomodoros
  - Testing: 2 pomodoros
  - Documentation: 1 pomodoro
→ Add more tasks if needed
→ ✓ Saved 3 tasks

6:00 PM - End Day
→ Click "End Day"
→ Reflection: Rate 4⭐, note distractions
→ All data persisted forever
```

## Database Queries

### See today's tasks:

```sql
SELECT 
  dt.task_name,
  dt.pomodoros_spent,
  dt.completed,
  d.date
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
WHERE d.date = date('now')
ORDER BY dt.id;
```

### Task statistics:

```sql
-- Most worked-on tasks this week
SELECT 
  dt.task_name,
  SUM(dt.pomodoros_spent) as total_pomos,
  COUNT(DISTINCT d.date) as days_worked
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
WHERE d.date >= date('now', '-7 days')
GROUP BY dt.task_name
ORDER BY total_pomos DESC;
```

### Task completion rate:

```sql
SELECT 
  d.date,
  COUNT(*) as total_tasks,
  SUM(dt.completed) as completed_tasks,
  ROUND(SUM(dt.completed) * 100.0 / COUNT(*), 1) || '%' as completion_rate
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
GROUP BY d.date
ORDER BY d.date DESC
LIMIT 7;
```

## Benefits

✅ **Never lose tasks** - Automatic persistence
✅ **Accurate tracking** - Pomodoros per task saved
✅ **Seamless resume** - Pick up exactly where you left off
✅ **Historical data** - See task patterns over time
✅ **Flexible workflow** - Close/reopen anytime
✅ **Task analytics** - Query which tasks take most time

## Files Modified

1. **`schema.sql`**
   - Added `daily_tasks` table
   - Added index on `day_id`

2. **`hardmode/data/db.py`**
   - `save_daily_tasks()` - Save task list
   - `get_daily_tasks()` - Load task list
   - `update_task_pomodoros()` - Update counts

3. **`hardmode/data/manager.py`**
   - Exposed task methods

4. **`hardmode/ui/main_window.py`**
   - Restore tasks on startup
   - Save tasks when changed
   - Update counts when working

## Console Output Examples

### First time (new day):
```
✓ Connected to API
[Daily Intent Dialog appears]
[Task Planning Dialog appears]
✓ Saved 3 tasks
```

### Resuming same day:
```
✓ Connected to API
✓ Resuming today's session: 4/16 pomodoros completed
✓ Restored 3 tasks from today
```

### Adding more tasks mid-day:
```
[Clicked "Manage Tasks"]
[Added 2 more tasks]
✓ Saved 5 tasks
```

## Migration

Existing database automatically gets new table on first run:
```sql
CREATE TABLE IF NOT EXISTS daily_tasks (...)
```

No data loss - old sessions preserved, new sessions get task tracking.

## Summary

Your daily tasks are now **fully persistent**! The app:
- ✅ Saves tasks automatically when you add/edit them
- ✅ Saves pomodoro counts as you work
- ✅ Restores everything when you reopen
- ✅ Tracks task history in database
- ✅ Enables task analytics and insights

Close the app anytime - your tasks and progress are safe! 📋🔒
