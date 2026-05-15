# Release Readiness Review

Review release readiness evidence:

- iOS CI report
- App Store hardening report
- App Store metadata/review notes
- TestFlight readiness
- signing/credential blockers

Write `.workflow/iphone-app-factory/reviews/release-readiness.md`.

Reject if the app claims App Store readiness without macOS/Xcode evidence.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
