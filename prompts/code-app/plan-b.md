Create implementation plan B for `{{ inputs.app_dir|default("apps/generated-app") }}`.

Use a different decomposition from plan A if possible. Read `.workflow/spec.md`, `.workflow/definition_of_done.md`, `.workflow/context-brief.md`, and `.workflow/postmortem_latest.md` if present.

Write `.workflow/plan_b.md` with:
- File-scoped work queue
- Dependency ordering
- Worker ownership boundaries
- Test and verification strategy
- Qlty and native gates
- Browser/visual evidence plan
- Review fanout plan
- Risks and rollback points

Call out any point where the spec is still too weak to implement safely.
