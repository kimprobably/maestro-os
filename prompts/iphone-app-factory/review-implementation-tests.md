# Implementation Test Review

Read the spec, definition of done, architecture, phase evidence, and app code.

Review tests before simplification.

Check:

- unit tests for ViewModels, repositories, clients, and core logic
- UI tests for primary flows
- `xcodebuild build` and `xcodebuild test` evidence or CI wiring
- Appium exploratory coverage for reachable controls
- tests are meaningful rather than compile-only placeholders

Write `.workflow/iphone-app-factory/reviews/implementation-tests.md`.

Reject missing or fake tests as blocking.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
