# SPDX-License-Identifier: MIT
"""
End of Day Reflection Dialog
Shows when user completes their daily goal or clicks "End Day"
"""

from PySide6 import QtWidgets, QtCore, QtGui


class EndDayDialog(QtWidgets.QDialog):
    """Dialog for end-of-day reflection and rating."""
    
    def __init__(self, parent=None, completed_pomos: int = 0, target_pomos: int = 0):
        super().__init__(parent)
        self.completed_pomos = completed_pomos
        self.target_pomos = target_pomos
        self.result_data = None
        
        self.setWindowTitle("End of Day Reflection")
        self.setModal(True)
        self.setMinimumWidth(500)
        
        self._setup_ui()
    
    def _setup_ui(self) -> None:
        """Setup the dialog UI."""
        layout = QtWidgets.QVBoxLayout(self)
        layout.setSpacing(20)
        
        # Header
        header = QtWidgets.QLabel("🌙 Day Complete!")
        header.setStyleSheet("font-size: 24px; font-weight: bold; color: #2c3e50;")
        header.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(header)
        
        # Summary
        if self.completed_pomos >= self.target_pomos:
            summary_text = f"🎉 Congratulations! You completed all {self.target_pomos} pomodoros!"
            summary_color = "#27ae60"
        else:
            summary_text = f"You completed {self.completed_pomos} out of {self.target_pomos} pomodoros."
            summary_color = "#f39c12"
        
        summary = QtWidgets.QLabel(summary_text)
        summary.setStyleSheet(f"font-size: 14px; color: {summary_color}; padding: 10px;")
        summary.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        summary.setWordWrap(True)
        layout.addWidget(summary)
        
        # Separator
        line1 = QtWidgets.QFrame()
        line1.setFrameShape(QtWidgets.QFrame.Shape.HLine)
        line1.setStyleSheet("background-color: #ddd;")
        layout.addWidget(line1)
        
        # Question 1: Main distraction
        distraction_label = QtWidgets.QLabel("What got in your way today?")
        distraction_label.setStyleSheet("font-size: 14px; font-weight: bold; color: #2c3e50;")
        layout.addWidget(distraction_label)
        
        distraction_hint = QtWidgets.QLabel(
            "Think about interruptions, distractions, or challenges you faced..."
        )
        distraction_hint.setStyleSheet("font-size: 11px; color: #7f8c8d; font-style: italic;")
        distraction_hint.setWordWrap(True)
        layout.addWidget(distraction_hint)
        
        self.distraction_input = QtWidgets.QTextEdit()
        self.distraction_input.setPlaceholderText(
            "e.g., 'Too many Slack notifications', 'Unexpected meetings', 'Feeling tired', etc."
        )
        self.distraction_input.setMaximumHeight(100)
        self.distraction_input.setStyleSheet("""
            QTextEdit {
                font-size: 13px;
                padding: 8px;
                border: 2px solid #ddd;
                border-radius: 5px;
                background-color: white;
            }
            QTextEdit:focus {
                border: 2px solid #3498db;
            }
        """)
        layout.addWidget(self.distraction_input)
        
        layout.addSpacing(10)
        
        # Question 2: Day rating
        rating_label = QtWidgets.QLabel("How would you rate your day overall?")
        rating_label.setStyleSheet("font-size: 14px; font-weight: bold; color: #2c3e50;")
        layout.addWidget(rating_label)
        
        # Star rating widget
        rating_container = QtWidgets.QWidget()
        rating_layout = QtWidgets.QHBoxLayout(rating_container)
        rating_layout.setSpacing(10)
        rating_layout.setContentsMargins(0, 10, 0, 10)
        
        # Center the stars
        rating_layout.addStretch()
        
        self.star_buttons = []
        self.selected_rating = 0
        
        for i in range(1, 6):
            star_btn = QtWidgets.QPushButton("☆")
            star_btn.setFixedSize(50, 50)
            star_btn.setStyleSheet("""
                QPushButton {
                    font-size: 32px;
                    background-color: transparent;
                    border: none;
                    color: #bdc3c7;
                }
                QPushButton:hover {
                    color: #f1c40f;
                    transform: scale(1.1);
                }
            """)
            star_btn.setCursor(QtGui.QCursor(QtCore.Qt.CursorShape.PointingHandCursor))
            star_btn.clicked.connect(lambda checked, rating=i: self._set_rating(rating))
            self.star_buttons.append(star_btn)
            rating_layout.addWidget(star_btn)
        
        rating_layout.addStretch()
        layout.addWidget(rating_container)
        
        # Rating description
        self.rating_description = QtWidgets.QLabel("Click to rate your day")
        self.rating_description.setStyleSheet("font-size: 12px; color: #7f8c8d; font-style: italic;")
        self.rating_description.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.rating_description)
        
        layout.addSpacing(10)
        
        # Optional notes section
        notes_label = QtWidgets.QLabel("Additional notes (optional):")
        notes_label.setStyleSheet("font-size: 13px; color: #2c3e50;")
        layout.addWidget(notes_label)
        
        self.notes_input = QtWidgets.QTextEdit()
        self.notes_input.setPlaceholderText("Any other thoughts about today?")
        self.notes_input.setMaximumHeight(80)
        self.notes_input.setStyleSheet("""
            QTextEdit {
                font-size: 12px;
                padding: 8px;
                border: 2px solid #ddd;
                border-radius: 5px;
                background-color: white;
            }
            QTextEdit:focus {
                border: 2px solid #3498db;
            }
        """)
        layout.addWidget(self.notes_input)
        
        layout.addStretch()
        
        # Buttons
        button_layout = QtWidgets.QHBoxLayout()
        button_layout.addStretch()
        
        self.save_button = QtWidgets.QPushButton("Save & Close Day")
        self.save_button.setStyleSheet("""
            QPushButton {
                font-size: 14px;
                font-weight: bold;
                padding: 12px 24px;
                background-color: #27ae60;
                color: white;
                border: none;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #229954;
            }
            QPushButton:pressed {
                background-color: #1e8449;
            }
        """)
        self.save_button.clicked.connect(self._save_and_close)
        button_layout.addWidget(self.save_button)
        
        layout.addLayout(button_layout)
    
    def _set_rating(self, rating: int) -> None:
        """Set the day rating and update star display."""
        self.selected_rating = rating
        
        # Update stars
        for i, btn in enumerate(self.star_buttons, 1):
            if i <= rating:
                btn.setText("★")
                btn.setStyleSheet("""
                    QPushButton {
                        font-size: 32px;
                        background-color: transparent;
                        border: none;
                        color: #f1c40f;
                    }
                    QPushButton:hover {
                        color: #f39c12;
                    }
                """)
            else:
                btn.setText("☆")
                btn.setStyleSheet("""
                    QPushButton {
                        font-size: 32px;
                        background-color: transparent;
                        border: none;
                        color: #bdc3c7;
                    }
                    QPushButton:hover {
                        color: #f1c40f;
                    }
                """)
        
        # Update description
        descriptions = {
            1: "⭐ Challenging day",
            2: "⭐⭐ Below expectations",
            3: "⭐⭐⭐ Decent day",
            4: "⭐⭐⭐⭐ Great day!",
            5: "⭐⭐⭐⭐⭐ Excellent day!"
        }
        self.rating_description.setText(descriptions.get(rating, ""))
        self.rating_description.setStyleSheet("""
            font-size: 13px; 
            color: #2c3e50; 
            font-weight: bold;
        """)
    
    def _save_and_close(self) -> None:
        """Validate and save the day reflection."""
        # Check if rating is selected
        if self.selected_rating == 0:
            QtWidgets.QMessageBox.warning(
                self,
                "Rating Required",
                "Please rate your day before closing."
            )
            return
        
        # Collect data
        self.result_data = {
            'distraction': self.distraction_input.toPlainText().strip(),
            'rating': self.selected_rating,
            'notes': self.notes_input.toPlainText().strip()
        }
        
        self.accept()
    
    def get_reflection_data(self) -> dict:
        """Get the reflection data after dialog closes."""
        return self.result_data or {}


def show_end_day_confirmation(parent=None) -> bool:
    """
    Show confirmation dialog before ending the day.
    Returns True if user confirms, False if cancelled.
    """
    reply = QtWidgets.QMessageBox.question(
        parent,
        "End Day",
        "Are you sure you want to end your day?\n\n"
        "This will close your current session and show your daily reflection.",
        QtWidgets.QMessageBox.StandardButton.Yes | QtWidgets.QMessageBox.StandardButton.No,
        QtWidgets.QMessageBox.StandardButton.No
    )
    
    return reply == QtWidgets.QMessageBox.StandardButton.Yes


def show_end_day_dialog(parent=None, completed_pomos: int = 0, target_pomos: int = 0) -> dict:
    """
    Show the end-of-day dialog.
    Returns dict with reflection data, or empty dict if cancelled.
    """
    dialog = EndDayDialog(parent, completed_pomos, target_pomos)
    
    if dialog.exec() == QtWidgets.QDialog.DialogCode.Accepted:
        return dialog.get_reflection_data()
    
    return {}
