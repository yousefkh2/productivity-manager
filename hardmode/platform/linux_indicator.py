# SPDX-License-Identifier: MIT
"""Linux system tray / app indicator placeholder."""

from __future__ import annotations


class LinuxIndicator:
    """Expose timer status in desktop environments with indicators."""

    def update(self, text: str) -> None:
        print(f"[LinuxIndicator] {text}")
