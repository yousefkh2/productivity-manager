# Dynamic Finish Time Feature

## Overview
The **Estimated Finish** time is now dynamic and adjusts in real-time based on your break usage. When you exceed your allocated break budget, the finish time shifts forward minute-by-minute to reflect the actual delay.

## How It Works

### Base Calculation (Original Plan)
When you plan your day:
```
Estimated Finish = Planned Time + (Work Minutes) + (Break Minutes)

Example: 16 pomodoros starting at 9:00 AM
- Work: 16 × 25min = 400 minutes
- Breaks: 135 minutes (short + long + lunch)
- Total: 535 minutes = 8 hours 55 minutes
- Estimated Finish: 5:55 PM
```

### Dynamic Adjustment (Real-Time)
As time passes, the system tracks:
1. **Total elapsed time** since planning
2. **Work time completed** (completed pomodoros × 25 min)
3. **Current active work** (if timer is running)
4. **Break time used** = Elapsed - Work completed - Active work

When break time exceeds the budget:
```
Delay = Break Time Used - Break Budget
New Finish Time = Original Finish + Delay
```

## Visual Feedback

### On Schedule
```
Estimated Finish: 5:55 PM
```
No indicator - you're on track!

### Behind Schedule
```
Estimated Finish: 6:15 PM
                 +20 min delay  (in red)
```
Shows how many extra minutes you've accumulated beyond the break budget.

## Real-World Example

**Planned Day: 16 pomodoros starting at 9:00 AM**
- Break budget: 135 minutes
- Original finish: 5:55 PM

**Scenario 1: On Track**
- Time: 12:00 PM (3 hours elapsed)
- Work done: 5 pomodoros = 125 minutes
- Break used: 180 - 125 = 55 minutes
- Break budget remaining: 135 - 55 = 80 minutes ✅
- Finish time: 5:55 PM (no change)

**Scenario 2: Behind Schedule**
- Time: 12:00 PM (3 hours elapsed)
- Work done: 3 pomodoros = 75 minutes
- Break used: 180 - 75 = 105 minutes
- Break budget remaining: 135 - 105 = 30 minutes ⚠️
- Finish time: 5:55 PM (still on track, but using breaks faster)

**Scenario 3: Over Budget**
- Time: 3:00 PM (6 hours elapsed)
- Work done: 8 pomodoros = 200 minutes
- Break used: 360 - 200 = 160 minutes
- Break budget exceeded by: 160 - 135 = 25 minutes ⚠️
- Finish time: 6:20 PM (+25 min delay) 🔴

**Scenario 4: Significantly Behind**
- Time: 5:00 PM (8 hours elapsed)
- Work done: 8 pomodoros = 200 minutes
- Break used: 480 - 200 = 280 minutes
- Break budget exceeded by: 280 - 135 = 145 minutes ⚠️
- Finish time: 8:20 PM (+145 min = +2h 25min delay) 🔴🔴

## Update Frequency
The finish time recalculates **every second**, so you see the impact immediately:
- Taking a long lunch? Watch the finish time shift forward.
- Procrastinating on starting? The delay grows in real-time.
- Getting back to work? The delay stabilizes (but doesn't decrease - lost time is lost).

## Key Insights

### What Increases Delay
- ❌ Not starting work promptly
- ❌ Long breaks between pomodoros
- ❌ Extended lunch breaks
- ❌ Pausing frequently
- ❌ Distractions and interruptions

### What Prevents Delay
- ✅ Starting work quickly after planning
- ✅ Taking only scheduled breaks
- ✅ Resuming work promptly after breaks
- ✅ Minimizing pauses during pomodoros
- ✅ Staying focused

### Important Note
**The delay can only increase or stay the same** - it never decreases. Once you've used extra break time, that time is gone. The system is showing you the **reality** of your day, not a wish.

## Psychology
This feature creates **immediate accountability**:
- You can't lie to yourself about "just 5 more minutes"
- Every minute of procrastination has a visible cost
- The pressure to stay on track is constant and real
- You see the consequences of your choices in real-time

This is **hardmode** - the timer doesn't lie, and neither does your finish time.
