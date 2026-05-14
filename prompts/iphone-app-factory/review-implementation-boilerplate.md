# Implementation Boilerplate Review

Read the spec, architecture, ADR, phase evidence, and app code.

Review whether the implementation uses SwiftAIBoilerplatePro properly.

Check:

- no unnecessary rebuild of auth, payments, AI, storage, networking, localization, settings, or DesignSystem
- CompositionRoot and AppShell changes follow existing patterns
- package boundaries are respected
- AppLogger is used instead of `print`
- Swift 6 concurrency patterns are preserved
- user-visible strings use Localization where appropriate

Write `.workflow/iphone-app-factory/reviews/implementation-boilerplate.md`.

Reject if the implementation bypasses boilerplate infrastructure without an ADR.
