# Implementation Correctness Review

Read:

- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/definition-of-done.md`
- `.workflow/iphone-app-factory/architecture.md`
- all phase evidence
- app code in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`

Review correctness before simplification.

Check that the implementation actually satisfies the spec, not just the evidence notes. Look for missing flows, broken state handling, incorrect persistence, unhandled errors, bad edge cases, and mismatches between UI behavior and requirements.

Write `.workflow/iphone-app-factory/reviews/implementation-correctness.md`.

Use `blocking` for issues that must go back to implementation before simplification.
