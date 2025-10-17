# SPDX-License-Identifier: MIT
"""End-of-day review dialog placeholder."""

from __future__ import annotations

try:
    from PySide6 import QtWidgets
except ImportError:  # pragma: no cover - optional dependency
    QtWidgets = None


class ReviewDialog(QtWidgets.QDialog if QtWidgets else object):
    """Collect user feedback after each pomodoro session."""

    def __init__(self, parent: QtWidgets.QWidget | None = None) -> None:
        if QtWidgets is None:
            raise RuntimeError("PySide6 is required for ReviewDialog.")
        super().__init__(parent)
        self.setWindowTitle("Session review")

        self.focus = QtWidgets.QSpinBox(self)
        self.focus.setRange(1, 5)
        self.focus.setValue(3)

        self.reason = QtWidgets.QComboBox(self)
        self.reason.addItems(
            [
                "interruption",
                "phone",
                "music helped",
                "context switch",
                "low energy",
                "environment",
            ]
        )

        self.note = QtWidgets.QLineEdit(self)

        form = QtWidgets.QFormLayout()
        form.addRow("Focus (1–5)", self.focus)
        form.addRow("Reason", self.reason)
        form.addRow("Note", self.note)

        button = QtWidgets.QPushButton("Save", self)
        button.clicked.connect(self.accept)  # type: ignore[attr-defined]

        layout = QtWidgets.QVBoxLayout(self)
        layout.addLayout(form)
        layout.addWidget(button)

    def get_values(self) -> tuple[int, str, str]:
        """Return the form contents as (focus, reason, note)."""
        return (
            self.focus.value(),
            self.reason.currentText(),
            self.note.text().strip(),
        )
