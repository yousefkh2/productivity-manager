# ⏱️ Timer Persistence Across Page Refreshes

## Overview
The timer now persists across page refreshes, tab switches, and browser restarts! Your pomodoro keeps running even when you close the page.

## How It Works

### State Persistence
The timer saves its state to `localStorage` every time it changes:
```javascript
{
  timeLeft: 1380,        // seconds remaining
  isRunning: true,       // is timer actively counting
  mode: 'focus',         // 'focus' or 'break'
  pauseCount: 2,         // number of pauses
  timestamp: 1234567890  // when state was saved
}
```

### Smart Time Adjustment
When you return to the page, the timer:
1. **Loads saved state** from localStorage
2. **Calculates elapsed time** since you left
3. **Adjusts timeLeft** accordingly
4. **Continues running** if it was running before

### Example Scenarios

#### Scenario 1: Quick Refresh
```
Before refresh:
- Timer at 20:00
- Running ✓

After refresh (2 seconds later):
- Timer at 19:58
- Still running ✓
```

#### Scenario 2: Long Break
```
Before closing tab:
- Timer at 15:30
- Running ✓

Reopen tab (5 minutes later):
- Timer at 10:30 (15:30 - 5:00)
- Still running ✓
```

#### Scenario 3: Timer Completed While Away
```
Before closing:
- Timer at 2:00
- Running ✓

Reopen (5 minutes later):
- Timer at 0:00
- Shows completion dialog! 🎉
```

#### Scenario 4: Paused Timer
```
Before refresh:
- Timer at 10:00
- Paused (not running)

After refresh:
- Timer at 10:00 (unchanged)
- Still paused
```

## Edge Cases Handled

### ✅ 2-Hour Timeout
If state is older than 2 hours, it's discarded (prevents stale state):
```javascript
const stateAge = Date.now() - state.timestamp;
if (stateAge < 2 * 60 * 60 * 1000) {
  // Restore state
}
```

### ✅ Timer Expiration
If timer ran out while page was closed:
```javascript
const elapsedSeconds = Math.floor(stateAge / 1000);
const adjustedTimeLeft = Math.max(0, state.timeLeft - elapsedSeconds);

if (adjustedTimeLeft === 0) {
  // Trigger completion logic
  handleComplete();
}
```

### ✅ Invalid State
If localStorage is corrupted or unavailable:
```javascript
try {
  const state = JSON.parse(localStorage.getItem('timerState'));
} catch (e) {
  console.error('Failed to load timer state:', e);
  return null; // Start fresh
}
```

## User Experience

### What You'll See

#### Timer Running → Refresh
- ✅ Timer continues counting down
- ✅ Progress circle updates
- ✅ Button shows "Pause" (correct state)
- ✅ Task still selected

#### Timer Paused → Refresh
- ✅ Timer stays at same time
- ✅ Button shows "Start" (correct state)
- ✅ Progress circle unchanged

#### Timer Completes While Away
- ✅ Completion notification appears
- ✅ Review dialog shows (for focus sessions)
- ✅ Auto-switches to break mode

## Implementation Details

### Load State on Mount
```javascript
const loadTimerState = () => {
  const saved = localStorage.getItem('timerState');
  const state = JSON.parse(saved);
  
  if (state.isRunning && state.timeLeft > 0) {
    const elapsedSeconds = Math.floor(stateAge / 1000);
    const adjustedTimeLeft = Math.max(0, state.timeLeft - elapsedSeconds);
    
    return {
      ...state,
      timeLeft: adjustedTimeLeft,
      isRunning: adjustedTimeLeft > 0,
    };
  }
  
  return state;
};
```

### Save State on Change
```javascript
useEffect(() => {
  const timerState = {
    timeLeft,
    isRunning,
    mode,
    pauseCount,
    timestamp: Date.now(),
  };
  localStorage.setItem('timerState', JSON.stringify(timerState));
}, [timeLeft, isRunning, mode, pauseCount]);
```

### Check for Completion on Mount
```javascript
useEffect(() => {
  if (savedState && savedState.isRunning && timeLeft === 0) {
    console.log('Timer completed while page was closed');
    handleComplete();
  }
}, []); // Run once on mount
```

## Benefits

### 🎯 For Users
- **Never lose progress** from accidental refreshes
- **Multitasking friendly** - close tab, work continues
- **Cross-tab safe** - timer state syncs via localStorage
- **No "oops" moments** - timer keeps running even if you close browser

### 💻 For Developers
- **Simple implementation** - just localStorage
- **No server needed** - client-side only
- **Automatic cleanup** - 2-hour timeout prevents stale data
- **Graceful degradation** - falls back to fresh state if needed

## Testing

### Test 1: Basic Refresh
1. Start a pomodoro (e.g., 25:00)
2. Wait 10 seconds (now at 24:50)
3. Press F5 (refresh)
4. ✅ Timer should be at ~24:50 and running

### Test 2: Close and Reopen Tab
1. Start a pomodoro
2. Note the time (e.g., 20:00)
3. Close the tab
4. Wait 30 seconds
5. Reopen tab
6. ✅ Timer should be at ~19:30 and running

### Test 3: Timer Completes While Away
1. Start a pomodoro
2. Manually set `timeLeft` to 5 in localStorage (dev tools)
3. Close tab, wait 10 seconds
4. Reopen tab
5. ✅ Completion dialog should appear

### Test 4: Paused Timer Persists
1. Start timer, then pause
2. Note the time (e.g., 15:30)
3. Refresh page
4. ✅ Timer should still be at 15:30 and paused

## Limitations

### ❌ Multi-Tab Sync
- State is read once on mount
- Changes in one tab don't sync to others in real-time
- Use single tab for best experience

### ❌ Server Sync
- Timer runs client-side only
- Not synced to backend until completion
- Phone timer won't sync with web timer (use manual add feature)

### ❌ Browser Storage Limits
- Depends on localStorage being available
- Private browsing may not persist
- Clearing browser data will lose state

## Future Enhancements

Possible improvements:
- [ ] Multi-tab sync via BroadcastChannel API
- [ ] Sync running timer to backend for cross-device
- [ ] Visual indicator showing "restored from saved state"
- [ ] Recover from invalid state more gracefully

## Status: ✅ LIVE

The timer persistence feature is **active now**! Try refreshing the page while a timer is running - it will keep going! 🎯⏱️
