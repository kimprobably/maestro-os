# Factory Review Consensus

Read:

- `.maestro/factory/correctness-review.md`
- `.maestro/factory/test-review.md`
- `.maestro/factory/security-review.md`
- `{{ inputs.spec_path|default("specs/factory/goal-to-production-spec.md") }}`

Write `.maestro/factory/review-consensus.md`.

Include:

- top findings by severity;
- whether each finding blocks completion;
- required repair actions;
- residual risk.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
