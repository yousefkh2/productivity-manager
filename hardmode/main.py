# SPDX-License-Identifier: MIT
"""Executable entry point for the Hardmode Pomodoro application."""

from __future__ import annotations

import sys
import atexit

try:
    from PySide6 import QtWidgets
except ImportError as exc:  # pragma: no cover - optional dependency
    raise SystemExit(
        "PySide6 must be installed to run the Hardmode Pomodoro app."
    ) from exc

from hardmode.core.timer_fsm import TimerFSM
from hardmode.data.db import (
    DEFAULT_DB_PATH,
    get_connection,
    initialize_database,
)
from hardmode.data.manager import DataManager
from hardmode.ui.main_window import MainWindow
from hardmode.single_instance import check_single_instance


def main() -> None:
    """Start the PySide6 application and main window."""
    # Check for single instance - will exit if another instance is running
    instance_lock = check_single_instance()
    
    # Ensure lock is released on exit
    atexit.register(instance_lock.release)
    
    conn = get_connection(DEFAULT_DB_PATH)
    initialize_database(conn)
    
    # Use DataManager instead of PomodoroRepository
    # This gives you both local storage AND API sync!
    data_manager = DataManager(conn)
    timer = TimerFSM()

    app = QtWidgets.QApplication(sys.argv)
    window = MainWindow(timer=timer, repository=data_manager)
    window.show()
    exit_code = app.exec()
    
    # Cleanup
    conn.close()
    instance_lock.release()
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
