#!/usr/bin/env python3
"""Apply Maestro-specific guardrails to Hermes self-learning.

Hermes v0.13's background review fork can patch a currently loaded skill.
That is useful for solo experimentation, but too loose for Maestro's
operator: curated skills are versioned inputs, and important changes should
go through Promptfoo/Fabro evidence before promotion.

This patch is intentionally narrow:

- foreground, user-directed `skill_manage` keeps working;
- background review can still create new skills;
- background review cannot edit/patch/delete/write files in skills that are
  not marked as Hermes agent-created by the skill usage sidecar.

The Hermes curator already filters to agent-created skills, so this closes the
other overwrite path without disabling the learning loop.
"""

from __future__ import annotations

import inspect
from pathlib import Path

import tools.skill_manager_tool as skill_manager_tool


def main() -> None:
    path = Path(inspect.getfile(skill_manager_tool))
    text = path.read_text()

    marker = "Maestro patch v2: protect curated skills from background review"
    if marker in text:
        print(f"Hermes skill manager already patched: {path}")
        return

    needle = """    if action == "create":
"""
    old_guard = """    # Maestro patch: protect curated skills from background review.
    # Hermes' background self-improvement fork is allowed to create new
    # agent-created skills, but it must not silently mutate curated/manual
    # skills. Important skill promotion belongs behind Maestro's external
    # evidence gates (Promptfoo/Fabro/review), not Hermes self-evaluation.
    try:
        from tools.skill_provenance import is_background_review as _maestro_is_background_review
        if _maestro_is_background_review() and action in {"edit", "patch", "delete", "write_file", "remove_file"}:
            try:
                from tools import skill_usage as _maestro_skill_usage
                _maestro_agent_created = bool(_maestro_skill_usage.is_agent_created(name))
            except Exception:
                _maestro_agent_created = False
            if not _maestro_agent_created:
                return tool_error(
                    "Maestro policy: background self-improvement may create new skills, "
                    "but may not mutate curated/manual skills. Propose the change for "
                    "Promptfoo/Fabro validation or ask the operator explicitly.",
                    success=False,
                )
    except Exception:
        pass

"""
    guard = """    # Maestro patch v2: protect curated skills from background review.
    # Hermes' skill_usage.is_agent_created() currently means "not bundled or
    # hub-installed", so it returns true for local manual/curated skills. That
    # is too broad for Maestro. Background review may only mutate skills with
    # explicit usage sidecar provenance: created_by=agent or agent_created=true.
    try:
        from tools.skill_provenance import is_background_review as _maestro_is_background_review
        if _maestro_is_background_review() and action in {"edit", "patch", "delete", "write_file", "remove_file"}:
            try:
                from tools import skill_usage as _maestro_skill_usage
                _maestro_record = _maestro_skill_usage.get_record(name)
                _maestro_agent_created = (
                    isinstance(_maestro_record, dict)
                    and (
                        _maestro_record.get("created_by") == "agent"
                        or _maestro_record.get("agent_created") is True
                    )
                )
            except Exception:
                _maestro_agent_created = False
            if not _maestro_agent_created:
                return tool_error(
                    "Maestro policy: background self-improvement may create new skills, "
                    "but may not mutate curated/manual skills. Propose the change for "
                    "Promptfoo/Fabro validation or ask the operator explicitly.",
                    success=False,
                )
    except Exception:
        pass

"""

    if old_guard in text:
        path.write_text(text.replace(old_guard, guard, 1))
        print(f"Upgraded Hermes skill manager learning guard: {path}")
        return

    if needle not in text:
        raise SystemExit(
            f"Expected skill_manage dispatch block not found in {path}. "
            "Upstream may have moved; re-derive the learning guard patch."
        )

    path.write_text(text.replace(needle, guard + needle, 1))
    print(f"Patched Hermes skill manager learning guard: {path}")


if __name__ == "__main__":
    main()
