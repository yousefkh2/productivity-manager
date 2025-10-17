# SPDX-License-Identifier: MIT
"""Single instance lock to prevent multiple app instances running simultaneously."""

from __future__ import annotations

import os
import sys
import fcntl
from pathlib import Path


class SingleInstanceLock:
    """
    Ensures only one instance of the application runs at a time.
    Uses file locking to prevent multiple instances.
    """
    
    def __init__(self, lock_file: str = "/tmp/hardmode-pomo.lock"):
        """
        Initialize the single instance lock.
        
        Args:
            lock_file: Path to the lock file
        """
        self.lock_file = lock_file
        self.lock_fd = None
    
    def acquire(self) -> bool:
        """
        Try to acquire the lock.
        
        Returns:
            True if lock acquired, False if another instance is running
        """
        try:
            # Open lock file (create if doesn't exist)
            self.lock_fd = open(self.lock_file, 'w')
            
            # Try to acquire exclusive lock (non-blocking)
            fcntl.flock(self.lock_fd.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            
            # Write PID to lock file
            self.lock_fd.write(str(os.getpid()))
            self.lock_fd.flush()
            
            return True
            
        except IOError:
            # Lock already held by another process
            return False
        except Exception as e:
            print(f"⚠ Error acquiring lock: {e}")
            return False
    
    def release(self) -> None:
        """Release the lock."""
        if self.lock_fd:
            try:
                fcntl.flock(self.lock_fd.fileno(), fcntl.LOCK_UN)
                self.lock_fd.close()
                
                # Clean up lock file
                if os.path.exists(self.lock_file):
                    os.remove(self.lock_file)
            except Exception as e:
                print(f"⚠ Error releasing lock: {e}")
    
    def __enter__(self):
        """Context manager entry."""
        if not self.acquire():
            raise RuntimeError("Another instance is already running")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.release()
        return False


def check_single_instance() -> SingleInstanceLock:
    """
    Check if another instance is running and acquire lock.
    
    Returns:
        SingleInstanceLock instance
        
    Raises:
        SystemExit: If another instance is already running
    """
    lock = SingleInstanceLock()
    
    if not lock.acquire():
        print("\n❌ ERROR: Hardmode Pomodoro is already running!")
        print("   Only one instance can run at a time to prevent data corruption.")
        print("   Please close the existing instance first.\n")
        sys.exit(1)
    
    return lock
