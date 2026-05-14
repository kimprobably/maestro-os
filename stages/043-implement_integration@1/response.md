Implemented the integration/release-hardening phase in `apps/waketask-iphone` with CI, exploratory automation, tests, and evidence.

Changed files:
- [ios-quality.sh](/home/daytona/workspace/apps/waketask-iphone/scripts/ci/ios-quality.sh)
- [ios-quality.yml](/home/daytona/workspace/apps/waketask-iphone/.github/workflows/ios-quality.yml)
- [appium-exploratory-tapper.sh](/home/daytona/workspace/apps/waketask-iphone/scripts/qa/appium-exploratory-tapper.sh)
- [IntegrationWakeExploratoryUITests.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplateProUITests/IntegrationWakeExploratoryUITests.swift)
- [CompositionRootTests.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplateProTests/CompositionRootTests.swift)
- [IOS_QUALITY_READINESS.md](/home/daytona/workspace/apps/waketask-iphone/docs/maintenance/IOS_QUALITY_READINESS.md)
- [integration.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/integration.md)

What’s now covered:
- `ios-quality.sh` includes required gates: `xcodebuild` build/test, SwiftLint, SwiftFormat, Qlty, secret scan, and App Store string audit.
- Secret handling is redacted-only (`present=true|false`), with optional blocking via `IOS_QUALITY_REQUIRE_SECRETS=1`.
- Generates `reports/ios/ios-quality-report.json` only on success.
- Exploratory script is no longer placeholder; it runs `IntegrationWakeExploratoryUITests` and writes passing `reports/ios/appium-exploratory-report.json` on success.
- New GitHub workflow runs both gates and uploads both reports.
- Added release/readiness documentation.

Validation run:
- Shell syntax checks passed for updated scripts.
- I could not execute `xcodebuild`/simulator gates in this environment (needs macOS runner).