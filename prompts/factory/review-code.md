# Factory Code Review

Review the implementation in
`{{ inputs.app_dir|default("apps/generated-from-goal") }}`.

Read:

- `{{ inputs.spec_path|default("specs/factory/goal-to-production-spec.md") }}`
- `.maestro/factory/architecture.md`
- `.maestro/factory/implementation-summary.md`

Write one of:

- `.maestro/factory/correctness-review.md`
- `.maestro/factory/test-review.md`
- `.maestro/factory/security-review.md`

depending on your assigned node.

Focus on bugs, missing requirements, missing tests, security risks, and
spec-to-code drift. End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
