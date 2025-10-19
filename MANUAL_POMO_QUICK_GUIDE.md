# 🎯 Manual Pomodoro Feature - Quick Reference

## Buttons You'll See

```
Task: "Write documentation"
████████████░░░░ 75%
🕐 3 / 4 pomodoros
                     [➖] [➕] [🗑]
                      │    │    │
                      │    │    └─── Delete task
                      │    └──────── Add manual pomo (green)
                      └───────────── Remove pomo (yellow, only if count > 0)
```

## Quick Actions

### ➕ Add Manual Pomodoro (Green Plus Circle)
**When to use:**
- Did a pomo on your phone ✅
- Used a physical timer ✅
- Forgot to start app timer ✅
- Worked on another device ✅

**What happens:**
- Count increases by 1
- Progress bar updates
- Saved immediately
- **No review data** (see note below)

### ➖ Remove Pomodoro (Yellow Minus Circle)
**When to use:**
- Clicked plus by mistake ✅
- Over-counted your work ✅
- Need to correct the count ✅

**What happens:**
- Count decreases by 1
- Can't go below 0
- Button hidden when count = 0

## 📊 Review Data: Important!

### In-App Timer Pomodoros
✅ Full tracking with review data:
```
{
  duration: 25 minutes,
  focus_score: 4/5,
  reason: "Deep flow state",
  note: "Very productive!",
  pause_count: 2,
  task_name: "Write code"
}
```

### Manually Added Pomodoros
⚠️ **No review data** - just increments the counter:
```
Task.pomodoros_spent += 1
```

**Why?**
- You can't accurately remember your focus level from hours ago
- Review is most valuable immediately after work
- Manual add is for **counting**, not **tracking quality**

**Impact:**
- ✅ Counts toward task completion
- ✅ Counts in daily totals
- ❌ No focus score
- ❌ Won't show in detailed analytics
- ❌ No review notes

## 💡 Best Practices

### Ideal Workflow
1. **Always use in-app timer when possible** (full tracking)
2. **Add manual pomos at end of day** (for work done elsewhere)
3. **Review your counts before ending the day** (catch mistakes)

### Example Day
```
Morning (at desk - use app timer):
- Deep work: 3 pomos with reviews ✅✅✅

Afternoon (coffee shop - phone timer):
- Deep work: 2 pomos (no reviews)

Evening (back at desk - add manually):
- Click + twice on "Deep work"
- Final count: 5/5 ✓
```

## 🎨 Visual Guide

### Before Adding
```
┌──────────────────────────────────────┐
│ Task: Deep Work                      │
│ ██████░░░░░░ 50%                     │
│ 🕐 2 / 4 pomodoros                   │
│                            [➕] [🗑]  │
└──────────────────────────────────────┘
```

### After Adding 2 Pomos
```
┌──────────────────────────────────────┐
│ Task: Deep Work                      │
│ ████████████ 100% ✨                 │
│ 🕐 4 / 4 pomodoros                   │
│                      [➖] [➕] [🗑]  │ ← Minus now visible!
└──────────────────────────────────────┘
```

### After Accidentally Adding 1 More (Oops!)
```
┌──────────────────────────────────────┐
│ Task: Deep Work                      │
│ ██████████████ 125%                  │
│ 🕐 5 / 4 pomodoros (Target exceeded) │
│                      [➖] [➕] [🗑]  │ ← Click minus to fix!
└──────────────────────────────────────┘
```

## ⚙️ Technical Details

### Add Function
```jsx
const addManualPomodoro = (task) => {
  onUpdateTask(task.id, {
    ...task,
    pomodoros_spent: (task.pomodoros_spent || 0) + 1,
  });
};
```

### Remove Function
```jsx
const removeManualPomodoro = (task) => {
  if ((task.pomodoros_spent || 0) > 0) {
    onUpdateTask(task.id, {
      ...task,
      pomodoros_spent: task.pomodoros_spent - 1,
    });
  }
};
```

### Conditional Rendering
```jsx
{/* Only show minus if count > 0 */}
{!disabled && (task.pomodoros_spent || 0) > 0 && (
  <motion.button ... >
    <MinusCircle size={18} />
  </motion.button>
)}
```

## 🚀 Try It Now!

1. Open your app
2. Look at any task
3. See the green plus circle? Click it!
4. See the yellow minus appear? That's your undo button!
5. Play around - you can't break anything 😊

---

**Remember:** Use the in-app timer for full tracking. Use manual add/remove for backup counting and corrections. 🎯
