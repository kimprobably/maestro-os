Review the complete generated application for correctness.

Read `.workflow/phased/spec.md`, `.workflow/phased/definition-of-done.md`, `.workflow/phased/phase-plan.json`, all phase evidence, and changed files under `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Write `.workflow/phased/correctness-review.md` with `VERDICT: APPROVED` or `VERDICT: REJECTED`.

Reject on unmet acceptance criteria, broken state flow, fake behavior, missing error handling, or implementation drift from the spec.
