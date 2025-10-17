# SPDX-License-Identifier: MIT
"""Windows taskbar integration placeholder."""

from __future__ import annotations


class WinTaskbarStrip:
    """Expose quick controls through the Windows taskbar."""

    def update(self, text: str) -> None:
        print(f"[WinTaskbarStrip] {text}")
