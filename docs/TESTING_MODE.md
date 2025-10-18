# Testing Mode - Quick Pomodoro Testing

## What Changed
- **Focus sessions**: 10 seconds (was 25 minutes)
- **Break sessions**: 5 seconds (was 5 minutes)

## What to Test

### 1. Basic Timer Flow
- [ ] Start a focus session (10 seconds)
- [ ] Timer counts down correctly
- [ ] Notification appears when complete
- [ ] Auto-switches to break (5 seconds)
- [ ] Break completes and switches back to focus

### 2. Task Completion & Saving
- [ ] Select a task
- [ ] Complete a Pomodoro (10 seconds)
- [ ] Check if `pomodoros_spent` increases
- [ ] Verify task shows updated count
- [ ] Complete multiple Pomodoros on same task

### 3. Browser Tab/Window Behavior
- [ ] Start a Pomodoro
- [ ] Close the browser tab mid-session
- [ ] Reopen the app
- [ ] Check if progress is lost (expected) or saved
- [ ] Verify day data still exists

### 4. PiP Window Testing
- [ ] Start a Pomodoro
- [ ] Open PiP window
- [ ] Timer updates in PiP window
- [ ] Close main window but keep PiP open
- [ ] See if PiP continues (it should)
- [ ] PiP notification when timer completes

### 5. End of Day Reflection
- [ ] Complete at least 1 Pomodoro
- [ ] Click "End Day" button (if available)
- [ ] Fill out reflection dialog
- [ ] Verify data is saved

### 6. Data Persistence
- [ ] Create tasks in Plan Day
- [ ] Complete some Pomodoros
- [ ] Refresh the browser
- [ ] Check if tasks and counts persist
- [ ] Check if day data persists

### 7. Multiple Tasks
- [ ] Add multiple tasks
- [ ] Switch between tasks during Pomodoros
- [ ] Verify each task tracks its own count
- [ ] Delete a task mid-day
- [ ] Verify data consistency

## Expected Behaviors

### When Closing Browser Mid-Session
- **Desktop App**: Session continues in background, timer keeps running
- **Web App**: Session is lost, timer stops (browser limitation)
- **Solution**: Use PiP window to keep timer visible and running

### Notifications
- Browser notification when Pomodoro completes
- Only works if you granted notification permission
- May not work in some browsers/OS combinations

### Data Persistence
- Tasks and day data saved to backend
- Survives browser refresh
- Pomodoro counts persist
- Current timer state does NOT persist (by design)

## Reverting to Production Times

When done testing, change these values back:

### In Timer.jsx (around line 11-12)
```javascript
const FOCUS_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60;  // 5 minutes
```

### In PipTimer.jsx (2 places)
Search for "TESTING:" comments and change:
```javascript
const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
```

## Quick Test Script
1. Refresh browser
2. Select a task
3. Click Start
4. Wait 10 seconds → Notification should appear
5. Auto-switches to 5-second break
6. Wait 5 seconds → Switches back to focus
7. Check task shows "1 Pomodoro completed"

---

**Ready to test!** 🚀 Refresh the browser and try completing a full Pomodoro cycle in just 15 seconds!
