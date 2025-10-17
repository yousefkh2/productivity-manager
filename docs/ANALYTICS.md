# Plan vs. Execution Tracking - Wolfram-Grade Analytics

## Overview

The Hardmode Pomodoro app now tracks **intention vs. execution** at a granular level, enabling deep behavioral analysis and productivity insights.

## Schema Enhancement

### New Fields in `daily_tasks` table

```sql
-- PLANNING phase (set during daily intent ritual)
planned_pomodoros INTEGER DEFAULT 0,    -- How many you INTENDED to spend
planned_at TEXT,                         -- When you planned this task
plan_priority INTEGER,                   -- Priority order during planning (1st, 2nd, 3rd...)

-- EXECUTION phase (updated during actual work)
pomodoros_spent INTEGER NOT NULL DEFAULT 0,  -- How many you ACTUALLY spent
completed INTEGER NOT NULL DEFAULT 0,         -- Did you finish it?

-- METADATA for tracking and analysis
added_mid_day INTEGER DEFAULT 0,        -- 0 = planned during ritual, 1 = added reactively
reason_added TEXT,                       -- "urgent bug", "new request", "forgot to plan", etc.
```

## User Workflow

### Morning Planning Ritual
1. User sets daily target (e.g., 16 pomodoros)
2. User plans tasks via dialog
3. For each task added:
   - Enter task name
   - System asks: "How many pomodoros do you plan to spend on [task]?"
   - System assigns sequential priority (1st, 2nd, 3rd...)
   - System timestamps as `planned_at`
   - System marks `added_mid_day = 0`

### During the Day
- Tasks show as: `Task [2/5 🍅]` (2 spent out of 5 planned)
- When adding a task mid-day:
  - System asks: "Why are you adding this now?" 
  - Records reason (e.g., "urgent bug", "new request")
  - System asks for planned pomodoros estimate
  - System marks `added_mid_day = 1`
  - Task displays with ⚡ icon (mid-day addition)

### Visual Indicators
- ✅ = Completed task
- `[3/5 🍅]` = Plan vs. actual (3 spent, 5 planned)
- ⚡ = Mid-day addition (reactive work)
- Yellow text = Mid-day addition highlight

## Analytics Capabilities

### 1. Estimation Accuracy
Track how well you estimate task effort over time:

```sql
SELECT 
    task_name,
    planned_pomodoros,
    pomodoros_spent,
    (pomodoros_spent - planned_pomodoros) AS variance,
    ROUND(100.0 * (pomodoros_spent - planned_pomodoros) / planned_pomodoros, 1) AS error_pct
FROM daily_tasks
WHERE planned_pomodoros > 0
ORDER BY ABS(error_pct) DESC;
```

**Insights:**
- Consistent underestimation? You're too optimistic.
- Consistent overestimation? You're padding estimates.
- Improving accuracy over time? You're learning.

### 2. Planning Discipline Score
How often do you stick to your plan vs. react to emergencies?

```sql
SELECT 
    date,
    COUNT(CASE WHEN added_mid_day = 0 THEN 1 END) AS planned_tasks,
    COUNT(CASE WHEN added_mid_day = 1 THEN 1 END) AS reactive_tasks,
    ROUND(100.0 * COUNT(CASE WHEN added_mid_day = 0 THEN 1 END) / COUNT(*), 1) AS discipline_score
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
GROUP BY date
ORDER BY date DESC;
```

**Insights:**
- Score < 50%? You're firefighting, not executing.
- Score > 80%? You're in control.
- Trending down? External interruptions increasing.

### 3. Completion Funnel
What percentage of planned tasks actually get done?

```sql
SELECT 
    'Planned' AS stage,
    COUNT(*) AS count
FROM daily_tasks
WHERE planned_pomodoros > 0

UNION ALL

SELECT 
    'Started' AS stage,
    COUNT(*) AS count
FROM daily_tasks
WHERE planned_pomodoros > 0 AND pomodoros_spent > 0

UNION ALL

SELECT 
    'Completed' AS stage,
    COUNT(*) AS count
FROM daily_tasks
WHERE planned_pomodoros > 0 AND completed = 1;
```

**Insights:**
- Many planned but not started? Overambitious planning.
- Many started but not completed? Task switching or underestimating.
- High completion rate? Realistic planning.

### 4. Priority Adherence
Do you work on what you planned to prioritize?

```sql
WITH actual_order AS (
    SELECT 
        dt.task_name,
        dt.plan_priority AS planned_rank,
        ROW_NUMBER() OVER (PARTITION BY dt.day_id ORDER BY MIN(p.start_time)) AS actual_rank
    FROM daily_tasks dt
    JOIN pomo p ON p.day_id = dt.day_id AND p.task = dt.task_name
    WHERE dt.plan_priority IS NOT NULL
    GROUP BY dt.day_id, dt.task_name, dt.plan_priority
)
SELECT 
    task_name,
    planned_rank,
    actual_rank,
    ABS(planned_rank - actual_rank) AS priority_drift
FROM actual_order
WHERE priority_drift > 0
ORDER BY priority_drift DESC;
```

