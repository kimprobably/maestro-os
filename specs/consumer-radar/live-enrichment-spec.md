# Consumer Radar Live Enrichment Spec

## Goal

Replace fixture-only Consumer Radar enhancement behavior with a real live enrichment path.

## Required Behavior

- Discover additional US iPhone app candidates from live sources.
- Use Apify for App Store and social content scraping when credentials are present.
- Use Apple review ingestion for visible review samples.
- Mark rows as live only when live evidence was scraped.
- Fail real mode when APIFY_TOKEN is missing and allow_fixture_fallback=false.
- Add UI/API controls to fetch more apps.
- Preserve fixture fallback only as an explicitly disclosed offline mode.

## Non-Cheating Acceptance

- Notes or disclosure text alone do not satisfy this spec.
- A manual seed form alone does not satisfy "get more apps".
- A liveScraped=true value is invalid without source evidence.
- The live_data_gate must fail if no live apps, reviews, or social examples are produced in real mode.

## Quality Gates

- Test-driven development before implementation.
- Eval-driven review for source realism, ranking quality, and workflow quality.
- Code simplification before final review.
