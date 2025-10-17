# SPDX-License-Identifier: MIT
"""Today's progress view."""

from __future__ import annotations

from hardmode.core.timer_fsm import State, TimerFSM


class TodayView:
    """Minimal placeholder view for the daily dashboard."""

    def __init__(self, timer: TimerFSM):
        self.timer = timer

    def render(self) -> None:
        """Display placeholder output for the current phase."""
        state = self.timer.state.name.replace("_", " ").title()
        minutes = max(0, self.timer.seconds_left // 60)
        print(f"[TodayView] {state} | ~{minutes} minutes left")
