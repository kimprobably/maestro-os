# Implement Foundation Phase

Implement only the foundation phase in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Read the spec, definition of done, architecture, ADR, and quality bar.

Foundation scope:

- app name and bundle ID
- BrandConfig and visible app identity
- colors/tokens where needed
- launch screen/app icon placeholders if final assets are unavailable
- legal docs placeholders with real product-specific text, not template copy
- secrets config templates, no hardcoded secrets
- GitHub macOS CI shell/workflow skeleton
- Appium exploratory tapper skeleton

Use SwiftAIBoilerplatePro conventions.

Secret handling is blocking: never print environment variables or credential values. Generated config may include placeholder keys only; do not write real tokens, passwords, cookies, OAuth credentials, or base64 auth blobs into app files, docs, CI, reports, or logs.

Write `.workflow/iphone-app-factory/evidence/foundation.md` with:

- `Files changed`
- `Commands run`
- `Acceptance criteria`
- `Risks`
