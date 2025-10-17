# Structured Mid-Day Task Addition Categories

## Overview

When adding tasks mid-day (outside of morning planning), users are prompted to select from predefined categories plus optional notes. This provides structured data for powerful analytics.

## Categories

### 🚨 Urgent Bug / Critical Issue
**When to use:** Production issues, critical bugs, system failures
**Analytics value:** Track firefighting time, quality issues, technical debt impact
**Example questions:**
- What % of my time is spent on urgent fixes?
- Are bugs increasing or decreasing over time?
- Which projects have the most urgent issues?

### 📧 New Request / Client Need
**When to use:** Incoming requests from clients, stakeholders, or team members
**Analytics value:** Measure responsiveness, boundary setting, scope creep
**Example questions:**
- How often do client requests interrupt planned work?
- What's the average time from request to delivery?
- Am I taking on too many ad-hoc requests?

### 🤔 Forgot to Plan This
**When to use:** Tasks you should have planned but didn't
**Analytics value:** Identify planning blind spots, improve planning ritual
**Example questions:**
- What types of tasks do I consistently forget?
- Is my planning getting better over time?
- Do I need a checklist for planning?

### 🔥 Unexpected Blocker / Dependency
**When to use:** Blockers that emerged during execution
**Analytics value:** Track dependency management, identify bottlenecks
**Example questions:**
- How often do dependencies derail my plan?
- Which systems/teams cause most blockers?
- Can I plan for dependencies better?

### 💡 Inspiration / Creative Idea
**When to use:** New ideas, creative work, exploratory tasks
**Analytics value:** Track innovation time, creative vs. execution balance
**Example questions:**
- How much time do I spend on creative exploration?
- Do inspired tasks lead to completed projects?
- When do I have the most creative ideas?

### 📞 Meeting / Interruption Outcome
**When to use:** Tasks resulting from meetings or conversations
**Analytics value:** Measure meeting effectiveness, action item follow-through
**Example questions:**
- How many tasks come from meetings?
- Do meeting outcomes get completed?
- Which meetings generate the most work?

### 🔄 Context Switch Required
**When to use:** Switching between projects, technologies, or domains
**Analytics value:** Measure fragmentation cost, context switching overhead
**Example questions:**
- How often do I context switch?
- What causes most context switches?
- What's the productivity cost of switching?

### 📝 Administrative / Overhead
**When to use:** Non-technical work: emails, reports, admin tasks
**Analytics value:** Track overhead burden, optimize processes
**Example questions:**
- How much time is spent on overhead?
- Is admin work increasing?
- Can I batch or automate admin tasks?

### 🎯 Opportunistic / Quick Win
**When to use:** Small, high-value tasks that appeared unexpectedly
**Analytics value:** Track opportunistic productivity, quick win identification
**Example questions:**
- Do quick wins actually stay quick?
- What's the ROI of opportunistic tasks?
- Am I chasing too many small wins?

### ❓ Other
**When to use:** Anything that doesn't fit above categories
**Analytics value:** Identify emerging patterns that need new categories
**Example questions:**
- What patterns appear in "Other"?
- Should I add new categories?
- Are "Other" tasks increasing?

## Data Format

Tasks are stored as:
```
reason_added = "🚨 Urgent Bug / Critical Issue | Production database slow"
```

**Format:** `Category | Optional Notes`

## Analytics Queries

### 1. Category Distribution
```sql
SELECT 
    SUBSTR(reason_added, 1, INSTR(reason_added, ' /') + 1) AS category,
    COUNT(*) AS count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM daily_tasks WHERE added_mid_day = 1), 1) AS pct
FROM daily_tasks
WHERE added_mid_day = 1
GROUP BY category
ORDER BY count DESC;
```

### 2. Firefighting Time (Urgent Bugs)
```sql
SELECT 
    d.date,
    SUM(dt.pomodoros_spent) AS firefighting_pomodoros,
    d.finished_pomos AS total_pomodoros,
    ROUND(100.0 * SUM(dt.pomodoros_spent) / d.finished_pomos, 1) AS firefighting_pct
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
WHERE dt.added_mid_day = 1 
  AND dt.reason_added LIKE '🚨 Urgent Bug%'
GROUP BY d.date
ORDER BY d.date DESC;
```

### 3. Planning Blindspot Trend
```sql
SELECT 
    strftime('%Y-%W', d.date) AS week,
    COUNT(*) AS forgot_to_plan_count
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
WHERE dt.added_mid_day = 1
  AND dt.reason_added LIKE '🤔 Forgot to Plan%'
GROUP BY week
ORDER BY week DESC;
```

