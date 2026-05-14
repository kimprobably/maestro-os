# Implement Integration Phase

Implement only the integration and release-hardening phase in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Scope:

- wire feature into CompositionRoot/AppShell
- complete tests and UI test fixtures
- complete `scripts/ci/ios-quality.sh`
- complete `.github/workflows/ios-quality.yml`
- complete Appium exploratory script
- generate `reports/ios/ios-quality-report.json` when quality checks pass
- generate `reports/ios/appium-exploratory-report.json` when Appium checks pass
- create release/readiness docs

The CI script must include xcodebuild build/test, SwiftLint, SwiftFormat, Qlty, secret scan, and App Store string audit.

Write `.workflow/iphone-app-factory/evidence/integration.md` with:

- `Files changed`
- `Commands run`
- `Acceptance criteria`
- `Risks`
