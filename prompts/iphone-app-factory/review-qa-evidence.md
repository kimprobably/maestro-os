# QA Evidence Review

Review QA evidence:

- xcodebuild build/test
- unit/UI tests
- Appium exploratory report
- button tap coverage
- crashes/failures

Write `.workflow/iphone-app-factory/reviews/qa-evidence.md`.

Reject if Appium did not tap reachable controls or if failures are unresolved.

For `allow_macos_deferred=false`, reject if Appium/XCUITest or hosted macOS evidence is only described textually. Require GitHub Actions run id, commit SHA, successful conclusion, artifact names, and the concrete `reports/ios/appium-exploratory-report.json` or equivalent artifact. If deferral is true, the review must name the accepted risk, compensating controls, and review deadline.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
