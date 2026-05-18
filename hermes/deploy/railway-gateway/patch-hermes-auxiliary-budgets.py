#!/usr/bin/env python3
"""Cap Hermes auxiliary summarization budgets for the Slack gateway.

Hermes v0.13 defaults are sized for rich terminal sessions:

- session_search asks for up to 10k output tokens per matched session;
- context compression can ask for 15.6k output tokens after the 1.3x guard.

That is too large for Maestro's Slack-resident operator. When Codex auxiliary
calls hiccup, Hermes falls through to OpenRouter; the current account can run
normal agent work, but those large auxiliary caps repeatedly produce 402
"more credits or fewer max_tokens" failures. The result is a bot that looks
dead while it burns time on background recall/compression.

The operator should keep Slack turns short and move durable work to Fabro or
worker lanes, so these smaller summaries are the right tradeoff.
"""

from __future__ import annotations

import inspect
from pathlib import Path

import agent.context_compressor as context_compressor
import tools.session_search_tool as session_search_tool


def replace_once(text: str, old: str, new: str, path: Path) -> str:
    if old not in text:
        raise SystemExit(f"Expected text not found in {path}: {old!r}")
    return text.replace(old, new, 1)


def patch_session_search() -> None:
    path = Path(inspect.getfile(session_search_tool))
    text = path.read_text()
    marker = "# Maestro patch: Slack gateway auxiliary budget caps"
    if marker in text:
        print(f"Hermes session_search budgets already patched: {path}")
        return
    text = replace_once(text, "MAX_SESSION_CHARS = 100_000", "MAX_SESSION_CHARS = 32_000", path)
    text = replace_once(text, "MAX_SUMMARY_TOKENS = 10000", "MAX_SUMMARY_TOKENS = 3000", path)
    text = text.replace(
        "MAX_SUMMARY_TOKENS = 3000",
        "MAX_SUMMARY_TOKENS = 3000\n" + marker,
        1,
    )
    path.write_text(text)
    print(f"Patched Hermes session_search auxiliary budgets: {path}")


def patch_context_compressor() -> None:
    path = Path(inspect.getfile(context_compressor))
    text = path.read_text()
    marker = "# Maestro patch: Slack gateway compression budget caps"
    if marker in text:
        print(f"Hermes compression budgets already patched: {path}")
        return
    text = replace_once(text, "_MIN_SUMMARY_TOKENS = 2000", "_MIN_SUMMARY_TOKENS = 1200", path)
    text = replace_once(text, "_SUMMARY_RATIO = 0.20", "_SUMMARY_RATIO = 0.08", path)
    text = replace_once(text, "_SUMMARY_TOKENS_CEILING = 12_000", "_SUMMARY_TOKENS_CEILING = 5_000", path)
    text = text.replace(
        "_SUMMARY_TOKENS_CEILING = 5_000",
        "_SUMMARY_TOKENS_CEILING = 5_000\n" + marker,
        1,
    )
    path.write_text(text)
    print(f"Patched Hermes compression auxiliary budgets: {path}")


def main() -> None:
    patch_session_search()
    patch_context_compressor()


if __name__ == "__main__":
    main()