**Insights:**
- High drift? Urgent derails important.
- Top priorities done last? Procrastination on hard tasks.
- Low drift? You execute as planned.

### 5. Context Switching Cost
Fragmentation analysis:

```sql
SELECT 
    d.date,
    COUNT(DISTINCT dt.task_name) AS total_tasks,
    SUM(p.duration_sec) / 60.0 / 25.0 AS total_pomodoros,
    ROUND(1.0 * SUM(p.duration_sec) / 60.0 / 25.0 / COUNT(DISTINCT dt.task_name), 2) AS avg_pomos_per_task
FROM day d
JOIN daily_tasks dt ON dt.day_id = d.id
JOIN pomo p ON p.day_id = d.id
WHERE dt.pomodoros_spent > 0
GROUP BY d.date
ORDER BY d.date DESC;
```

**Insights:**
- Many tasks, low avg pomodoros? Fragmented focus.
- Few tasks, high avg pomodoros? Deep work sessions.
- Optimal: 2-4 tasks per day, 3+ pomodoros each.

### 6. Backlog Aging
What's rotting in your backlog?

```sql
SELECT 
    task_name,
    planned_at,
    JULIANDAY('now') - JULIANDAY(planned_at) AS days_old,
    planned_pomodoros,
    pomodoros_spent,
    CASE 
        WHEN pomodoros_spent = 0 THEN 'Never started'
        WHEN completed = 0 THEN 'Abandoned'
        ELSE 'Done'
    END AS status
FROM daily_tasks
WHERE completed = 0 AND planned_at IS NOT NULL
ORDER BY days_old DESC;
```

**Insights:**
- Tasks > 7 days old? Probably not important.
- Never started? Delete or re-evaluate priority.
- Consistently aging backlog? Over-planning.

### 7. Reactive Work Patterns
Why are you getting interrupted?

```sql
SELECT 
    reason_added,
    COUNT(*) AS occurrences,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM daily_tasks WHERE added_mid_day = 1), 1) AS pct
FROM daily_tasks
WHERE added_mid_day = 1 AND reason_added IS NOT NULL
GROUP BY reason_added
ORDER BY occurrences DESC;
```

**Insights:**
- "urgent bug" dominates? Quality issues upstream.
- "new request" frequent? Boundary problems.
- "forgot to plan" common? Need better planning ritual.

### 8. Learning Curve
Are you getting better at planning?

```sql
WITH weekly_accuracy AS (
    SELECT 
        strftime('%Y-W%W', d.date) AS week,
        AVG(ABS(dt.pomodoros_spent - dt.planned_pomodoros)) AS avg_error
    FROM daily_tasks dt
    JOIN day d ON dt.day_id = d.id
    WHERE dt.planned_pomodoros > 0
    GROUP BY week
)
SELECT 
    week,
    avg_error,
    LAG(avg_error) OVER (ORDER BY week) AS prev_week_error,
    avg_error - LAG(avg_error) OVER (ORDER BY week) AS improvement
FROM weekly_accuracy
ORDER BY week DESC;
```

**Insights:**
- Negative improvement? Getting more accurate.
- Positive improvement? Estimation degrading.
- Stable? You've plateaued.

## Future Dashboard Ideas

### Weekly Review Dashboard
- Estimation accuracy trend graph
- Planning discipline score over time
- Completion funnel visualization
- Top reasons for mid-day additions
- Priority drift heatmap

### Real-Time Insights
- "You're 2 pomodoros over estimate on this task"
- "3 of 5 planned tasks still pending - reprioritize?"
- "80% of work was reactive this week - review boundaries"

### Behavioral Nudges
- "Your #1 priority task is still pending. Start now?"
- "This task has been in backlog for 14 days. Delete or do?"
- "Your estimation accuracy improved 15% this month! 🎉"

## Migration Applied

The database has been migrated with:
- All new columns added
- Existing tasks migrated (planned = spent, added_mid_day = 0)
- Indexes created for efficient querying

## Testing Instructions

1. **Start a new day:**
   - Plan 3 tasks with estimates (e.g., "Write report" - 5 pomodoros)
   - Note the planning dialog now asks for pomodoro estimates

2. **Work on tasks:**
   - Task list shows `[0/5 🍅]` format
   - As you complete pomodoros, updates to `[2/5 🍅]`

3. **Add a mid-day task:**
   - Click "+ Add Task"
   - System asks why you're adding it
   - Task appears with ⚡ icon and yellow text

4. **Check the data:**
   ```bash
   sqlite3 my_database.db "SELECT * FROM daily_tasks;"
   ```

## Next Steps

1. **Build analytics API endpoints** (for the Go backend)
2. **Create weekly review dialog** (show insights at week end)
3. **Add estimation feedback** ("This task took 2x planned effort")
4. **Export analytics** (CSV, JSON for external analysis)

---

**Key Principle:** Every task now has TWO stories:
1. What you **planned** (intention, priority, estimate)
2. What **actually happened** (execution, interruptions, reality)

The gap between these is where all the insights live.
