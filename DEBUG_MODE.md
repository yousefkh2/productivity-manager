# Debug Mode

## What is Debug Mode?

Debug mode is a testing feature that allows you to quickly test the Pomodoro timer functionality without waiting for full 25-minute sessions.

## Features

- **⚡ Fast Timers**: Focus sessions are 10 seconds, breaks are 5 seconds
- **🚫 No Database Saves**: Completed sessions won't be saved to the database
- **👁️ Visual Indicator**: Clear yellow banner shows when debug mode is active
- **🔄 Easy Toggle**: Multiple ways to enable/disable

## How to Use

### Enable/Disable Debug Mode

1. **Keyboard Shortcut** (recommended): Press `Ctrl + Shift + D`
2. **Button Click**: Click the bug icon (🐛) button in the timer controls
   - Yellow = Debug mode ON
   - Gray = Debug mode OFF

### What Happens in Debug Mode

1. ✅ Timer runs for 10 seconds (focus) or 5 seconds (break)
2. ✅ You still see the review dialog after completing a session
3. ✅ BUT: Nothing gets saved to the database
4. ✅ You can test task switching, pause counts, etc. without polluting your data

### Visual Indicators

- **Yellow banner** at the top of the timer showing:
  - 🐛 Debug Mode Active
  - Timer durations (10s focus, 5s break)
  - Reminder about no database saves
  - Keyboard shortcut hint

- **Bug button** in controls:
  - Yellow with black icon = Debug ON
  - Gray with white icon = Debug OFF

## When to Use

- 🧪 Testing new features
- 🐛 Debugging timer issues
- 🎓 Learning how the app works
- 🚀 Quick demos without waiting 25 minutes

## When NOT to Use

- ❌ During actual work sessions
- ❌ When you want to track real progress
- ❌ When you need accurate time logs

## Technical Details

- Setting is persisted in `localStorage` as `debugMode`
- Timer state is reset when toggling debug mode
- Console logs show debug mode state changes
- No pomodoro records are created in the database

## Troubleshooting

**Debug mode stuck on?**
- Press `Ctrl + Shift + D` to toggle it off
- Or click the bug button until it turns gray
- Check browser console for "🐛 Debug mode DISABLED" message

**Timer still slow in debug mode?**
- Refresh the page after enabling debug mode
- Check the yellow banner shows "10s focus, 5s break"

---

**Pro Tip**: Always disable debug mode before starting real work! Check for the yellow banner to make sure you're in production mode.
