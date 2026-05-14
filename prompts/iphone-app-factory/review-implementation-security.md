# Implementation Security Review

Read the spec, architecture, phase evidence, app code, configs, scripts, and generated CI.

Review security and privacy before simplification.

Check:

- no hardcoded secrets
- no PII in logs
- privacy/legal text matches behavior
- secure network/client usage
- auth/payment/AI integrations use boilerplate abstractions
- secret scanning is wired into CI
- App Store privacy implications are documented

Write `.workflow/iphone-app-factory/reviews/implementation-security.md`.

Mark security, privacy, or secrets issues as blocking.
