# SPDX-License-Identifier: MIT
"""Top-level PySide6 window that wires the FSM, DB, strip, and tray."""

from __future__ import annotations

from datetime import date, datetime, timedelta

try:
    from PySide6 import QtCore, QtGui, QtWidgets
except ImportError:  # pragma: no cover - optional dependency
    QtCore = QtGui = QtWidgets = None

from hardmode.core.timer_fsm import State, TimerFSM
from hardmode.data.db import PomodoroRepository
from hardmode.ui.review_dialog import ReviewDialog
from hardmode.ui.daily_intent_dialog import show_daily_intent_dialog
from hardmode.ui.start_next_dialog import ask_start_next
from hardmode.ui.task_list_dialog import show_task_planning_dialog, TaskItem
from hardmode.ui.end_day_dialog import show_end_day_confirmation, show_end_day_dialog
from hardmode.ui.strip_window import StripWindow
from hardmode.ui.tray import Tray


class _TimerHooks:
    """Bridge TimerFSM callbacks into the MainWindow."""

    def __init__(self, window: MainWindow):
        self.window = window

    def on_state(self, state: State) -> None:
        self.window.handle_state_change(state)

    def on_tick(self, seconds_left: int) -> None:
        self.window.handle_tick(seconds_left)

    def on_task_update(self, task: str) -> None:
        self.window.handle_task_update(task)


