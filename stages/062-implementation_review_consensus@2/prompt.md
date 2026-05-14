# Implementation Review Consensus

Read:

- `.workflow/iphone-app-factory/reviews/implementation-correctness.md`
- `.workflow/iphone-app-factory/reviews/implementation-tests.md`
- `.workflow/iphone-app-factory/reviews/implementation-security.md`
- `.workflow/iphone-app-factory/reviews/implementation-boilerplate.md`
- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/definition-of-done.md`

Merge the implementation code-review findings before simplification.

Write `.workflow/iphone-app-factory/reviews/implementation-consensus.md` with:

- reviewer agreement and disagreement
- blocking issues, if any
- concrete retry target
- explicit simplification instructions if approved

Rules:

- If any reviewer marks an issue blocking, reject.
- If tests, Appium wiring, or boilerplate reuse are missing, reject.
- If approved, simplification should focus only on reducing complexity without weakening quality gates.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
