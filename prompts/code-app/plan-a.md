Create implementation plan A for `{{ inputs.app_dir|default("apps/generated-app") }}`.

Read `.workflow/spec.md`, `.workflow/definition_of_done.md`, `.workflow/context-brief.md`, and `.workflow/postmortem_latest.md` if present.

Write `.workflow/plan_a.md` with:
- File-scoped work queue
- Dependency ordering
- Worker ownership boundaries
- Test and verification strategy
- Qlty and native gates
- Browser/visual evidence plan
- Review fanout plan
- Risks and rollback points

Prefer small, inspectable modules. Do not hand-wave "build the app"; every module must have a path and acceptance criteria.
