# Consumer Radar Live Enrichment Implementation

Implement the generated live-enrichment workflow for `{{ inputs.app_dir|default("apps/generated-consumer-app-radar") }}`.

Required behavior:

- Wire Apify actor execution into live app discovery and social-content enrichment.
- Use Apple review ingestion for visible review samples.
- Add API/UI controls to fetch more apps.
- Fail real mode when required credentials or live results are missing and `allow_fixture_fallback=false`.
- Persist evidence artifacts showing which rows are live-scraped vs fixture-backed.
- Add deterministic tests before implementation changes.
- Add a code simplification pass before final review.

Write a short implementation report to `.workflow/consumer-radar-live-enrichment/implementation-report.md`.
