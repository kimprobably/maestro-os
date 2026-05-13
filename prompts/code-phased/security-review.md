Review the generated application for security, privacy, and operational risk.

Read `.workflow/phased/spec.md`, `.workflow/phased/definition-of-done.md`, `.workflow/phased/phase-plan.json`, all phase evidence, and changed files under `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Write `.workflow/phased/security-review.md` with `VERDICT: APPROVED` or `VERDICT: REJECTED`.

Reject on unsafe secret handling, uncontrolled network/file access, injection risk, auth bypasses, unbounded external calls, unsafe dependency choices, or missing privacy handling required by the spec.
