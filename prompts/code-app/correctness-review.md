Review the implementation for correctness.

Read `.workflow/spec.md`, `.workflow/definition_of_done.md`, `.workflow/plan_final.md`, `.workflow/implementation_log.md`, and changed files under `{{ inputs.app_dir|default("apps/generated-app") }}`.

Write `.workflow/correctness-review.md` with APPROVED or REJECTED.

Reject on:
- Acceptance criteria not met
- Broken state/data flow
- Missing failure handling
- Spec Kitty or ADR state drift
- Placeholder or stub behavior
