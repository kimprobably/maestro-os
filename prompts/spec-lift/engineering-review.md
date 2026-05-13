Review `{{ inputs.spec_path|default("specs/scaffold/completed-spec.md") }}` for engineering readiness.

Write `.maestro/spec-lift/engineering-review.md` with:
- APPROVED or REJECTED
- Missing architecture or ADR decisions
- Missing data model, integration, auth, sandbox, or dependency details
- Unclear file ownership or worker fanout boundaries
- Verification gaps
- Risks that require security, migration, performance, dependency, or ADR reviewers

Reject if a coding agent could start writing before the spec defines boundaries and quality gates.
