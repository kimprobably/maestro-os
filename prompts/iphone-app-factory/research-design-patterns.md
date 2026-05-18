# iOS Design Pattern Research

Read `.workflow/iphone-app-factory/context.md`, `quality-bar.json`, and the research artifacts.

If `{{ inputs.use_mobbin|default("true") }}` is true and a usable Mobbin login/session is available, use browser tooling to inspect Mobbin iOS patterns that fit this app type. Credentials, if available, come from `MOBBIN_EMAIL` and `MOBBIN_PASSWORD`; never write either value into files, prompts, logs, or reports. Use Mobbin's native email/password path by clicking `See other options`; do not choose Google OAuth for these credentials. Otherwise use Apple Human Interface Guidelines, competitor screenshots/listings, and the boilerplate DesignSystem docs.

Secret handling is blocking: never print environment variables or credential values. If checking Mobbin credential availability, report only true/false presence and never echo, grep, dump, log, or write the email, password, cookies, or session values. Do not run environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`, and do not echo any `$...TOKEN`, `$...KEY`, `$...PASSWORD`, `$...AUTH`, or `$...CREDENTIAL` variable.

Write `.workflow/iphone-app-factory/research/design-patterns.md` with:

- pattern name
- source app or design reference
- why it fits this product
- what to adapt into SwiftUI
- what not to copy
- DesignSystem components or tokens likely to use

This is inspiration and pattern abstraction, not clone work. Do not copy another app's visual design or proprietary assets.
