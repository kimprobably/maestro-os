# UX Final Consensus

Merge the UX Studio final review set into a release-handoff decision.

Do not output secrets. If a source artifact contains credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values, write `secret material omitted` and reject the consensus.

Read:

- `.workflow/iphone-app-ux-studio/reviews/ux-quality.md`
- `.workflow/iphone-app-ux-studio/reviews/accessibility.md`
- `.workflow/iphone-app-factory/reviews/product-fidelity.md`
- `.workflow/iphone-app-factory/reviews/ios-architecture.md`
- `.workflow/iphone-app-factory/reviews/security-privacy.md`
- `.workflow/iphone-app-factory/reviews/release-readiness.md`
- `.workflow/iphone-app-ux-studio/final-review-gate.json`
- `.workflow/iphone-app-ux-studio/evidence/**`
- `reports/ios/**`
- changed app source, tests, CI output, Appium/XCUITest output, screenshot manifests, and handoff artifacts

## Required Output

Write:

`.workflow/iphone-app-ux-studio/reviews/final-consensus.md`

## Required Headings

Use these headings exactly:

- `# UX Final Consensus`
- `## Source List`
- `## Review Agreement`
- `## Blocking Issues`
- `## Evidence Summary`
- `## Release Handoff Notes`
- `## Residual Risks`
- `## Verdict`

## Decision Rules

- Reject if any required review artifact is missing, lacks a verdict, contains a blocking finding, or ends with `VERDICT: REJECTED`.
- Reject if hosted macOS/GitHub Actions evidence is missing while `allow_macos_deferred=false`.
- Reject if screenshot/Appium evidence is missing, blank, or not tied to changed screens.
- Reject if the implementation copies Mobbin, Pageflows, competitor screenshots, assets, layouts, copy, brand identity, or proprietary interactions rather than abstracting principles.
- Reject if secrets, credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values appear in review artifacts or handoff artifacts.

End `.workflow/iphone-app-ux-studio/reviews/final-consensus.md` with exactly one of these verdict lines:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
