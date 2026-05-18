# UX App Store Review Mining

Mine public App Store reviews for the target product category and write the artifact to `.workflow/iphone-app-ux-studio/research/app-store-review-mining.md`.

## Source Policy

- Use public App Store reviews, public App Store listing metadata, and publicly accessible review summaries.
- Do not output secrets, credentials, tokens, cookies, private keys, session values, or environment variable values.
- Do not run or request environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`.
- Do not clone proprietary screens, exact layouts, UI copy, brand identity, screenshots, or assets.
- Do not include private user data beyond public review text already visible in the App Store source. Summarize sensitive personal details instead of repeating them.

## Required Headings

Use these exact headings:

1. `# App Store Review Mining`
2. `## Source Policy`
3. `## Source List`
4. `## Apps And Review Sources`
5. `## Complaint Themes`
6. `## Praise Themes`
7. `## Feature Requests`
8. `## Retention And Churn Signals`
9. `## Screen Type Implications`
10. `## what_to_adapt`
11. `## what_not_to_copy`
12. `## Reference Entries`

## Required Content

- Include each app name, country or storefront if known, source URL or source description, review date range when available, and evidence quality.
- Extract pain themes, praise themes, unmet expectations, repeated feature requests, and trust or safety concerns.
- For every reference entry, include app name, review theme, affected screen type, evidence summary, `what_to_adapt`, and `what_not_to_copy`.
- Use short review excerpts only when needed for evidence. Prefer paraphrase and theme summaries.
- Do not use review mining to clone competitor copy, screens, brand identity, or proprietary flows.
