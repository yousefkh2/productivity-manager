# 🔒 Single Instance Protection

## Problem

Running multiple instances of Hardmode Pomodoro simultaneously can cause:
- **Data corruption** - Multiple processes writing to same database
- **Conflicting timers** - Different sessions overwriting each other
- **Sync issues** - Race conditions with API sync
- **Confused state** - Not knowing which window is "real"

## Solution

Implemented a **file-based locking mechanism** that ensures only one instance can run at a time.

## How It Works

### File Lock (`/tmp/hardmode-pomo.lock`)

When you start the app:

1. **First Instance**:
   ```
   ✓ Creates /tmp/hardmode-pomo.lock
   ✓ Acquires exclusive lock (fcntl.LOCK_EX)
   ✓ Writes PID to lock file
   ✓ App starts normally
   ```

2. **Second Instance (attempt)**:
   ```
   ❌ Tries to acquire lock on /tmp/hardmode-pomo.lock
   ❌ Lock is already held by first instance
   ❌ Shows error message
   ❌ Exits immediately with code 1
   ```

### Error Message

If you try to start a second instance:

```
❌ ERROR: Hardmode Pomodoro is already running!
   Only one instance can run at a time to prevent data corruption.
   Please close the existing instance first.
```

### Lock Release

The lock is automatically released when:
- ✅ You close the app normally
- ✅ App crashes (OS releases file lock)
- ✅ Process is killed
- ✅ System reboots

## Implementation

### Core Module: `hardmode/single_instance.py`

```python
class SingleInstanceLock:
    """Ensures only one instance runs at a time using file locking."""
    
    def acquire(self) -> bool:
        """Try to acquire exclusive lock."""
        # Returns True if successful, False if another instance running
    
    def release(self) -> None:
        """Release the lock and clean up."""
```

### Integration: `hardmode/main.py`

```python
def main():
    # Check for single instance - exits if another running
    instance_lock = check_single_instance()
    
    # Ensure lock released on exit
    atexit.register(instance_lock.release)
    
    # ... rest of app initialization
    
    # Explicit cleanup on normal exit
    instance_lock.release()
```

## Testing

### Manual Test:

1. Start first instance:
   ```bash
   source .venv/bin/activate && python -m hardmode.main
   ```

2. Try to start second instance (in another terminal):
   ```bash
   source .venv/bin/activate && python -m hardmode.main
   ```

3. Expected result:
   ```
   ❌ ERROR: Hardmode Pomodoro is already running!
      Only one instance can run at a time to prevent data corruption.
      Please close the existing instance first.
   ```

### Automated Test:

```bash
./test_single_instance.sh
```

## Edge Cases Handled

### Stale Lock File

If the app crashes and leaves a lock file behind:
- **OS automatically releases the file lock** when process dies
- Next instance can acquire the lock successfully
- Old lock file is overwritten

### Process Killed (kill -9)

- File lock is released by OS immediately
- No cleanup needed
- Next instance starts normally

### System Restart

- Lock file in `/tmp` is cleared on reboot
- Fresh start guaranteed

## Benefits

✅ **Data Safety** - Prevents database corruption
✅ **User Experience** - Clear error message
✅ **Automatic Cleanup** - No manual intervention needed
✅ **Cross-Platform** - Works on Linux/macOS (fcntl)
✅ **Robust** - Handles crashes and kills gracefully

## Technical Details

### Lock Type: `fcntl.LOCK_EX | fcntl.LOCK_NB`

- `LOCK_EX`: Exclusive lock (only one process)
- `LOCK_NB`: Non-blocking (fails immediately if locked)

### Lock File Location: `/tmp/hardmode-pomo.lock`

- Temporary directory (auto-cleaned on reboot)
- User-writable
- Standard location for app locks

### PID Storage

Lock file contains the PID of the running instance:
```bash
$ cat /tmp/hardmode-pomo.lock
330720
```

This helps identify which process holds the lock.

## Troubleshooting

### Problem: Can't start app, no other instance visible

**Solution**: Check for background processes:
```bash
ps aux | grep "hardmode.main"
```

Kill if found:
```bash
pkill -f "python -m hardmode.main"
```

### Problem: Lock file exists but no process running

**Solution**: Remove stale lock file:
```bash
rm /tmp/hardmode-pomo.lock
```

The app will clean this up automatically on next start.

### Problem: Want to force multiple instances (testing only)

**Solution**: Temporarily disable lock by commenting out in `main.py`:
```python
# instance_lock = check_single_instance()  # COMMENTED FOR TESTING
```

⚠️ **WARNING**: Only do this for testing! Risk of data corruption!

## Future Enhancements

Possible improvements:

1. **PID Validation**: Check if PID in lock file is actually running
2. **Graceful Takeover**: Offer to close other instance
3. **Multi-User Support**: User-specific lock files
4. **Windows Support**: Alternative locking mechanism (fcntl not available)

## Platform Compatibility

| Platform | Status | Mechanism |
|----------|--------|-----------|
| Linux | ✅ Supported | fcntl file locking |
| macOS | ✅ Supported | fcntl file locking |
| Windows | ⚠️ Needs adaptation | Win32 file locking |

For Windows support, would need to use:
- `msvcrt.locking()` or
- `win32file.LockFileEx()` or
- Named mutexes

## Summary

The single instance lock is a critical safety feature that:
- **Prevents data corruption** from concurrent access
- **Provides clear feedback** when blocked
- **Cleans up automatically** in all scenarios
- **Works transparently** without user intervention

You can now safely use the app knowing that only one instance will ever access your data at a time! 🔒
