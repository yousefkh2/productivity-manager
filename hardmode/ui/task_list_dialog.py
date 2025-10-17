# SPDX-License-Identifier: MIT
"""Task List Management - Plan your day and choose what to work on."""

from __future__ import annotations

from typing import Optional, List, Dict
from datetime import datetime

try:
    from PySide6 import QtCore, QtWidgets
except ImportError:  # pragma: no cover
    QtCore = QtWidgets = None


class TaskItem:
    """Represents a task with planning and execution tracking."""
    
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        
        # Planning fields (set during morning ritual)
        self.planned_pomodoros = 0
        self.plan_priority = None
        self.planned_at = None
        
        # Execution fields (updated during work)
        self.pomodoros_spent = 0
        self.completed = False
        
        # Metadata
        self.added_mid_day = False
        self.reason_added = None


class TaskListDialog(QtWidgets.QDialog if QtWidgets else object):
    """Dialog to manage daily tasks and select what to work on."""

    def __init__(self, parent=None, tasks: List[TaskItem] = None, mode: str = "select"):
        """
        Initialize task list dialog.
        
        Args:
            parent: Parent widget
            tasks: Existing tasks list
            mode: "plan" (add initial tasks) or "select" (choose task to work on)
        """
        if QtWidgets is None:
            raise RuntimeError("PySide6 is required.")
        super().__init__(parent)
        
        self.mode = mode
        self.tasks = tasks or []
        self.selected_task: Optional[str] = None
        
        if mode == "plan":
            self.setWindowTitle("Plan Your Day - What will you work on?")
            self.resize(600, 500)
        else:
            self.setWindowTitle("Choose Your Next Task")
            self.resize(550, 450)
        
        self.setModal(True)
        self._setup_ui()
        self._load_tasks()
    
    def _setup_ui(self) -> None:
        """Setup the user interface."""
        layout = QtWidgets.QVBoxLayout()
        
        # Title
        if self.mode == "plan":
            title = QtWidgets.QLabel("📝 What tasks will you work on today?")
            subtitle = QtWidgets.QLabel("Add all your tasks now - you can add more later")
            subtitle.setStyleSheet("color: #666; font-size: 11px;")
        else:
            title = QtWidgets.QLabel("🎯 What do you want to work on now?")
            subtitle = QtWidgets.QLabel("Select a task to start your next pomodoro")
            subtitle.setStyleSheet("color: #666; font-size: 11px;")
        
        title.setStyleSheet("font-size: 16px; font-weight: bold; margin-bottom: 5px;")
        
        layout.addWidget(title)
        layout.addWidget(subtitle)
        layout.addSpacing(10)
        
        # Task list
        self.task_list = QtWidgets.QListWidget()
        self.task_list.setAlternatingRowColors(True)
        if self.mode == "select":
            self.task_list.itemDoubleClicked.connect(self._on_task_double_clicked)
        layout.addWidget(self.task_list)
        
        # Input section for adding new tasks
        input_group = QtWidgets.QGroupBox("Add New Task")
        input_layout = QtWidgets.QVBoxLayout()
        
        # Task name
        name_layout = QtWidgets.QHBoxLayout()
        name_layout.addWidget(QtWidgets.QLabel("Task:"))
        self.task_input = QtWidgets.QLineEdit()
        self.task_input.setPlaceholderText("e.g., Write documentation, Review pull requests...")
        self.task_input.returnPressed.connect(self._add_task)
        name_layout.addWidget(self.task_input)
        input_layout.addLayout(name_layout)
        
        # Description (optional)
        desc_layout = QtWidgets.QHBoxLayout()
        desc_layout.addWidget(QtWidgets.QLabel("Notes:"))
        self.desc_input = QtWidgets.QLineEdit()
        self.desc_input.setPlaceholderText("Optional: Add context or details...")
        self.desc_input.returnPressed.connect(self._add_task)
        desc_layout.addWidget(self.desc_input)
        input_layout.addLayout(desc_layout)
        
        # Add button
        add_button = QtWidgets.QPushButton("➕ Add Task")
        add_button.clicked.connect(self._add_task)
        add_button.setStyleSheet("""
            QPushButton {
                padding: 8px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        input_layout.addWidget(add_button)
        
        input_group.setLayout(input_layout)
        layout.addWidget(input_group)
        
        # Action buttons
        button_layout = QtWidgets.QHBoxLayout()
        
        if self.mode == "plan":
            # Planning mode - just done
            done_button = QtWidgets.QPushButton("Done Planning")
            done_button.clicked.connect(self.accept)
            done_button.setDefault(True)
            button_layout.addStretch()
            button_layout.addWidget(done_button)
        else:
            # Selection mode - select or add more
            self.select_button = QtWidgets.QPushButton("🚀 Start Working on Selected Task")
            self.select_button.clicked.connect(self._select_task)
            self.select_button.setEnabled(False)
            self.select_button.setDefault(True)
            self.select_button.setStyleSheet("""
                QPushButton {
                    padding: 12px;
                    background-color: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-weight: bold;
                }
                QPushButton:hover:enabled {
                    background-color: #1976D2;
                }
                QPushButton:disabled {
                    background-color: #ccc;
                }
            """)
            
            cancel_button = QtWidgets.QPushButton("Cancel")
            cancel_button.clicked.connect(self.reject)
            
            button_layout.addWidget(self.select_button)
            button_layout.addWidget(cancel_button)
            
            # Enable select button when item is selected
            self.task_list.itemSelectionChanged.connect(self._on_selection_changed)
        
        layout.addLayout(button_layout)
        self.setLayout(layout)
    
    def _load_tasks(self) -> None:
        """Load existing tasks into the list."""
        self.task_list.clear()
        for task in self.tasks:
            item_text = f"📌 {task.name}"
            if task.pomodoros_spent > 0:
                item_text += f" ({task.pomodoros_spent} 🍅)"
            if task.completed:
                item_text = f"✅ {task.name} - COMPLETED"
            
            item = QtWidgets.QListWidgetItem(item_text)
            item.setData(QtCore.Qt.UserRole, task)
            
            # Visual styling
            if task.completed:
                font = item.font()
                font.setStrikeOut(True)
                item.setFont(font)
                item.setForeground(QtCore.Qt.gray)
            
            self.task_list.addItem(item)
    
    def _add_task(self) -> None:
        """Add a new task to the list."""
        name = self.task_input.text().strip()
        if not name:
            return
        
        description = self.desc_input.text().strip()
        task = TaskItem(name, description)
        
        # In planning mode, ask for planned pomodoros
        if self.mode == "plan":
            planned, ok = QtWidgets.QInputDialog.getInt(
                self,
                "Plan Task Effort",
                f"How many pomodoros do you plan to spend on:\n'{name}'?",
                2,   # value (default 2 pomodoros)
                1,   # min
                16   # max
            )
            if ok:
                task.planned_pomodoros = planned
                task.planned_at = datetime.now().isoformat()
                task.plan_priority = len(self.tasks) + 1  # Sequential priority
                task.added_mid_day = False
            else:
                return  # User cancelled, don't add task
        else:
            # Adding mid-day (not during planning) - use structured reason dialog
            task.added_mid_day = True
            reason = self._ask_mid_day_reason(name)
            if reason is None:
                return  # User cancelled
            task.reason_added = reason
        
        self.tasks.append(task)
        
        # Add to list with planning info
        if self.mode == "plan":
            item_text = f"📌 {name} ({task.planned_pomodoros} 🍅 planned)"
        else:
            item_text = f"📌 {name}"
        
        item = QtWidgets.QListWidgetItem(item_text)
        item.setData(QtCore.Qt.UserRole, task)
        self.task_list.addItem(item)
        
        # Clear inputs
        self.task_input.clear()
        self.desc_input.clear()
        self.task_input.setFocus()
    
    def _ask_mid_day_reason(self, task_name: str) -> str:
        """Ask why the user is adding a task mid-day with structured categories."""
        dialog = QtWidgets.QDialog(self)
        dialog.setWindowTitle("Mid-Day Task Addition")
        dialog.setModal(True)
        dialog.resize(500, 300)
        
        # Set dark theme styling
        dialog.setStyleSheet("""
            QDialog {
                background-color: #2c3e50;
            }
            QLabel {
                color: #ecf0f1;
                font-size: 13px;
            }
            QComboBox {
                background-color: #34495e;
                color: #ecf0f1;
                border: 1px solid #7f8c8d;
                border-radius: 4px;
                padding: 5px;
                font-size: 12px;
            }
            QComboBox::drop-down {
                border: none;
            }
            QComboBox::down-arrow {
                image: none;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid #ecf0f1;
                margin-right: 5px;
            }
            QComboBox QAbstractItemView {
                background-color: #34495e;
                color: #ecf0f1;
                selection-background-color: #3498db;
            }
            QTextEdit {
                background-color: #34495e;
                color: #ecf0f1;
                border: 1px solid #7f8c8d;
                border-radius: 4px;
                padding: 5px;
                font-size: 12px;
            }
            QPushButton {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #2980b9;
            }
            QPushButton#cancelButton {
                background-color: #7f8c8d;
            }
            QPushButton#cancelButton:hover {
                background-color: #95a5a6;
            }
        """)
        
        layout = QtWidgets.QVBoxLayout(dialog)
        
        # Title
        title = QtWidgets.QLabel(f"Why are you adding '{task_name}' now?")
        title.setStyleSheet("font-size: 14px; font-weight: bold; margin-bottom: 10px;")
        layout.addWidget(title)
        
        # Category dropdown
        category_label = QtWidgets.QLabel("Category:")
        layout.addWidget(category_label)
        
        category_combo = QtWidgets.QComboBox()
        categories = [
            "🚨 Urgent Bug / Critical Issue",
            "📧 New Request / Client Need",
            "🤔 Forgot to Plan This",
            "🔥 Unexpected Blocker / Dependency",
            "💡 Inspiration / Creative Idea",
            "📞 Meeting / Interruption Outcome",
            "🔄 Context Switch Required",
            "📝 Administrative / Overhead",
            "🎯 Opportunistic / Quick Win",
            "❓ Other"
        ]
        category_combo.addItems(categories)
        layout.addWidget(category_combo)
        
        layout.addSpacing(10)
        
        # Optional notes
        notes_label = QtWidgets.QLabel("Additional notes (optional):")
        layout.addWidget(notes_label)
        
        notes_text = QtWidgets.QTextEdit()
        notes_text.setPlaceholderText("Add any additional context or details...")
        notes_text.setMaximumHeight(80)
        layout.addWidget(notes_text)
        
        layout.addStretch()
        
        # Buttons
        button_layout = QtWidgets.QHBoxLayout()
        
        cancel_button = QtWidgets.QPushButton("Cancel")
        cancel_button.setObjectName("cancelButton")
        cancel_button.clicked.connect(dialog.reject)
        button_layout.addWidget(cancel_button)
        
        button_layout.addStretch()
        
        ok_button = QtWidgets.QPushButton("Add Task")
        ok_button.setDefault(True)
        ok_button.clicked.connect(dialog.accept)
        button_layout.addWidget(ok_button)
        
        layout.addLayout(button_layout)
        
        if dialog.exec() == QtWidgets.QDialog.Accepted:
            category = category_combo.currentText()
            notes = notes_text.toPlainText().strip()
            
            # Format: "Category | Notes" or just "Category"
            if notes:
                return f"{category} | {notes}"
            else:
                return category
        
        return None  # User cancelled
    
    def _on_selection_changed(self) -> None:
        """Handle task selection change."""
        self.select_button.setEnabled(len(self.task_list.selectedItems()) > 0)
    
    def _on_task_double_clicked(self, item: QtWidgets.QListWidgetItem) -> None:
        """Handle double-click on task."""
        task = item.data(QtCore.Qt.UserRole)
        if not task.completed:
            self.selected_task = task.name
            self.accept()
    
    def _select_task(self) -> None:
        """Select the current task and close dialog."""
        items = self.task_list.selectedItems()
        if items:
            task = items[0].data(QtCore.Qt.UserRole)
            if task.completed:
                QtWidgets.QMessageBox.information(
                    self,
                    "Task Completed",
                    "This task is already marked as completed. Choose another task or add a new one."
                )
                return
            self.selected_task = task.name
            self.accept()
    
    def get_tasks(self) -> List[TaskItem]:
        """Get the list of tasks."""
        return self.tasks
    
    def get_selected_task(self) -> Optional[str]:
        """Get the selected task name."""
        return self.selected_task


def show_task_planning_dialog(parent=None, existing_tasks: List[TaskItem] = None) -> List[TaskItem]:
    """
    Show dialog to plan daily tasks.
    
    Args:
        parent: Parent widget
        existing_tasks: Existing tasks to load
        
    Returns:
        List of tasks
    """
    dialog = TaskListDialog(parent, existing_tasks or [], mode="plan")
    dialog.exec()
    return dialog.get_tasks()


def show_task_selection_dialog(parent=None, tasks: List[TaskItem] = None) -> Optional[str]:
    """
    Show dialog to select which task to work on.
    
    Args:
        parent: Parent widget
        tasks: Available tasks
        
    Returns:
        Selected task name, or None if cancelled
    """
    if not tasks:
        tasks = []
    
    dialog = TaskListDialog(parent, tasks, mode="select")
    if dialog.exec() == QtWidgets.QDialog.Accepted:
        return dialog.get_selected_task()
    return None
