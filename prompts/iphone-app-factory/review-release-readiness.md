# Release Readiness Review

Review release readiness evidence:

- iOS CI report
- App Store hardening report
- App Store metadata/review notes
- TestFlight readiness
- signing/credential blockers

Write `.workflow/iphone-app-factory/reviews/release-readiness.md`.

Reject if the app claims App Store readiness without macOS/Xcode evidence.

Also reject when any of these are missing for `allow_macos_deferred=false`:

- GitHub Actions hosted macOS run id;
- commit SHA and branch;
- successful workflow conclusion;
- artifact names or links for xcodebuild/Appium/release evidence;
- metadata branch push verification and handoff manifest;
- explicit classification of any control-plane failure, with restart/fork instructions from the pushed run branch.

Workflow-only CI declarations, local-text claims, or fallback-only evidence are not enough.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
