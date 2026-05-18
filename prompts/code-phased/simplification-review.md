Review the generated application for unnecessary complexity.

Read `.workflow/phased/spec.md`, `.workflow/phased/definition-of-done.md`, `.workflow/phased/phase-plan.json`, all phase evidence, and changed files under `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Write `.workflow/phased/simplification-review.md` with `VERDICT: APPROVED` or `VERDICT: REJECTED`.

Reject only when complexity creates real risk: duplicated systems, avoidable abstractions, fragile indirection, unused dependencies, or generated code that is too broad for the spec.
