# SPDX-License-Identifier: MIT
"""System tray / menu bar integration placeholder."""

from __future__ import annotations

try:
    from PySide6 import QtGui, QtWidgets
except ImportError:  # pragma: no cover - optional dependency
    QtGui = None
    QtWidgets = None


class Tray(QtWidgets.QSystemTrayIcon if QtWidgets else object):
    """Provide a system tray icon with a basic context menu."""

    def __init__(self, icon: QtGui.QIcon | None = None) -> None:
        if QtWidgets is None:
            raise RuntimeError("PySide6 is required for Tray.")
        super().__init__(icon or QtGui.QIcon())
        menu = QtWidgets.QMenu()
        self.action_open = menu.addAction("Open")
        self.action_quit = menu.addAction("Quit (disabled during pomo)")
        self.setContextMenu(menu)
        self.show()

    def set_tooltip(self, text: str) -> None:
        self.setToolTip(text)

    def set_quit_enabled(self, enabled: bool) -> None:
        self.action_quit.setEnabled(enabled)
