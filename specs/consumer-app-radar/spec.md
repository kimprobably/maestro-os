# Consumer App Radar Spec

## Goal

Build an internal dashboard that surfaces fast-growing consumer iPhone apps in the United States across productivity, health, wellness, fitness, positivity, and screen-time-control categories. The product should prioritize week-over-week acceleration over total size, then explain how each app appears to be growing and what product gaps users mention in reviews.

## Workflow Requirements

- Use Fabro as the runtime. The workflow must run in Daytona and must remain repository-relative.
- Use Spec Kitty as the spec/governance surface where available; absence of the CLI should produce a recorded warning rather than block the spike.
- Use Apify for source adapters. The App Store actor defaults to crawlerbros/appstore-scraper; TikTok defaults to clockworks/tiktok-scraper; Instagram defaults to apify/instagram-scraper.
- Use public Apple RSS/iTunes sources for app metadata and review ingestion when possible.
- Use OpenRouter model review fanout for Kimi, Qwen, and DeepSeek. Expensive models should be used for scaffolding and hard review; cheaper models can do generation and repeated classification.
- Use Qlty and native checks as CI/CD gates. If Qlty is not installed in the sandbox, record that and keep the spike moving after native checks pass.
- Use Promptfoo if available; otherwise run a deterministic fallback eval and record the fallback clearly.

## App Requirements

- Dashboard with sortable app cards/table, growth score, rank/review/social deltas, and opportunity score.
- App detail view with social strategy, review themes, feature requests, and suggested investigation angles.
- API endpoints:
  - GET /health
  - GET /api/apps
  - GET /api/apps/:id
  - POST /api/refresh
- Data adapters:
  - Apple search/reviews adapter
  - Apify actor runner with configurable actor IDs
  - Fixture fallback for offline repeatability
- Scoring:
  - Prefer acceleration and recent review velocity over absolute rank.
  - Include social velocity and review pain density.
  - Penalize stale or thin data.
- Verification:
  - Node native tests
  - Syntax/type smoke via node --check
  - Artifact validator
  - Qlty gate
  - Promptfoo or fallback eval
  - Parallel model review consensus

## Quality Bar

The first pass is allowed to use fixture data and live-source smoke checks. It is not allowed to hardcode secrets, depend on a local absolute path, or bypass Fabro orchestration. The generated workflow is the source of truth for the app build process.
