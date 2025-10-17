# 🌙 End of Day Reflection Feature

## Overview

The End of Day feature helps you reflect on your productivity, identify obstacles, and rate your overall performance. This creates a feedback loop for continuous improvement.

## When It Triggers

The end-of-day reflection appears in two scenarios:

### 1. **Automatic** - When You Reach Your Goal
- Complete all your target pomodoros (e.g., 16/16)
- App shows: "🎉 Goal Achieved! Congratulations!"
- End-of-day dialog appears automatically

### 2. **Manual** - When You Click "End Day" Button
- Click the "🌙 End Day" button in the main window
- Confirmation dialog: "Are you sure you want to end your day?"
- If confirmed, end-of-day dialog appears

## The Reflection Dialog

### What You'll See:

1. **Summary Header**
   - If goal reached: "🎉 Congratulations! You completed all X pomodoros!"
   - If incomplete: "You completed X out of Y pomodoros."

2. **Question 1: What got in your way today?**
   - Free-form text area
   - Examples: "Too many Slack notifications", "Unexpected meetings", "Feeling tired"
   - Helps identify patterns in distractions

3. **Question 2: How would you rate your day overall?**
   - Interactive 5-star rating system
   - ⭐ Challenging day
   - ⭐⭐ Below expectations
   - ⭐⭐⭐ Decent day
   - ⭐⭐⭐⭐ Great day!
   - ⭐⭐⭐⭐⭐ Excellent day!

4. **Optional: Additional Notes**
   - Any other thoughts about the day
   - Wins, learnings, things to try tomorrow

## Data Saved

All reflection data is saved to the `day` table in your database:

```sql
-- Added columns to day table:
day_rating INTEGER           -- 1-5 stars
main_distraction TEXT         -- What got in your way
reflection_notes TEXT         -- Additional thoughts
end_time TEXT                 -- When you ended the day
```

## Day Boundaries

**Important**: A new day starts at **4:00 AM** (not midnight!)

This aligns with natural sleep schedules:
- Work late? It still counts as "today"
- Wake up early? Fresh start after 4 AM

## Workflow Example

### Scenario 1: Completing Your Goal

```
1. Start day with intent: "16 pomodoros today"
2. Plan tasks: "Review code", "Write docs", "Fix bugs"
3. Work through the day...
4. Complete 16th pomodoro
5. ✅ Auto-triggered end-of-day dialog appears
6. Rate your day: ⭐⭐⭐⭐ (4 stars)
7. Distraction: "Too many interruptions in the afternoon"
8. Notes: "Morning was very productive!"
9. Click "Save & Close Day"
10. Confirmation: "Your day has been saved! See you tomorrow! 🌟"
```

### Scenario 2: Ending Early

```
1. Start day with intent: "16 pomodoros"
2. Complete only 10 pomodoros
3. Need to stop early
4. Click "🌙 End Day" button
5. Confirm: "Are you sure?"
6. End-of-day dialog appears
7. Rate your day: ⭐⭐⭐ (3 stars)
8. Distraction: "Emergency meeting derailed my afternoon"
9. Click "Save & Close Day"
10. App resets for next session
```

## Validation

The dialog enforces:
- ✅ **Rating is required** - You must select 1-5 stars before closing
- ✅ **No active session** - Can't end day during an active pomodoro
- ✅ **Distraction field optional** - But encouraged for insights

## After Ending the Day

Once you save your reflection:

1. **Data persisted** - All reflection saved to database
2. **Confirmation shown** - Summary of your day
3. **App resets**:
   - Pomodoro counter resets to 0
   - Task list cleared
   - Session start time cleared
   - ETA display resets
4. **Ready for tomorrow** - Next launch will show Daily Intent dialog

## Analyzing Your Reflections

### Query Your Past Days:

```bash
# See all your day ratings
sqlite3 my_database.db "
  SELECT date, 
         finished_pomos || '/' || target_pomos as progress,
         day_rating as rating,
         main_distraction
  FROM day 
  WHERE day_rating IS NOT NULL
  ORDER BY date DESC
"

# Average rating by week
sqlite3 my_database.db "
  SELECT strftime('%Y-W%W', date) as week,
         AVG(day_rating) as avg_rating,
         AVG(CAST(finished_pomos AS FLOAT) / target_pomos * 100) as completion_pct
  FROM day
  WHERE day_rating IS NOT NULL
  GROUP BY week
  ORDER BY week DESC
"

# Most common distractions
sqlite3 my_database.db "
  SELECT main_distraction, COUNT(*) as times
  FROM day
  WHERE main_distraction != ''
  GROUP BY main_distraction
  ORDER BY times DESC
"
```

## Benefits

### 1. **Self-Awareness**
- Identify recurring distractions
- Recognize productivity patterns
- Understand what works and what doesn't

### 2. **Continuous Improvement**
- Track rating trends over time
- Test interventions (e.g., "no Slack mornings")
- Measure impact of changes

### 3. **Motivation**
- Celebrate high-rated days
- Learn from challenging days
- Build momentum with streaks

### 4. **Accountability**
- Daily ritual reinforces commitment
- Honest reflection prevents self-deception
- Creates psychological closure

## Tips for Better Reflections

### Be Specific About Distractions
❌ Bad: "Distractions"
✅ Good: "Email notifications interrupted 4 deep work sessions"

### Be Honest with Ratings
- Don't inflate ratings
- Don't be too harsh
- Use the full 1-5 scale

### Use Notes for Insights
- "Pomodoro 8-12 were golden hours"
- "Need to block morning for deep work"
- "Friday afternoons are always slow"

### Review Weekly
- Look at your past 7 days
- Identify patterns
- Make one small change

## Future Enhancements

Potential additions to this feature:

1. **Weekly Review** - Summary of the week with trends
2. **Distraction Categories** - Dropdown + free text
3. **Energy Level** - Track energy throughout the day
4. **Goal Adjustment** - Suggest target based on history
5. **Insights Dashboard** - Visual analytics of your reflections
6. **Export Reports** - PDF summary of your week/month
7. **Streak Tracking** - Days meeting target, high ratings
8. **Comparison** - Compare today vs your average

## Related Files

- `hardmode/ui/end_day_dialog.py` - Dialog UI
- `hardmode/ui/main_window.py` - Integration and triggers
- `hardmode/data/manager.py` - Data persistence
- `schema.sql` - Database schema with new columns

## Summary

The End of Day reflection turns your pomodoro app into a learning system. By consistently reflecting on what worked and what didn't, you build awareness and improve over time. The data you collect becomes a personal productivity knowledge base.

**Remember**: The goal isn't perfection. It's progress. 📈
