# 📱 Manual Pomodoro Tracking Feature

## Overview
Sometimes you complete pomodoros outside the app (on your phone, paper timer, or just mental tracking). This feature lets you manually add or remove completed pomodoros to/from tasks so you don't undercount your actual work.

## How It Works

### Adding Manual Pomodoros
1. Look at any task in your task list
2. Find the **green plus circle icon** (⊕) next to the trash icon
3. Click it to increment the pomodoros_spent count by 1
4. The progress bar updates immediately
5. Repeat for each pomodoro you completed outside the app

### Removing Pomodoros (Undo Mistakes)
1. Find the **yellow minus circle icon** (⊖) - appears when task has pomodoros
2. Click it to decrement the pomodoros_spent count by 1
3. Can't go below 0
4. Use this to fix accidental clicks

### Visual Indicators
- **Add Icon**: Green plus circle (`PlusCircle`)
- **Remove Icon**: Yellow minus circle (`MinusCircle`) - only shows if count > 0
- **Hover**: Icons scale up and change color
- **Location**: Right side of each task, before delete button
- **Tooltips**: 
  - Plus: "Add completed pomodoro (done outside app)"
  - Minus: "Remove pomodoro (undo mistake)"

### Use Cases

#### 1. **Phone Pomodoros**
You did a 25-minute focus session using a phone timer while away from your computer.
```
Task: "Write report"
Planned: 3 pomodoros
Spent: 1 (in app) → Click + → Now 2
```

#### 2. **Offline Work**
You worked without the app running and tracked time manually.
```
Task: "Design mockups"
Spent: 0 → Click + 3 times → Now 3
```

#### 3. **Cross-Device Work**
You started work on laptop, continued on tablet, came back to laptop.
```
Task: "Code feature"
Laptop: 2 pomodoros (in app)
Tablet: 1 pomodoro → Click + → Total: 3
```

## Important Notes

### ⚠️ Manual Pomodoros Are Not Reviewed
Manually added pomodoros **do not have review data** (focus score, notes, etc.) because:
- They were completed outside the app
- You can't accurately rate your focus hours after the fact
- Reviews are most valuable immediately after completion

**What this means:**
- ✅ Your task progress is accurate (counts toward completion)
- ✅ Your daily pomodoro totals are correct
- ❌ No focus score/review data for these sessions
- ❌ Won't appear in detailed analytics (only counted in totals)

**Best Practice:**
Use the in-app timer whenever possible to get full tracking + reviews. Use manual add as a backup for work done elsewhere.

### 🎯 The Trade-off
```
In-App Timer:
✓ Accurate time tracking
✓ Focus reviews
✓ Pause count tracking
✓ Detailed analytics
✓ Notifications

Manual Add:
✓ Count toward task progress
✓ Honest daily totals
✗ No review data
✗ No detailed analytics
```

## Features

### ✅ Undo Mistakes
- Minus button to decrement count
- Can't go below 0
- Only shows when count > 0
- Yellow color to indicate "removal"

### ✅ Real-time Updates
- Progress bar updates immediately
- Stats update instantly
- Saved to backend automatically

### ✅ No Limits
- Add as many pomodoros as needed
- Can exceed planned amount
- Works on any task (planned or unplanned)

### ✅ Visual Feedback
- Smooth animation on click
- Icon scales and changes color
- Progress bar animates

### ✅ Prevents Undercounting
- Track ALL work, not just app-tracked work
- Honest reflection of time spent
- Better analytics and insights

## Implementation Details

### Component: TaskList.jsx
```jsx
const addManualPomodoro = (task) => {
  onUpdateTask(task.id, {
    ...task,
    pomodoros_spent: (task.pomodoros_spent || 0) + 1,
  });
};
```

### Button Design
- **Icon**: `<PlusCircle size={18} />`
- **Color**: Gray (default) → Green (hover)
- **Animation**: Framer Motion scale
- **Position**: Next to trash icon

### Accessibility
- Tooltip on hover explains purpose
- Click propagation stopped (doesn't select task)
- Works with keyboard (focusable button)

## Example Workflow

### Morning: Plan Your Day
```
Tasks:
- Deep work session (3 pomos)
- Email replies (1 pomo)
- Meeting prep (2 pomos)
```

### Afternoon: Mixed Work
```
Laptop (in app):
- Deep work: 2 pomos completed

Phone (manual timer):
- Email replies: 1 pomo completed
- Deep work: 1 pomo completed

Back to laptop:
- Click + on "Email replies" (1→ now shows 1/1 ✓)
- Click + on "Deep work" (2 → now shows 3/3 ✓)
```

### End of Day: Accurate Stats
```
✓ All work tracked
✓ Accurate pomodoro count
✓ Better insights for tomorrow
```

## Benefits

1. **Honest Tracking**: Count ALL pomodoros, not just in-app ones
2. **Cross-Device**: Work anywhere, track everywhere
3. **Flexibility**: Forgot to start timer? Add it later
4. **Accountability**: See true time investment
5. **Better Planning**: More accurate estimates for future

## Design Philosophy

> "The goal is honest productivity tracking, not perfect app usage."

We encourage users to:
- Use the timer when possible (best tracking)
- Manually add when needed (better than nothing)
- Be honest about time spent (no cheating yourself)

## UI Location
```
┌─────────────────────────────────────┐
│ Task: "Write documentation"         │
│ ████████████░░░░ 75%                │
│ 🕐 3 / 4 pomodoros                  │
│                          [+] [🗑]    │ ← Click [+] to add manual pomo
└─────────────────────────────────────┘
```

## Status: ✅ LIVE

The feature is **active and ready to use**. Just click the green plus circle icon next to any task!

---

**Pro Tip**: At the end of the day, review your tasks and add any pomodoros you did outside the app for accurate daily stats. 📊
