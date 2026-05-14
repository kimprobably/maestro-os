# App Store 4.3 Hardening

Read:

- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/architecture.md`
- app code in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`
- SwiftAIBoilerplatePro App Store 4.3 checklist if present

Perform release-readiness review focused on App Store duplicate/template risk.

Check:

- binary/release strings audit plan and evidence
- `SwiftAI`, `Boilerplate`, `EchoLLM`, `MockAuth`, `TODO`
- app name, bundle ID, BrandConfig, launch screen, legal docs
- App Store description and review notes
- first screenshot/hero screen is product-specific
- privacy manifest/nutrition label implications
- no fixture/mock/test flags in production release

Write `.workflow/iphone-app-factory/app-store-hardening.md`.

It must include:

- `release strings audit: PASS` only if real release/binary evidence exists or the generated CI script enforces it
- audit notes for each forbidden token
- Review Notes draft
- Privacy notes

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
