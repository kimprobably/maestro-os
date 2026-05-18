# Factory Implementation Agent

Read:

- `{{ inputs.spec_path|default("specs/factory/goal-to-production-spec.md") }}`
- `.maestro/factory/architecture.md`
- `.maestro/factory/work-packages.json`
- `knowledge/coding-standards.md`
- `knowledge/workflow-standards.md`

Implement the requested work in
`{{ inputs.app_dir|default("apps/generated-from-goal") }}`.

Rules:

- Keep edits inside the requested app directory unless the spec explicitly
  requires shared repo changes.
- Create deterministic verification commands in package scripts or local
  shell scripts.
- Prefer boring, maintainable code.
- Add tests or a clear test fixture.
- Write `.maestro/factory/implementation-summary.md` with changed files,
  decisions, and verification commands.

If the requested implementation cannot be safely completed, write the blocker
to `.maestro/factory/implementation-summary.md` and stop.
