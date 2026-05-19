#!/usr/bin/env python3
"""Apply Maestro-specific base gateway reliability patches to Hermes.

The Slack operator should never look silently wedged for many minutes. Hermes'
base adapter runs the agent handler without a wall-clock bound, so a slow model
or repeated tool loop can monopolize a Slack thread until it happens to finish.

This patch adds a Slack-scoped watchdog around the message handler. Non-Slack
platforms keep upstream behavior by default.
"""

from __future__ import annotations

import inspect
from pathlib import Path

import gateway.platforms.base as base


def main() -> None:
    path = Path(inspect.getfile(base))
    text = path.read_text()

    marker = "Maestro patch: Slack turn watchdog"
    call_needle = """            # Call the handler (this can take a while with tool calls)
            response = await self._message_handler(event)
"""
    call_patch = """            # Call the handler (this can take a while with tool calls)
            response = await self._maestro_message_handler_with_timeout(event)
"""
    direct_call_needle = """        response = await self._message_handler(event)
"""
    direct_call_patch = """        response = await self._maestro_message_handler_with_timeout(event)
"""

    if marker not in text:
        if call_needle in text:
            text = text.replace(call_needle, call_patch, 1)
        elif direct_call_needle in text:
            text = text.replace(direct_call_needle, direct_call_patch, 1)
        else:
            raise SystemExit(
                f"Expected base adapter message-handler call not found in {path}. "
                "Upstream may have moved; re-derive the Slack watchdog patch."
            )

    helper_needle = """    async def _process_message_background(self, event: MessageEvent, session_key: str) -> None:
"""
    helper_needle_untyped = """    async def _process_message_background(self, event, session_key):
"""
    helper = r'''    # Maestro patch: Slack turn watchdog.
    def _maestro_turn_timeout_seconds(self) -> float:
        platform = str(getattr(getattr(self, "platform", ""), "value", getattr(self, "platform", "")) or "").lower()
        if platform != "slack" and str(getattr(self, "name", "") or "").lower() != "slack":
            return 0.0

        raw = os.getenv("SLACK_TURN_TIMEOUT_SECONDS", "")
        if not raw:
            raw = str((self.config.extra or {}).get("turn_timeout_seconds", "300"))
        try:
            timeout = float(raw)
        except (TypeError, ValueError):
            timeout = 300.0
        if timeout <= 0:
            return 0.0
        return max(0.05, min(timeout, 1800.0))

    async def _maestro_message_handler_with_timeout(self, event):
        timeout = self._maestro_turn_timeout_seconds()
        if timeout <= 0:
            return await self._message_handler(event)

        try:
            return await asyncio.wait_for(self._message_handler(event), timeout=timeout)
        except asyncio.TimeoutError:
            logger.warning(
                "[%s] Slack turn timed out after %.1fs; returning bounded failure",
                self.name,
                timeout,
            )
            return (
                "I hit the Slack turn time limit before finishing. "
                "I stopped this turn so the thread is usable again. "
                "Ask me to continue, or ask me to have Quincy background babysit it."
            )

'''

    if "async def _maestro_message_handler_with_timeout" not in text:
        if helper_needle in text:
            text = text.replace(helper_needle, helper + helper_needle, 1)
        elif helper_needle_untyped in text:
            text = text.replace(helper_needle_untyped, helper + helper_needle_untyped, 1)
        else:
            raise SystemExit(
                f"Expected base adapter processing method not found in {path}. "
                "Upstream may have moved; re-derive the Slack watchdog helper patch."
            )

    path.write_text(text)
    print(f"Patched Hermes base reliability: {path}")


if __name__ == "__main__":
    main()
