Review the generated application's test and verification coverage.

Read `.workflow/phased/spec.md`, `.workflow/phased/definition-of-done.md`, `.workflow/phased/phase-plan.json`, all phase evidence, and changed files under `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Write `.workflow/phased/test-review.md` with `VERDICT: APPROVED` or `VERDICT: REJECTED`.

Reject on missing meaningful tests, tests that do not assert behavior, skipped fake checks, absent browser/API evidence when required, or missing failure-path coverage.
