# SPDX-License-Identifier: MIT
"""Tests for the timer state machine."""

from __future__ import annotations

from hardmode.core.timer_fsm import (
    NullHooks,
    Scheme,
    State,
    TimerFSM,
)


class RecorderHooks(NullHooks):
    def __init__(self) -> None:
        self.states: list[State] = []
        self.ticks: list[int] = []
        self.tasks: list[str] = []

    def on_state(self, state: State) -> None:
        self.states.append(state)

    def on_tick(self, seconds_left: int) -> None:
        self.ticks.append(seconds_left)

    def on_task_update(self, task: str) -> None:
        self.tasks.append(task)


def test_start_pomo_transitions_to_focus_state() -> None:
    hooks = RecorderHooks()
    fsm = TimerFSM(scheme=Scheme(), hooks=hooks)
    fsm.start_day(target=5)
    fsm.start_pomo("Write spec")
    assert fsm.state is State.POMO
    assert fsm.seconds_left == fsm.scheme.work_min * 60
    assert hooks.states[-1] is State.POMO
    assert hooks.tasks[-1] == "Write spec"
    assert fsm.context_switch is False


def test_tick_moves_to_review() -> None:
    hooks = RecorderHooks()
    fsm = TimerFSM(scheme=Scheme(work_min=1), hooks=hooks)
    fsm.start_day(target=2)
    fsm.start_pomo("Task")
    fsm.seconds_left = 1
    fsm.tick()
    assert fsm.state is State.REVIEW
    assert hooks.states[-1] is State.REVIEW


def test_review_selects_long_break_on_cadence() -> None:
    hooks = RecorderHooks()
    fsm = TimerFSM(scheme=Scheme(cadence=1, long_min=10), hooks=hooks)
    fsm.state = State.REVIEW
    fsm.save_review(focus=5, reason="", note="")
    assert fsm.state is State.LONG_BREAK
    assert fsm.seconds_left == fsm.scheme.long_min * 60


def test_break_tick_restarts_task() -> None:
    hooks = RecorderHooks()
    fsm = TimerFSM(scheme=Scheme(short_min=1), hooks=hooks)
    fsm.current_task = "Focus"
    fsm.state = State.SHORT_BREAK
    fsm.seconds_left = 1
    fsm.break_tick()
    assert fsm.state is State.POMO
    assert hooks.tasks[-1] == "Focus"


def test_change_task_sets_context_switch_flag() -> None:
    hooks = RecorderHooks()
    fsm = TimerFSM(scheme=Scheme(), hooks=hooks)
    fsm.start_day(target=3)
    fsm.start_pomo("Deep work")
    fsm.change_task("Code review")
    assert fsm.current_task == "Code review"
    assert fsm.context_switch is True
    assert hooks.tasks[-1] == "Code review"
