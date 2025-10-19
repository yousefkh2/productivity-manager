# Break Budget Tracker Feature

## Overview
This feature tracks **all non-work time** throughout the day and compares it against the allocated break budget based on your planned pomodoros. Unlike traditional pause tracking, this calculates break time as **any time you're not actively working** since planning your day.

## How It Works

### Break Budget Calculation
When you plan your day with X pomodoros, the system calculates your total allocated break time:
- **Short breaks**: 5 minutes after each pomodoro (except every 4th)
- **Long breaks**: 15 minutes after every 4th pomodoro
- **Lunch break**: 30 minutes (if planning 8+ pomodoros)

**Example for 16 pomodoros:**
- Short breaks: 12 × 5min = 60min
- Long breaks: 3 × 15min = 45min  
- Lunch: 30min
- **Total: 135 minutes** of allocated break time

### Break Time Calculation
The system tracks break time using a **time-based approach**:

**Formula:** `Break Time Used = Total Elapsed Time - Total Work Time Completed`

This means break time includes:
1. **Time before starting first pomodoro** (procrastination/preparation)
2. **Time between pomodoros** (when timer is idle)
3. **Pause time during pomodoros** (when timer is paused)
4. **Any other idle time** (not actively working)

**The timer only counts work when it's actively running in focus mode.**

### Real-Time Display
In the Daily Progress banner, you'll see:
- **Total break budget** for the day (in minutes)
- **Break time used** so far (including current active pause)
- **Remaining break time** 
- **Visual progress bar** that changes color:
  - **Blue**: Under 80% used (healthy)
  - **Yellow**: 80-99% used (running low)
  - **Red**: 100%+ used (exceeding budget)
- **Dynamic finish time** that shifts forward when you exceed the break budget
  - Shows delay in red: "+X min delay"
  - Updates every second in real-time

### Visual Warnings
- **< 80% used**: Shows normal usage stats
- **80-99% used**: Warning that you're running low on break time
- **100%+ used**: Alert that every additional pause delays your finish time

## Implementation Details

### Timer Component (`Timer.jsx`)
- Tracks `pauseCount` for analytics (how many times paused)
- Notifies parent of timer state changes (running/stopped, time left, mode)
- Simple pause/resume logic without tracking pause duration

### App Component (`App.jsx`)
- Added `calculateBreakBudget()` helper function to calculate total break minutes
- Real-time break budget calculation in Daily Progress banner using:
  - `Total elapsed time` since day was planned
  - `Completed work time` (completed pomodoros × 25 minutes)
  - `Active work time` (current timer progress if running in focus mode)
  - **Break time = Elapsed - Work time**
- Auto-updates every second via `forceUpdate` to show real-time usage
- Visual progress bar with color coding (blue → yellow → red)

### Calculation Logic
```javascript
// Calculate break budget
const totalBreakMinutes = (shortBreaks * 5) + (longBreaks * 15) + lunchBreak;

// Calculate break time used
const totalElapsedMinutes = (now - plannedTime) / (1000 * 60);
const workMinutesCompleted = completedPomos * 25;
const activeWorkMinutes = isRunning && mode === 'focus' 
  ? (totalTime - timeLeft) / 60 
  : 0;
const breakTimeUsed = totalElapsed - workCompleted - activeWork;

// Calculate delay
const delayMinutes = Math.max(0, breakTimeUsed - totalBreakMinutes);

// Adjust finish time
const finishTime = plannedTime + totalWorkAndBreaks + delayMinutes;
```

### Data Flow
1. User plans day → System calculates break budget
2. Timer starts/stops → Parent receives state updates
3. Every second → Break budget recalculates in real-time
4. Display updates → Shows remaining break time and warnings

## User Experience

### Planning Stage
When you plan your day, the system automatically calculates your break budget based on the number of pomodoros.

### During Work
- When you pause the timer, the break budget bar updates in real-time
- You can see how much break time you have left
- Visual warnings help you stay on track

### Consequences
- **Stay within budget**: Finish on time as planned ✅
- **Exceed budget**: Estimated finish time shifts forward minute-by-minute ⏱️
- **No breaks left**: Clear warning that every minute delays your schedule ⚠️

The system provides **immediate feedback** by updating the estimated finish time in real-time, so you always know the true impact of taking breaks.

## Future Enhancements
- Break budget visualization in Analytics tab
- Historical break usage trends over multiple days
- Notifications when approaching break budget limit (80%, 90%, 100%)
- Suggested break schedule to stay on track
- "Recovery mode" suggestions when significantly behind schedule
