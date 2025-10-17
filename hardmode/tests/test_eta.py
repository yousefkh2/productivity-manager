# SPDX-License-Identifier: MIT
"""Tests for the ETA helpers."""

from __future__ import annotations

from datetime import datetime

from hardmode.core.eta import estimate_completion
from hardmode.core.timer_fsm import Scheme


def test_estimate_completion_with_defaults() -> None:
    start = datetime(2024, 1, 1, 9, 0, 0)
    scheme = Scheme(work_min=25, short_min=5, long_min=15, cadence=4)
    eta = estimate_completion(start, remaining_focus_blocks=2, scheme=scheme)
    assert eta.hour == 10
    assert eta.minute == 0


def test_estimate_completion_zero_remaining() -> None:
    start = datetime(2024, 1, 1, 9, 0, 0)
    assert estimate_completion(start, 0) == start
