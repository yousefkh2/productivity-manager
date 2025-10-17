# SPDX-License-Identifier: MIT
"""Helpers for estimating completion times and progress."""

from __future__ import annotations

from datetime import datetime, timedelta

from hardmode.core.timer_fsm import Scheme


def estimate_completion(
    start: datetime,
    remaining_focus_blocks: int,
    scheme: Scheme | None = None,
) -> datetime:
    """Estimate the time when the current session will finish."""
    if remaining_focus_blocks <= 0:
        return start
    scheme = scheme or Scheme()
    long_breaks = max(0, (remaining_focus_blocks - 1) // scheme.cadence)
    short_breaks = remaining_focus_blocks - long_breaks
    total_minutes = (
        remaining_focus_blocks * scheme.work_min
        + short_breaks * scheme.short_min
        + long_breaks * scheme.long_min
    )
    return start + timedelta(minutes=total_minutes)
