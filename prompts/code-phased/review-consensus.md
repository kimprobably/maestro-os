Synthesize the final review fanout for the phased app build.

Read:
- `.workflow/phased/correctness-review.md`
- `.workflow/phased/test-review.md`
- `.workflow/phased/security-review.md`
- `.workflow/phased/simplification-review.md`
- `.workflow/phased/spec.md`
- `.workflow/phased/definition-of-done.md`
- `.workflow/phased/phase-plan.json`

Write `.workflow/phased/final-review.md` with:
- `VERDICT: APPROVED` or `VERDICT: REJECTED`
- Summary of reviewer agreement and disagreement
- Blocking issues, if any
- Concrete retry target: `foundation`, `core`, `interface`, or `integration`
- Release handoff notes if approved

Reject if any reviewer found a blocking issue that was not explicitly resolved by evidence.