### 4. Context Switch Cost
```sql
SELECT 
    d.date,
    COUNT(DISTINCT dt.task_name) AS total_tasks,
    COUNT(CASE WHEN dt.added_mid_day = 1 AND dt.reason_added LIKE '🔄 Context Switch%' THEN 1 END) AS switches,
    ROUND(100.0 * COUNT(CASE WHEN dt.added_mid_day = 1 AND dt.reason_added LIKE '🔄 Context Switch%' THEN 1 END) / COUNT(DISTINCT dt.task_name), 1) AS switch_rate
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
GROUP BY d.date
ORDER BY d.date DESC;
```

### 5. Overhead Burden Trend
```sql
SELECT 
    strftime('%Y-%m', d.date) AS month,
    SUM(CASE WHEN dt.reason_added LIKE '📝 Administrative%' THEN dt.pomodoros_spent ELSE 0 END) AS overhead_pomos,
    SUM(dt.pomodoros_spent) AS total_pomos,
    ROUND(100.0 * SUM(CASE WHEN dt.reason_added LIKE '📝 Administrative%' THEN dt.pomodoros_spent ELSE 0 END) / SUM(dt.pomodoros_spent), 1) AS overhead_pct
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
WHERE dt.added_mid_day = 1
GROUP BY month
ORDER BY month DESC;
```

### 6. Client Interruption Pattern
```sql
SELECT 
    strftime('%w', d.date) AS day_of_week,
    CASE strftime('%w', d.date)
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday'
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        WHEN '6' THEN 'Saturday'
    END AS day_name,
    COUNT(*) AS client_requests
FROM daily_tasks dt
JOIN day d ON dt.day_id = d.id
WHERE dt.added_mid_day = 1
  AND dt.reason_added LIKE '📧 New Request%'
GROUP BY day_of_week
ORDER BY day_of_week;
```

### 7. Innovation vs. Execution Balance
```sql
SELECT 
    'Planned Work' AS work_type,
    SUM(pomodoros_spent) AS pomodoros
FROM daily_tasks
WHERE added_mid_day = 0

UNION ALL

SELECT 
    'Creative/Innovation' AS work_type,
    SUM(pomodoros_spent) AS pomodoros
FROM daily_tasks
WHERE added_mid_day = 1
  AND reason_added LIKE '💡 Inspiration%'

UNION ALL

SELECT 
    'Reactive/Firefighting' AS work_type,
    SUM(pomodoros_spent) AS pomodoros
FROM daily_tasks
WHERE added_mid_day = 1
  AND (reason_added LIKE '🚨 Urgent%' OR reason_added LIKE '🔥 Unexpected%');
```

## Benefits of Structured Categories

### 1. **Queryable Data**
- No need to parse free text
- Consistent categorization
- Easy aggregation and filtering

### 2. **Pattern Recognition**
- Identify systemic issues (e.g., too many urgent bugs)
- Spot trends over time
- Compare weeks/months/quarters

### 3. **Actionable Insights**
- "30% of time is firefighting → invest in quality"
- "Forgot to plan administrative tasks 5 times → add to planning checklist"
- "Client requests spike on Mondays → set boundaries"

### 4. **Behavioral Nudges**
- "You've added 3 'Forgot to Plan' tasks this week"
- "Urgent bugs are up 50% this month"
- "You context switched 8 times today"

### 5. **Flexibility**
- Categories cover 90% of cases
- "Other" + notes captures edge cases
- Can add new categories based on "Other" patterns

## User Experience

### Dialog Flow:
1. Click "+ Add Task"
2. Enter task name → Click OK
3. **Structured Reason Dialog appears:**
   - Dropdown with 10 emoji-labeled categories
   - Optional notes field for context
   - Dark-themed, visually consistent
   - Cancel or Add Task buttons
4. Enter planned pomodoros → Click OK
5. Task appears with ⚡ icon and yellow text

### Why This Works:
- **Fast:** Dropdown is quicker than typing
- **Consistent:** Same categories every time
- **Flexible:** Optional notes for edge cases
- **Visual:** Emojis make categories scannable
- **Analytical:** Structured data enables queries

## Future Enhancements

1. **Smart Defaults:** Pre-select category based on time/context
2. **Category Shortcuts:** Keyboard shortcuts for common categories
3. **Real-Time Insights:** "You've added 3 urgent bugs today - investigate?"
4. **Category Metrics:** Show % distribution when selecting
5. **Custom Categories:** Let users add their own categories
6. **Auto-Categorization:** ML to suggest category from task name

---

**Key Principle:** Give users a guided choice, not a blank text box. Structured data = structured insights.
