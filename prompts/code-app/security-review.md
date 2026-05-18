Run a risk-based security review.

Read `.workflow/spec.md`, `.workflow/context-brief.md`, and changed files under `{{ inputs.app_dir|default("apps/generated-app") }}`.

Write `.workflow/security-review.md` with APPROVED, APPROVED_WITH_NOTES, or REJECTED.

Focus on:
- Secrets and API keys
- Browser-exposed credentials
- Auth/session boundaries
- Webhooks, CORS, CSP, and external calls
- User input handling
- Dependency and supply-chain risk

If the spec has no security-relevant surface, state that and approve with notes.
