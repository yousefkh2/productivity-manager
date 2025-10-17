# SPDX-License-Identifier: MIT
"""Daily Intent Dialog - Set your pomodoro target for the day with ETA calculation."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

try:
    from PySide6 import QtCore, QtWidgets
except ImportError:  # pragma: no cover
    QtCore = QtWidgets = None


class DailyIntentDialog(QtWidgets.QDialog if QtWidgets else object):
    """Dialog to set daily pomodoro target with ETA visualization."""

    def __init__(self, parent=None, default_target: int = 16):
        if QtWidgets is None:
            raise RuntimeError("PySide6 is required.")
        super().__init__(parent)
        
        self.setWindowTitle("Daily Intent - How many pomodoros today?")
        self.setModal(True)
        self.resize(500, 350)
        
        # Main label
        title = QtWidgets.QLabel("How many pomodoros are you planning for today?")
        title.setStyleSheet("font-size: 16px; font-weight: bold; margin-bottom: 10px;")
        title.setAlignment(QtCore.Qt.AlignCenter)
        
        # Pomodoro target input
        self.target_spin = QtWidgets.QSpinBox(self)
        self.target_spin.setRange(1, 32)
        self.target_spin.setValue(default_target)
        self.target_spin.setStyleSheet("font-size: 24px; padding: 10px;")
        self.target_spin.setAlignment(QtCore.Qt.AlignCenter)
        self.target_spin.valueChanged.connect(self._update_eta)
        
        # ETA display
        self.eta_label = QtWidgets.QLabel()
        self.eta_label.setStyleSheet("""
            QLabel {
                font-size: 14px; 
                padding: 15px; 
                background-color: #2c3e50; 
                color: #ffffff;
                border-radius: 5px;
                margin-top: 10px;
                border: 1px solid #34495e;
            }
        """)
        self.eta_label.setWordWrap(True)
        
        # Time breakdown
        self.breakdown_label = QtWidgets.QLabel()
        self.breakdown_label.setStyleSheet("""
            QLabel {
                font-size: 12px; 
                color: #2c3e50; 
                margin-top: 10px;
                font-weight: bold;
            }
        """)
        self.breakdown_label.setWordWrap(True)
        
        # Note
        note = QtWidgets.QLabel("Adjust if you expect longer breaks or meetings.")
        note.setStyleSheet("font-size: 11px; color: #888; font-style: italic; margin-top: 5px;")
        note.setAlignment(QtCore.Qt.AlignCenter)
        
        # Buttons
        button_box = QtWidgets.QDialogButtonBox(
            QtWidgets.QDialogButtonBox.Ok | QtWidgets.QDialogButtonBox.Cancel
        )
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)
        
        # Layout
        layout = QtWidgets.QVBoxLayout()
        layout.addWidget(title)
        layout.addSpacing(20)
        layout.addWidget(self.target_spin, alignment=QtCore.Qt.AlignCenter)
        layout.addSpacing(20)
        layout.addWidget(self.eta_label)
        layout.addWidget(self.breakdown_label)
        layout.addWidget(note)
        layout.addStretch()
        layout.addWidget(button_box)
        
        self.setLayout(layout)
        
        # Initial ETA calculation
        self._update_eta()
    
    def _update_eta(self) -> None:
        """Calculate and display ETA based on current target."""
        target = self.target_spin.value()
        
        # Time calculations
        pomo_duration = 25  # minutes per pomodoro
        short_break = 0     # Skip breaks as requested
        long_break = 30     # One lunch break
        
        # Total focus time
        total_focus_minutes = target * pomo_duration
        focus_hours = total_focus_minutes // 60
        focus_mins = total_focus_minutes % 60
        
        # Estimate breaks (one long break after ~4 hours)
        estimated_breaks = long_break if target >= 8 else 0
        
        # Total time including breaks
        total_minutes = total_focus_minutes + estimated_breaks
        total_hours = total_minutes // 60
        total_mins = total_minutes % 60
        
        # Calculate finish time (assuming start now)
        start_time = datetime.now()
        finish_time = start_time + timedelta(minutes=total_minutes)
        
        # Format finish time
        finish_str = finish_time.strftime("%I:%M %p").lstrip('0')
        
        # Update ETA label
        self.eta_label.setText(
            f"🎯 You'll finish around {finish_str}\n"
            f"(assuming you start now and take one lunch break)"
        )
        
        # Update breakdown
        self.breakdown_label.setText(
            f"📊 Total focus time: {focus_hours}h {focus_mins}m\n"
            f"⏱️  Estimated total time: {total_hours}h {total_mins}m"
        )
    
    def get_target(self) -> int:
        """Get the selected target."""
        return self.target_spin.value()


def show_daily_intent_dialog(parent=None, default_target: int = 16) -> Optional[int]:
    """
    Show the daily intent dialog and return the target, or None if cancelled.
    
    Args:
        parent: Parent widget
        default_target: Default pomodoro target
        
    Returns:
        Target pomodoros, or None if cancelled
    """
    dialog = DailyIntentDialog(parent, default_target)
    if dialog.exec() == QtWidgets.QDialog.Accepted:
        return dialog.get_target()
    return None
