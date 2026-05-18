Create a generic phased implementation plan for `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Read:
- `.workflow/phased/spec.md`
- `.workflow/phased/definition-of-done.md`
- `.workflow/phased/context-brief.md`
- `.workflow/phased/postmortem_latest.md`, if present

Write `.workflow/phased/phase-plan.json` as strict JSON with this shape:

{
  "app_dir": "apps/generated-phased-app",
  "phases": [
    {
      "id": "foundation",
      "title": "Foundation",
      "objective": "...",
      "files": ["..."],
      "acceptance": ["..."],
      "commands": ["..."],
      "evidence": ["..."],
      "risks": ["..."]
    }
  ],
  "reviewers": ["correctness", "tests", "security", "simplification"],
  "release_gate": ["..."]
}

Use exactly these phase ids in this order:
- `foundation`: scaffold, dependencies, scripts, basic project shape
- `core`: domain logic, state/data model, business rules
- `interface`: UI, CLI, API, or external surface
- `integration`: end-to-end wiring, docs, operational hardening, release evidence

Each phase must be independently verifiable. Commands must be safe local commands that run inside the generated app directory. Do not write application code in this stage.
