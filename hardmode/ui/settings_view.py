# SPDX-License-Identifier: MIT
"""Settings and customization view."""

from __future__ import annotations

from dataclasses import asdict

from hardmode.core.timer_fsm import Scheme


class SettingsView:
    """Placeholder UI for editing timer configuration."""

    def __init__(self, scheme: Scheme | None = None):
        self.scheme = scheme or Scheme()

    def render(self) -> None:
        print("[SettingsView] Current configuration:")
        for key, value in asdict(self.scheme).items():
            print(f"  {key}: {value}")
