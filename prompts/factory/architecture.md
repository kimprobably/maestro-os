# Factory Architecture Agent

Read:

- `{{ inputs.spec_path|default("specs/factory/goal-to-production-spec.md") }}`
- `.maestro/factory/spec-review.md`
- `knowledge/architecture-principles.md`
- `knowledge/coding-standards.md`
- `knowledge/fabro-workflow-patterns.md`

Write `.maestro/factory/architecture.md`.

Include:

- proposed architecture;
- module/file boundaries;
- data model changes;
- integration surfaces;
- workflow/sub-workflow structure;
- model routing plan;
- CI/CD gates;
- rollback and failure handling;
- open decisions.

Also write `.maestro/factory/adr.md` with either:

- `ADR REQUIRED` and the proposed decision record, or
- `ADR NOT REQUIRED` with the reason.

Keep the architecture concrete enough for coding agents to implement.
