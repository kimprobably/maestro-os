# Final Consensus Review

Read:

- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/definition-of-done.md`
- `.workflow/iphone-app-factory/reviews/product-fidelity.md`
- `.workflow/iphone-app-factory/reviews/ios-architecture.md`
- `.workflow/iphone-app-factory/reviews/security-privacy.md`
- `.workflow/iphone-app-factory/reviews/code-quality.md`
- `.workflow/iphone-app-factory/reviews/release-readiness.md`
- `.workflow/iphone-app-factory/reviews/qa-evidence.md`
- `.workflow/iphone-app-factory/quality-contract-gate.json`
- `.workflow/iphone-app-factory/ios-ci-gate.json`
- `.workflow/iphone-app-factory/appium-gate.json`
- `.workflow/iphone-app-factory/app-store-hardening-gate.json`

Merge the review fanout into a final release decision.

Rules:

- If any reviewer finds a blocking issue, reject.
- If macOS/Xcode or Appium evidence is missing and not explicitly deferred, reject.
- If the app does not use the boilerplate substantially, reject.
- If App Store 4.3 hardening did not pass, reject.

Write `.workflow/iphone-app-factory/final-consensus.md` with:

- reviewer agreement/disagreement
- blocking issues
- remaining deferred items
- release handoff notes

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
