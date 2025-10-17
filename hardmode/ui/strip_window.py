# SPDX-License-Identifier: MIT
"""Docked strip UI for quick controls."""

from __future__ import annotations

try:
    from PySide6 import QtCore, QtWidgets
except ImportError:  # pragma: no cover - optional dependency
    QtCore = None
    QtWidgets = None


class StripWindow(QtWidgets.QWidget if QtWidgets else object):
    """Slim docked strip displaying timer status."""

    def __init__(self) -> None:
        if QtWidgets is None:
            raise RuntimeError("PySide6 is required for StripWindow.")
        super().__init__()
        self.setWindowFlags(
            QtCore.Qt.FramelessWindowHint
            | QtCore.Qt.WindowStaysOnTopHint
            | QtCore.Qt.Tool
        )
        self.setFixedHeight(28)
        self.label = QtWidgets.QLabel("⏱ --:-- | Pomo -/- | —")
        self.label.setAlignment(QtCore.Qt.AlignCenter)

        layout = QtWidgets.QHBoxLayout(self)
        layout.addWidget(self.label)
        layout.setContentsMargins(8, 2, 8, 2)

    def update_text(self, text: str) -> None:
        self.label.setText(text)

    def snap_to_taskbar_edge(self) -> None:
        screen = QtWidgets.QApplication.primaryScreen().availableGeometry()
        self.setGeometry(
            screen.left(),
            screen.bottom() - self.height(),
            screen.width(),
            self.height(),
        )
