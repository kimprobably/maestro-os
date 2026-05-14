# iOS Quality Readiness

This document defines the release-hardening quality bar for WakeTask.

## Required CI Gates

Run `scripts/ci/ios-quality.sh` and require all gates to pass:

- `xcodebuild` dependency resolution
- `xcodebuild build` on iOS simulator
- `xcodebuild test` on iOS simulator
- SwiftLint (`swiftlint lint --strict`)
- SwiftFormat (`swiftformat . --lint`)
- Qlty (`qlty check`)
- Secret pattern scan (repository-wide)
- App Store string audit (`strings` on Release binary)

On success, CI writes:

- `reports/ios/ios-quality-report.json`

## Exploratory Automation Gate

Run `scripts/qa/appium-exploratory-tapper.sh`:

- Executes `IntegrationWakeExploratoryUITests` using `xcodebuild test`
- Traverses key tab flow and wake alarm create path
- Produces `reports/ios/appium-exploratory-report.json` only after success

## Secret-Handling Policy

- Never print credential values in scripts or CI logs.
- Secret checks only print `present=true|false`.
- To enforce required secrets as blocking, set:
  - `IOS_QUALITY_REQUIRE_SECRETS=1`

## Release Readiness Checklist

- `ios-quality.yml` passing on the merge head
- `ios-quality-report.json` uploaded as artifact
- `appium-exploratory-report.json` uploaded as artifact
- No template strings found by App Store string audit
- No hardcoded secret patterns found by repository scan
