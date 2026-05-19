# Spec Consensus

Read:

- `.workflow/iphone-app-factory/research-synthesis.md`
- `.workflow/iphone-app-factory/opportunity-matrix.json`
- all spec candidate outputs in context
- `.workflow/iphone-app-factory/spec-cross-critique.md`
- `.workflow/iphone-app-factory/quality-bar.json`

Merge the strongest ideas into one buildable spec.

Write:

- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/definition-of-done.md`
- `.workflow/iphone-app-factory/spec-consensus.md`

`spec.md` must include these section headings exactly:

- `# Product Spec`
- `## Research Evidence`
- `## User Journeys`
- `## MVP Scope`
- `## Boilerplate Reuse`
- `## Design Direction`
- `## Acceptance Criteria`
- `## Appium Exploratory QA`
- `## App Store Readiness`
- `## Definition of Done`

The Definition of Done must be checklist-based and testable.

The Definition of Done must include a `Run Recovery And Evidence` checklist with:

- control-plane failure classification and recovery: if prompt materialization, networking, metadata push, or artifact collection fails after useful state exists, preserve artifacts, record branch/SHA/checkpoint, compact large context, and restart or fork from the pushed run branch; do not treat the failed run as cleanly complete.
- hosted macOS CI fallback policy: when `allow_macos_deferred=false`, require GitHub Actions hosted macOS evidence with run id, commit SHA, successful conclusion, and artifact names; workflow-only CI declarations are not sufficient.
- deferral handling: if `allow_macos_deferred=true`, list explicit deferred iOS/Appium evidence, accepted risk, compensating controls, and review deadline; when false, reject missing macOS/Appium evidence.
- artifact preservation: final handoff must include app artifacts under `apps/*-iphone`, root GitHub workflows, `reports/ios`, metadata branch push status, and handoff manifest evidence.
