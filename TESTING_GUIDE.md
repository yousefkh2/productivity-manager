# 🧪 Quick Testing Guide - Smart Task Switching

## Open the App
Visit: **http://localhost:5173**

---

## 🎯 Test Scenario 1: Grace Period (Silent Switch)

### Setup
1. Add 2 tasks: "Task A" and "Task B"
2. Select "Task A"
3. Click **START** on the timer

### Action
- **IMMEDIATELY** (within 10 seconds) click on "Task B"

### ✅ Expected Result
- Task switches to "Task B" silently
- Timer keeps running without interruption
- No dialog appears
- Timer shows "Working on: Task B"

---

## ⚠️ Test Scenario 2: Hard Switch (After Grace Period)

### Setup
1. Make sure you have 2 tasks
2. Select "Task A"
3. Click **START**
4. **Wait for 1 minute** (let timer run to ~24:00 or less)

### Action
- Click on "Task B" in the task list

### ✅ Expected Result
1. **Warning Dialog Appears** with:
   ```
   🔺 Switch Task Mid-Pomodoro?
   
   You're 1:23 into this Pomodoro
   
   Current task: Task A
        ↓
   Switching to: Task B
   
   ⚠️ Switching will:
   • Abort this Pomodoro (won't count)
   • Increase your pause count
   • Start fresh on "Task B"
   ```

2. Two buttons: "Cancel" and "Abort & Switch"

### If you click "Abort & Switch":
- Timer stops
- Timer resets to 25:00
- Task B is selected
- Dialog closes
- Console shows: "Task switched mid-pomodoro - aborting"

### If you click "Cancel":
- Dialog closes
- Still working on Task A
- Timer continues from where it was

---

## 🧪 Test Scenario 3: Switch During Break

### Setup
1. Complete a full pomodoro (or manually switch to break mode)
2. Timer should show "☕ BREAK TIME"

### Action
- Click on any different task

### ✅ Expected Result
- Task switches immediately
- No dialog appears
- Break continues normally

---

## 🧪 Test Scenario 4: Switch When Paused

### Setup
1. Start a timer
2. Click **PAUSE**

### Action
- Click on a different task

### ✅ Expected Result
- Task switches immediately
- No dialog appears
- Timer stays paused

---

## 🐛 What to Look For

### Visual Indicators
- Timer shows correct task name under timer
- "Working on: [Task Name]" updates when switching
- Dialog appears at right time (after 30s)
- Dialog shows correct time elapsed

### Console Logs (Open DevTools → Console)
- "Within grace period, switching task silently" (when switching within 30s)
- "Task switched mid-pomodoro - aborting" (when hard switch confirmed)
- No errors or warnings

### State Consistency
- Selected task highlights in task list
- Timer task name matches selected task
- Pause count increments when aborting
- Timer resets to 25:00 after abort

---

## 🎨 Visual Guide

### Grace Period (0-30s)
```
[Timer: 24:50] ← Still running
Working on: Task B ← Changed silently
```

### Hard Switch (30s+)
```
╔═══════════════════════════════════╗
║  🔺 Switch Task Mid-Pomodoro?    ║
║                                   ║
║  You're 1:23 into this Pomodoro  ║
║                                   ║
║  Current: Task A                  ║
║           ↓                       ║
║  New: Task B                      ║
║                                   ║
║  ⚠️ Switching will:               ║
║  • Abort this Pomodoro           ║
║  • Increase pause count          ║
║  • Start fresh on "Task B"       ║
║                                   ║
║  [Cancel] [Abort & Switch]       ║
╚═══════════════════════════════════╝
```

---

## 🎯 Success Criteria

All these should work:
- ✅ Silent switch within 30s
- ✅ Warning dialog after 30s
- ✅ Abort increments pause count
- ✅ Cancel keeps current task
- ✅ Free switching during break
- ✅ Free switching when paused
- ✅ No crashes or errors
- ✅ Dialog looks good (glass morphism)
- ✅ Animations are smooth

---

## 📝 Notes

- **Grace period is 30 seconds** (easy to test)
- Timer format: MM:SS (e.g., "1:23" = 1 minute 23 seconds)
- Check browser console for debug logs
- Test on Chrome/Firefox for best results
- Disable browser notifications if they're annoying

---

**Ready to test!** Open http://localhost:5173 and try the scenarios above. 🚀
