# SPDX-License-Identifier: MIT
"""macOS menu bar bridge placeholder."""

from __future__ import annotations


class MacMenuBar:
    """Display current timer state in the macOS menu bar."""

    def update(self, text: str) -> None:
        print(f"[MacMenuBar] {text}")
