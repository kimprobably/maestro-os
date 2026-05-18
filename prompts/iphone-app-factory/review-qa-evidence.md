# QA Evidence Review

Review QA evidence:

- xcodebuild build/test
- unit/UI tests
- Appium exploratory report
- button tap coverage
- crashes/failures

Write `.workflow/iphone-app-factory/reviews/qa-evidence.md`.

Reject if Appium did not tap reachable controls or if failures are unresolved.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