class MainWindow(QtWidgets.QMainWindow if QtWidgets else object):
    """Main application window."""

    def __init__(self, timer: TimerFSM, repository: PomodoroRepository):
        if QtWidgets is None:
            raise RuntimeError("PySide6 is required for MainWindow.")
        super().__init__()
        self.timer = timer
        self.repository = repository
        self.timer.hooks = _TimerHooks(self)

        self.day_id: int | None = None
        self.current_pomo_id: int | None = None
        self._recent_task_change: bool = False
        self.session_start_time: datetime | None = None
        self.daily_tasks: list[TaskItem] = []  # Track daily tasks

        self.setWindowTitle("Hardmode Pomodoro")
        self.resize(450, 320)

        # Check if we have an ongoing day (same day, not ended yet)
        today = date.today().isoformat()
        existing_day = self.repository.get_day(today)
        
        if existing_day and existing_day.get('day_rating') is None:
            # Continuing today - restore state!
            target = existing_day['target_pomos']
            completed = existing_day['finished_pomos']
            
            print(f"✓ Resuming today's session: {completed}/{target} pomodoros completed")
            
            # Restore daily tasks from database with full planning/execution data
            saved_tasks = self.repository.get_daily_tasks(existing_day['id'])
            for task_data in saved_tasks:
                task = TaskItem(name=task_data['task_name'])
                # Planning fields
                task.planned_pomodoros = task_data.get('planned_pomodoros', 0)
                task.planned_at = task_data.get('planned_at')
                task.plan_priority = task_data.get('plan_priority')
                # Execution fields
                task.pomodoros_spent = task_data['pomodoros_spent']
                task.completed = bool(task_data['completed'])
                # Metadata
                task.added_mid_day = bool(task_data.get('added_mid_day', 0))
                task.reason_added = task_data.get('reason_added')
                self.daily_tasks.append(task)
            
            if self.daily_tasks:
                print(f"✓ Restored {len(self.daily_tasks)} tasks from today")
            
        else:
            # New day or ended day - show daily intent
            target = show_daily_intent_dialog(self, default_target=16)
            if target is None:
                target = 16  # Default if cancelled
            
            # Show task planning dialog for new day
            self.daily_tasks = show_task_planning_dialog(self)
            
            completed = 0
        
        # Display target as read-only label (set once per day)
        self.target_label = QtWidgets.QLabel(f"{target} pomodoros", self)
        self.target_label.setStyleSheet("""
            QLabel {
                font-size: 16px;
                font-weight: bold;
                color: #2c3e50;
                padding: 5px;
            }
        """)
        self.target_label.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        
        # Store target value for internal use
        self.daily_target = target

        # Task list widget (integrated into main window)
        task_list_container = QtWidgets.QWidget(self)
        task_list_container.setStyleSheet("""
            QWidget {
                background-color: #34495e;
                border-radius: 5px;
                padding: 10px;
            }
        """)
        task_list_layout = QtWidgets.QVBoxLayout(task_list_container)
        task_list_layout.setContentsMargins(0, 0, 0, 0)
        
        # Header with add button
        task_header = QtWidgets.QHBoxLayout()
        task_label = QtWidgets.QLabel("Today's Tasks:")
        task_label.setStyleSheet("font-weight: bold; font-size: 13px; color: #ecf0f1;")
        task_header.addWidget(task_label)
        task_header.addStretch()
        
        self.add_task_button = QtWidgets.QPushButton("+ Add Task", self)
        self.add_task_button.setStyleSheet("""
            QPushButton {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 4px 12px;
                border-radius: 3px;
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #2980b9;
            }
        """)
        self.add_task_button.clicked.connect(self._add_task)
        task_header.addWidget(self.add_task_button)
        
        task_list_layout.addLayout(task_header)
        
        # Task list widget
        self.task_list_widget = QtWidgets.QListWidget(self)
        self.task_list_widget.setStyleSheet("""
            QListWidget {
                border: 1px solid #34495e;
                border-radius: 5px;
                background-color: #2c3e50;
                color: #ecf0f1;
            }
            QListWidget::item {
                padding: 8px;
                border-bottom: 1px solid #34495e;
                color: #ecf0f1;
            }
            QListWidget::item:selected {
                background-color: #3498db;
                color: white;
            }
            QListWidget::item:hover {
                background-color: #34495e;
                color: white;
            }
        """)
        self.task_list_widget.setMaximumHeight(200)
        task_list_layout.addWidget(self.task_list_widget)
        
        # Populate task list
        self._refresh_task_list()

        self.start_button = QtWidgets.QPushButton("Start focus", self)
        self.start_button.clicked.connect(self._handle_start_clicked)

        self.abort_button = QtWidgets.QPushButton("Abort session", self)
        self.abort_button.clicked.connect(self._handle_abort_clicked)
        self.abort_button.setEnabled(False)
        
        self.end_day_button = QtWidgets.QPushButton("🌙 End Day", self)
        self.end_day_button.clicked.connect(self._handle_end_day_clicked)
        self.end_day_button.setStyleSheet("""
            QPushButton {
                background-color: #34495e;
                color: white;
                font-weight: bold;
                padding: 8px;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #2c3e50;
            }
        """)

        self.status_label = QtWidgets.QLabel("Welcome to Hardmode Pomodoro", self)
        self.status_label.setWordWrap(True)
        
        # ETA display
        self.eta_label = QtWidgets.QLabel(self)
        self.eta_label.setStyleSheet("""
            font-size: 12px; 
            padding: 10px; 
            background-color: #f8f8f8; 
            border-radius: 5px;
            color: #333;
        """)
        self.eta_label.setWordWrap(True)
        self._update_eta_display()
        
        # Connection status indicator
        self.connection_label = QtWidgets.QLabel(self)
        self.connection_label.setStyleSheet("font-size: 10px; color: gray;")
        self._update_connection_status()

        form_layout = QtWidgets.QFormLayout()
        form_layout.addRow("Daily goal", self.target_label)

        button_layout = QtWidgets.QHBoxLayout()
        button_layout.addWidget(self.start_button)
        button_layout.addWidget(self.abort_button)
        button_layout.addWidget(self.end_day_button)

        root_layout = QtWidgets.QVBoxLayout()
        root_layout.addLayout(form_layout)
        root_layout.addSpacing(10)
        root_layout.addWidget(task_list_container)  # Add task list
        root_layout.addSpacing(10)
        root_layout.addLayout(button_layout)
        root_layout.addSpacing(10)
        root_layout.addWidget(self.eta_label)  # Add ETA display
        root_layout.addStretch(1)
        root_layout.addWidget(self.status_label)
        root_layout.addWidget(self.connection_label)  # Add connection status

        central = QtWidgets.QWidget(self)
        central.setLayout(root_layout)
        self.setCentralWidget(central)

        self.strip = StripWindow()
        self.strip.show()
        self.strip.snap_to_taskbar_edge()

        self.tray = Tray(QtGui.QIcon())
        self.tray.action_open.triggered.connect(self._restore_from_tray)
        self.tray.action_quit.triggered.connect(self._handle_quit_requested)

        self.tick_timer = QtCore.QTimer(self)
        self.tick_timer.setInterval(1000)
        self.tick_timer.timeout.connect(self._drive_timer)
        self.tick_timer.start()

        self.timer.start_day(target=target)
        
        # Ensure day record exists and restore state if resuming
        self.day_id = self.repository.ensure_day(today, target)
        
        if existing_day:
            # Resuming - restore completed count
            self.timer.done_today = completed
            if existing_day.get('start_time'):
                # Parse start time to calculate session duration
                try:
                    self.session_start_time = datetime.fromisoformat(existing_day['start_time'])
                except (ValueError, TypeError):
                    self.session_start_time = datetime.now()
        
        self._update_status_views()
        self._update_eta_display()

    # ----- Timer hooks -----

    def handle_state_change(self, state: State) -> None:
        self._update_status_views()
        if state is State.POMO:
            self._on_focus_started()
        elif state is State.REVIEW:
            self._prompt_review()
        elif state in {State.SHORT_BREAK, State.LONG_BREAK}:
            self._on_break_started()
        else:
            self._on_idle()

    def handle_tick(self, seconds_left: int) -> None:
        self._update_status_views()

    def handle_task_update(self, task: str) -> None:
        self._recent_task_change = True
        # Task name is now shown in the list, not a separate input
        self._update_status_views()
        self._recent_task_change = False

    # ----- UI helpers -----
    
    def _refresh_task_list(self) -> None:
        """Refresh the task list display with plan vs. actual tracking."""
        self.task_list_widget.clear()
        
        if not self.daily_tasks:
            item = QtWidgets.QListWidgetItem("No tasks yet. Click '+ Add Task' to start.")
            item.setFlags(item.flags() & ~QtCore.Qt.ItemFlag.ItemIsSelectable)
            item.setForeground(QtGui.QColor("#999"))
            self.task_list_widget.addItem(item)
            return
        
        for task in self.daily_tasks:
            # Build display text with plan vs. actual
            status_icon = "✅" if task.completed else ""
            
            # Show planned vs actual pomodoros
            if task.planned_pomodoros > 0:
                # Show plan vs. actual: "Task [2/3 🍅]" means 2 spent out of 3 planned
                pomo_text = f"[{task.pomodoros_spent}/{task.planned_pomodoros} 🍅]"
            else:
                # No plan, just show actual
                pomo_text = f"[{task.pomodoros_spent} 🍅]" if task.pomodoros_spent > 0 else ""
            
            # Add mid-day indicator
            mid_day_icon = "⚡" if task.added_mid_day else ""
            
            text = f"{status_icon} {task.name} {pomo_text} {mid_day_icon}".strip()
            
            item = QtWidgets.QListWidgetItem(text)
            item.setData(QtCore.Qt.ItemDataRole.UserRole, task.name)  # Store task name
            
            if task.completed:
                item.setForeground(QtGui.QColor("#95a5a6"))
                font = item.font()
                font.setStrikeOut(True)
                item.setFont(font)
            elif task.added_mid_day:
                # Highlight mid-day additions in yellow
                item.setForeground(QtGui.QColor("#f39c12"))
            
            self.task_list_widget.addItem(item)
    
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
    
    def _add_task(self) -> None:
        """Add a new task mid-day."""
        task_name, ok = QtWidgets.QInputDialog.getText(
            self,
            "Add Task",
            "Task name:",
            QtWidgets.QLineEdit.EchoMode.Normal,
            ""
        )
        
        if not ok or not task_name.strip():
            return
            
        # Check if task already exists
        for task in self.daily_tasks:
            if task.name.lower() == task_name.strip().lower():
                QtWidgets.QMessageBox.warning(
                    self,
                    "Duplicate Task",
                    f"Task '{task_name}' already exists!"
                )
                return
        
        # Ask why adding mid-day with structured categories
        reason = self._ask_mid_day_reason(task_name.strip())
        if reason is None:
            return  # User cancelled
        
        # Add new task marked as mid-day addition
        from datetime import datetime
        new_task = TaskItem(name=task_name.strip())
        new_task.added_mid_day = True
        new_task.reason_added = reason
        
        # Optionally ask for planned pomodoros
        planned, planned_ok = QtWidgets.QInputDialog.getInt(
            self,
            "Plan Effort",
            f"How many pomodoros do you plan to spend on:\n'{task_name.strip()}'?",
            2,    # value (default)
            1,    # min
            16    # max
        )
        if planned_ok:
            new_task.planned_pomodoros = planned
            new_task.planned_at = datetime.now().isoformat()
        
        self.daily_tasks.append(new_task)
        
        # Save to database
        if self.day_id is not None:
            self.repository.save_daily_tasks(self.day_id, self.daily_tasks)
            print(f"✓ Added mid-day task: {task_name} (reason: {new_task.reason_added})")
        
        self._refresh_task_list()

    def _drive_timer(self) -> None:
        if self.timer.state is State.POMO:
            self.timer.tick()
        elif self.timer.state in {State.SHORT_BREAK, State.LONG_BREAK}:
            self.timer.break_tick()
        self._update_status_views()

    def _handle_start_clicked(self) -> None:
        # Get selected task from list
        current_item = self.task_list_widget.currentItem()
        
        if not current_item or not self.daily_tasks:
            QtWidgets.QMessageBox.warning(
                self,
                "No Task Selected",
                "Please select a task from the list or add a new task first."
            )
            return
        
        # Get task name from item data
        selected_task = current_item.data(QtCore.Qt.ItemDataRole.UserRole)
        
        if not selected_task:
            # Handle empty state item
            QtWidgets.QMessageBox.warning(
                self,
                "No Task Selected",
                "Please add a task first using '+ Add Task' button."
            )
            return
        
        # Find and update task tracking
        for task in self.daily_tasks:
            if task.name == selected_task:
                task.pomodoros_spent += 1
                # Save updated task count to database
                if self.day_id is not None:
                    self.repository.update_task_pomodoros(self.day_id, task.name, task.pomodoros_spent)
                break
        
        # Refresh list to show updated pomodoro count
        self._refresh_task_list()
        
        try:
            self.timer.target = self.daily_target
            self.timer.start_pomo(selected_task)
        except ValueError as exc:
            QtWidgets.QMessageBox.warning(self, "Invalid task", str(exc))
        except RuntimeError as exc:
            QtWidgets.QMessageBox.warning(self, "Cannot start", str(exc))

    def _handle_abort_clicked(self) -> None:
        if self.timer.state is not State.POMO:
            return
        if QtWidgets.QMessageBox.question(
            self,
            "Abort session",
            "Abort the current pomodoro? It will be logged as aborted.",
        ) != QtWidgets.QMessageBox.StandardButton.Yes:
            return
        self._log_abort(reason="user_abort")
        self.timer.state = State.PLANNING
        self.timer.seconds_left = 0
        self.timer.current_task = ""
        self.timer.context_switch = False
        self.handle_state_change(self.timer.state)
    
    def _handle_end_day_clicked(self) -> None:
        """Handle end of day button click."""
        # Check if there's an active session
        if self.timer.state is State.POMO:
            QtWidgets.QMessageBox.warning(
                self,
                "Session Active",
                "Please finish or abort your current pomodoro before ending the day."
            )
            return
        
        # Confirm end day
        if not show_end_day_confirmation(self):
            return
        
        # Show end of day dialog
        completed = self.timer.done_today
        target = self.timer.target or self.daily_target
        
        reflection_data = show_end_day_dialog(self, completed, target)
        
        if reflection_data:
            # Save reflection to database
            if self.day_id is not None:
                self.repository.end_day(
                    self.day_id,
                    rating=reflection_data['rating'],
                    distraction=reflection_data['distraction'],
                    notes=reflection_data['notes']
                )
            
            # Show confirmation
            QtWidgets.QMessageBox.information(
                self,
                "Day Complete",
                f"Your day has been saved!\n\n"
                f"Rating: {'⭐' * reflection_data['rating']}\n"
                f"Completed: {completed}/{target} pomodoros\n\n"
                f"See you tomorrow! 🌟"
            )
            
            # Reset the app for next day
            self.timer.done_today = 0
            self.timer.target = target
            self.day_id = None
            self.session_start_time = None
            self.daily_tasks = []
            self.task_input.clear()
            self._update_eta_display()
            self._update_status_views()

    def _handle_quit_requested(self) -> None:
        if self.timer.state is State.POMO:
            QtWidgets.QMessageBox.information(
                self,
                "Pomodoro active",
                "Finish or abort the current session before quitting.",
            )
            return
        QtWidgets.QApplication.quit()

    def _restore_from_tray(self) -> None:
        self.showNormal()
        self.activateWindow()

    def _maybe_handle_task_change(self) -> None:
        if self._recent_task_change:
            return
        if self.timer.state is not State.POMO:
            return
        new_task = self.task_input.text()
        if new_task.strip() == self.timer.current_task:
            return
        reply = QtWidgets.QMessageBox.question(
            self,
            "Context switch",
            "Change task mid-session? The pomodoro will be flagged.",
        )
        if reply != QtWidgets.QMessageBox.StandardButton.Yes:
            self._recent_task_change = True
            self.task_input.setText(self.timer.current_task)
            self._recent_task_change = False
            return
        try:
            self.timer.change_task(new_task)
        except ValueError as exc:
            QtWidgets.QMessageBox.warning(self, "Task required", str(exc))
            return
        if self.current_pomo_id is not None:
            self.repository.flag_context_switch(self.current_pomo_id)
            self.repository.log_event(
                "info",
                "context_switch",
                {
                    "pomo_id": self.current_pomo_id,
                    "task": new_task.strip(),
                },
            )

    # ----- State reactions -----

    def _on_focus_started(self) -> None:
        self.start_button.setEnabled(False)
        self.abort_button.setEnabled(True)
        self.tray.set_quit_enabled(False)
        self._ensure_day_record()
        
        # Track session start time for first pomodoro
        if self.timer.done_today == 0 and self.session_start_time is None:
            self.session_start_time = datetime.now()
        
        duration = self.timer.scheme.work_min * 60
        self.current_pomo_id = self.repository.start_pomo(
            day_id=self.day_id or 0,
            task=self.timer.current_task,
            duration_sec=duration,
            context_switch=self.timer.context_switch,
        )

    def _on_break_started(self) -> None:
        self.start_button.setEnabled(False)
        self.abort_button.setEnabled(False)
        self.tray.set_quit_enabled(True)
        self.current_pomo_id = None

    def _on_idle(self) -> None:
        self.start_button.setEnabled(True)
        self.abort_button.setEnabled(False)
        self.tray.set_quit_enabled(True)
        self.current_pomo_id = None

    def _prompt_review(self) -> None:
        self.start_button.setEnabled(False)
        self.abort_button.setEnabled(False)
        if self.current_pomo_id is None:
            return
        dialog = ReviewDialog(self)
        if dialog.exec() == QtWidgets.QDialog.DialogCode.Accepted:
            focus, reason, note = dialog.get_values()
        else:
            focus, reason, note = (None, None, "")
        elapsed = self.timer.scheme.work_min * 60 - max(self.timer.seconds_left, 0)
        elapsed = max(elapsed, 0)
        context_switch = self.timer.context_switch
        self.repository.complete_pomo(
            self.current_pomo_id,
            focus_score=focus,
            reason=reason,
            note=note,
            actual_duration=elapsed,
            context_switch=context_switch,
        )
        self.repository.log_event(
            "info",
            "pomo_completed",
            {
                "pomo_id": self.current_pomo_id,
                "task": self.timer.current_task,
                "context_switch": context_switch,
            },
        )
        self.repository.increment_finished(self.day_id or 0)
        self.current_pomo_id = None
        self.timer.context_switch = False
        try:
            self.timer.save_review(
                focus=focus or 3, reason=reason or "", note=note or ""
            )
        except RuntimeError as exc:
            QtWidgets.QMessageBox.warning(self, "Unable to save review", str(exc))
        
        # Check if target is reached
        self._update_eta_display()  # Update ETA first
        
        if self.timer.done_today >= self.timer.target:
            # Target reached! Show end-of-day dialog automatically
            QtWidgets.QMessageBox.information(
                self,
                "🎉 Goal Achieved!",
                f"Congratulations! You've completed all {self.timer.target} pomodoros!\n\n"
                f"Let's reflect on your day."
            )
            self._handle_end_day_clicked()
        elif ask_start_next(self, self.timer.done_today, self.timer.target):
            # Ask if user wants to start next pomodoro immediately
            self._handle_start_clicked()

    def _ensure_day_record(self) -> None:
        today = date.today().isoformat()
        self.day_id = self.repository.ensure_day(today, self.timer.target)

    def _log_abort(self, reason: str) -> None:
        if self.current_pomo_id is None:
            return
        self.repository.abort_pomo(self.current_pomo_id, reason=reason)
        self.repository.log_event(
            "warn",
            "pomo_aborted",
            {
                "pomo_id": self.current_pomo_id,
                "reason": reason,
                "remaining_seconds": self.timer.seconds_left,
            },
        )
        self.current_pomo_id = None

    def _update_status_views(self) -> None:
        state = self.timer.state.name.replace("_", " ").title()
        seconds = max(self.timer.seconds_left, 0)
        minutes, remainder = divmod(seconds, 60)
        quota = f"{self.timer.done_today}/{self.timer.target or self.daily_target}"
        text = f"⏱ {minutes:02d}:{remainder:02d} | {state} | {quota}"
        if self.timer.current_task:
            text += f" | {self.timer.current_task}"
        self.status_label.setText(text)
        self.strip.update_text(text)
        self.tray.set_tooltip(text)

    # ----- Qt events -----

    def closeEvent(self, event: QtGui.QCloseEvent) -> None:  # type: ignore[override]
        if self.timer.state is State.POMO:
            QtWidgets.QMessageBox.information(
                self,
                "Pomodoro active",
                "You cannot close the window during an active pomodoro.",
            )
            event.ignore()
            return
        if self.current_pomo_id is not None:
            self._log_abort(reason="app_quit")
        self.strip.close()
        self.tray.hide()
        super().closeEvent(event)
    
    def _update_connection_status(self) -> None:
        """Update the connection status indicator."""
        try:
            if hasattr(self.repository, 'is_online') and self.repository.is_online():
                self.connection_label.setText("☁️ Connected to API - Data syncing")
                self.connection_label.setStyleSheet("font-size: 10px; color: green;")
            else:
                self.connection_label.setText("📴 Offline - Data stored locally")
                self.connection_label.setStyleSheet("font-size: 10px; color: orange;")
        except:
            self.connection_label.setText("📴 Local mode")
            self.connection_label.setStyleSheet("font-size: 10px; color: gray;")
    
    def _update_eta_display(self) -> None:
        """Update the ETA display based on current progress."""
        target = self.timer.target or self.daily_target
        completed = self.timer.done_today
        remaining = target - completed
        
        if remaining <= 0:
            self.eta_label.setText("🎉 Daily target complete! Amazing work!")
            self.eta_label.setStyleSheet("""
                font-size: 12px; 
                padding: 10px; 
                background-color: #e8f5e9; 
                border-radius: 5px;
                color: #2e7d32;
                font-weight: bold;
            """)
            return
        
        # Calculate time remaining
        pomo_duration = 25  # minutes
        remaining_focus_time = remaining * pomo_duration
        
        # Add one lunch break if we have significant work left
        estimated_breaks = 30 if remaining >= 4 else 0
        total_remaining = remaining_focus_time + estimated_breaks
        
        # Calculate ETA
        if self.session_start_time is None:
            # Not started yet, assume starting now
            finish_time = datetime.now() + timedelta(minutes=total_remaining)
        else:
            # Started, calculate from session start
            elapsed_minutes = (datetime.now() - self.session_start_time).total_seconds() / 60
            completed_focus = completed * pomo_duration
            total_needed = target * pomo_duration + estimated_breaks
            remaining_from_now = total_needed - elapsed_minutes
            finish_time = datetime.now() + timedelta(minutes=remaining_from_now)
        
        finish_str = finish_time.strftime("%I:%M %p").lstrip('0')
        
        # Calculate total focus time
        total_focus_hours = (target * pomo_duration) // 60
        total_focus_mins = (target * pomo_duration) % 60
        
        # Progress indicator
        progress_pct = (completed / target * 100) if target > 0 else 0
        progress_bar = "▓" * int(progress_pct / 10) + "░" * (10 - int(progress_pct / 10))
        
        self.eta_label.setText(
            f"🎯 Progress: {completed}/{target} ({progress_pct:.0f}%) {progress_bar}\n"
            f"⏱️  ETA: Finish around {finish_str}\n"
            f"📊 Total focus today: {total_focus_hours}h {total_focus_mins}m"
        )
        self.eta_label.setStyleSheet("""
            QLabel {
                font-size: 12px; 
                padding: 10px; 
                background-color: #2b2b2b; 
                border-radius: 5px;
                color: #ffffff;
                border: 1px solid #444;
            }
        """)
