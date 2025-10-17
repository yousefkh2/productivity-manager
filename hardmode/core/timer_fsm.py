# SPDX-License-Identifier: MIT
"""Finite state machine controlling the Pomodoro timer flow."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional, Protocol


class State(Enum):
    """High-level phases of a work day."""

    IDLE = auto()
    PLANNING = auto()
    POMO = auto()
    REVIEW = auto()
    SHORT_BREAK = auto()
    LONG_BREAK = auto()
    DAY_CLOSED = auto()


@dataclass(slots=True)
class Scheme:
    """Configuration for work and break durations."""

    work_min: int = 25
    short_min: int = 5
    long_min: int = 15
    cadence: int = 4


class TimerHooks(Protocol):
    """Callbacks invoked by the FSM when state changes occur."""

    def on_state(self, state: State) -> None:
        ...

    def on_tick(self, seconds_left: int) -> None:
        ...

    def on_task_update(self, task: str) -> None:
        ...


@dataclass
class NullHooks:
    """No-op implementation to keep hooks optional."""

    def on_state(self, state: State) -> None:
        pass

    def on_tick(self, seconds_left: int) -> None:
        pass

    def on_task_update(self, task: str) -> None:
        pass


@dataclass
class TimerFSM:
    """Manage transitions between Pomodoro states and break cadence."""

    scheme: Scheme = field(default_factory=Scheme)
    hooks: TimerHooks = field(default_factory=NullHooks)
    state: State = State.IDLE
    current_task: str = ""
    started_at: Optional[float] = None
    seconds_left: int = 0
    done_today: int = 0
    target: int = 0
    context_switch: bool = False

    def start_day(self, target: int, window: Optional[object] = None) -> None:
        """Enter the planning phase for the day."""
        self.target = target
        self.state = State.PLANNING
        self.hooks.on_state(self.state)

    def start_pomo(self, task: str) -> None:
        """Begin a focus session for the given task."""
        if self.state not in {State.PLANNING, State.SHORT_BREAK, State.LONG_BREAK}:
            raise RuntimeError("Cannot start a pomodoro from the current state.")
        cleaned = task.strip()
        if not cleaned:
            raise ValueError("Task is required")
        self.current_task = cleaned
        self.state = State.POMO
        self.started_at = time.time()
        self.seconds_left = self.scheme.work_min * 60
        self.context_switch = False
        self.hooks.on_state(self.state)
        self.hooks.on_task_update(self.current_task)

    def tick(self) -> None:
        """Advance the running pomodoro clock by one second."""
        if self.state is not State.POMO:
            return
        self.seconds_left -= 1
        self.hooks.on_tick(self.seconds_left)
        if self.seconds_left <= 0:
            self.state = State.REVIEW
            self.hooks.on_state(self.state)

    def save_review(self, focus: int, reason: str, note: str) -> None:
        """Persist the review details and transition to the next break."""
        if self.state is not State.REVIEW:
            raise RuntimeError("Review can only be saved after a pomodoro.")
        self.done_today += 1
        if self.done_today % self.scheme.cadence == 0:
            self.state = State.LONG_BREAK
            self.seconds_left = self.scheme.long_min * 60
        else:
            self.state = State.SHORT_BREAK
            self.seconds_left = self.scheme.short_min * 60
        self.hooks.on_state(self.state)

    def break_tick(self) -> None:
        """Advance the break timer and restart the current task when done."""
        if self.state not in {State.SHORT_BREAK, State.LONG_BREAK}:
            return
        self.seconds_left -= 1
        self.hooks.on_tick(self.seconds_left)
        if self.seconds_left <= 0:
            self.start_pomo(self.current_task)

    def change_task(self, task: str) -> None:
        """Change the active task mid-pomodoro, flagging a context switch."""
        if self.state is not State.POMO:
            raise RuntimeError("Can only change task during an active pomodoro.")
        cleaned = task.strip()
        if not cleaned:
            raise ValueError("Task is required")
        if cleaned == self.current_task:
            return
        self.current_task = cleaned
        self.context_switch = True
        self.hooks.on_task_update(self.current_task)
