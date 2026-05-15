# Security And Privacy Review

Review the generated app, configs, CI, and release artifacts.

Write `.workflow/iphone-app-factory/reviews/security-privacy.md`.

Reject for hardcoded secrets, PII logging, weak privacy/legal docs, unsafe network handling, or missing secret scanning.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
