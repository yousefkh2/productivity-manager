# SPDX-License-Identifier: MIT
"""Quick Start Next Dialog - Skip breaks and start immediately."""

from __future__ import annotations

try:
    from PySide6 import QtCore, QtWidgets
except ImportError:  # pragma: no cover
    QtCore = QtWidgets = None


class StartNextDialog(QtWidgets.QDialog if QtWidgets else object):
    """Simple dialog to start next pomodoro immediately."""

    def __init__(self, parent=None, completed_count: int = 0, target: int = 16):
        if QtWidgets is None:
            raise RuntimeError("PySide6 is required.")
        super().__init__(parent)
        
        self.setWindowTitle("Pomodoro Complete!")
        self.setModal(True)
        self.resize(400, 200)
        
        # Main message
        progress = f"{completed_count}/{target}"
        title = QtWidgets.QLabel(f"✅ Pomodoro complete! ({progress})")
        title.setStyleSheet("font-size: 18px; font-weight: bold; margin-bottom: 10px;")
        title.setAlignment(QtCore.Qt.AlignCenter)
        
        # Question
        question = QtWidgets.QLabel("Ready to start the next one?")
        question.setStyleSheet("font-size: 14px; margin-bottom: 20px;")
        question.setAlignment(QtCore.Qt.AlignCenter)
        
        # Buttons - Make "Start Next" the default and prominent
        self.start_button = QtWidgets.QPushButton("🚀 Start Next Pomodoro")
        self.start_button.setStyleSheet("""
            QPushButton {
                font-size: 14px;
                font-weight: bold;
                padding: 15px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        self.start_button.setDefault(True)
        self.start_button.clicked.connect(self.accept)
        
        self.break_button = QtWidgets.QPushButton("Take a Break")
        self.break_button.setStyleSheet("""
            QPushButton {
                font-size: 12px;
                padding: 10px;
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #e0e0e0;
            }
        """)
        self.break_button.clicked.connect(self.reject)
        
        # Layout
        layout = QtWidgets.QVBoxLayout()
        layout.addWidget(title)
        layout.addWidget(question)
        layout.addSpacing(20)
        layout.addWidget(self.start_button)
        layout.addSpacing(10)
        layout.addWidget(self.break_button)
        layout.addStretch()
        
        self.setLayout(layout)


def ask_start_next(parent=None, completed_count: int = 0, target: int = 16) -> bool:
    """
    Ask if user wants to start next pomodoro immediately.
    
    Args:
        parent: Parent widget
        completed_count: Number of completed pomodoros today
        target: Daily target
        
    Returns:
        True if user wants to start next, False for break
    """
    dialog = StartNextDialog(parent, completed_count, target)
    return dialog.exec() == QtWidgets.QDialog.Accepted
