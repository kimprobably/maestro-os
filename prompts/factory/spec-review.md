# Factory Spec Review

Review `{{ inputs.spec_path|default("specs/factory/goal-to-production-spec.md") }}`
against:

- `knowledge/workflow-standards.md`
- `knowledge/validator-library.md`
- `knowledge/fabro-workflow-patterns.md`
- `.maestro/factory/context.md`

Check:

- spec clarity and completeness;
- acceptance criteria testability;
- work package boundaries;
- reviewer coverage;
- STOP gates;
- deterministic verification plan;
- CI/CD plan;
- simplification/refactor pass;
- ADR need and architecture risk.

Write `.maestro/factory/spec-review.md`.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
