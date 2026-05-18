# Brain Research Spec (Spec 3)

## Purpose

Feed the brain from the web. Two capabilities:

1. **URL intake** — given the client's website and LinkedIn URL, scrape
   everything, seed the brain with `client` claims, and seed the
   `voice.md` / `design.md` knowledge files. The Mako-style 60-second
   onboarding — no document homework.
2. **Market research** — research briefs drive scraping of Reddit, Instagram,
   competitors, reviews, and search; the results become `market` claims —
   real customer and competitor signal.

Both feed Spec 2's extraction primitive: scrape → artifacts → claims.

## Context

Depends on Spec 1 (grounded nodes, command core, the vault) and Spec 2 (the
claim schema, provenance, and the `brain-extract` extraction workflow). This
spec adds *acquisition* — it does not redefine extraction; it produces
artifacts and hands them to `brain-extract`.

The coding repo reuses mas-platform's scraping integrations (all
`BaseApiClient` subclasses): LinkedIn via Apify/Harvest is mature; web scraping
via Firecrawl; search via Serper/Exa. Reddit and Instagram are added as Apify
actors + Firecrawl fallback.

## Non-Goals

- Do not redefine extraction — `brain-extract` (Spec 2) is the extraction
  stage; this spec only acquires artifacts and invokes it.
- Do not publish or generate anything (Specs 4–5).
- Do not scrape without a tenant scope; all artifacts land under
  `clients/<slug>/artifacts/`.
- Do not build a research UI — the cockpit (Spec 6) renders it.

## Artifacts

A scraped artifact is a file under `clients/<slug>/artifacts/` with minimal
frontmatter (the same shape `source.add` uses for uploads):

```yaml
id: art-2026-05-16-1a2b3c
origin: scrape | upload
source_label: "r/smallbusiness — fractional CFO thread"
url: https://reddit.com/r/smallbusiness/...      # present for scrapes
provenance_hint: client | market                 # whose footprint this is
acquired_at: 2026-05-16T13:21:08Z
```

`provenance_hint` flows into the claims extracted from this artifact: the
client's own site and LinkedIn → `client`; everyone else → `market`.

## URL Intake

`workflows/gtm/research-intake.fabro`, invoked by `research.intake`:

1. **Scrape the website** (Firecrawl) — crawl the client's site; each page →
   an artifact (`provenance_hint: client`).
2. **Scrape the client's LinkedIn** (Apify/Harvest) — company page and, if
   given, the founder profile and recent posts → artifacts
   (`provenance_hint: client`).
3. **Brand extraction** (LLM, `.extraction`) — read the scraped site and
   write/seed `knowledge/design.md` (colors, fonts, logo, imagery style) and
   `knowledge/voice.md` (tone). These are knowledge files, not claims.
4. **Extract** — invoke `brain-extract` (Spec 2) over the new artifacts →
   `client` claims.
5. **Propose a research brief** from the resulting claims (see below).
6. Append `research.intake.completed`.

This is the onboarding fast path: `client.create` (Spec 1) can chain straight
into `research.intake` so a tenant goes from "website + LinkedIn URL" to a
seeded brain in one operator action.

## Research Briefs

A research brief is a small markdown file under
`clients/<slug>/brain/research-briefs/<id>.md` — frontmatter listing targets:

```yaml
id: brief-2026-05-16-9c8d7e
subreddits: ["r/smallbusiness", "r/agency"]
search_terms: ["fractional CFO for agencies", "..."]
competitor_domains: ["competitor.com"]
instagram_handles: ["@..."]
linkedin_searches: ["fractional CFO"]
review_sources: ["g2.com/...", "trustpilot.com/..."]
```

`research.brief.propose` reads the existing brain — the `icp`, `offer`, and
`positioning` claims — and an LLM proposes targets, writing a brief the
operator edits before running. Brief → research is a loop: claims propose
where to look next.

## Market Research

`workflows/gtm/brain-research.fabro`, invoked by `research.run`:

1. **Load** the brief; assert tenant scope. Append `research.run.started`.
2. **Scrape — fanout, parallel** — one Fabro fanout node per source:
   - Reddit (Apify Reddit actor) — threads + comments on the subreddits/terms.
   - Instagram (Apify Instagram actor / Firecrawl) — the handles.
   - Competitor sites + review pages (Firecrawl).
   - Web/news search (Serper/Exa) — the search terms.
   - Prospect/competitor LinkedIn (Apify/Harvest).
   Each result → an artifact (`provenance_hint: market`).
3. **Extract** — invoke `brain-extract` (Spec 2) over the new artifacts. The
   per-artifact cheap-model extraction is the cost-control layer — thousands
   of scraped comments are turned into cited claims by a cheap model in
   parallel, never fed raw to a large model.
4. **Index + topics** — `brain-extract` regenerates the index and topic
   summaries; `market` claims now sit beside `client` claims, unified.
5. Append `research.run.completed` (artifact + claim counts by source).

Awareness-stage tagging (Mako-style — unaware / problem-aware / solution-aware
/ product-aware) is an optional tag the extraction prompt may set on `market`
claims; it is a `tag`, not a required field.

## Commands

- `research.intake` — `{ tenant, websiteUrl, linkedinUrl? }`. Runs
  `research-intake.fabro`.
- `research.brief.propose` — `{ tenant }`. Proposes a brief from the brain.
- `research.brief.list` / `research.brief.show`.
- `research.run` — `{ tenant, briefId, detach? }`. Runs `brain-research.fabro`.
- `research.list` — `{ tenant }`. Research runs with artifact/claim counts.

## Acceptance Criteria

- `research.intake` for the reference tenant, given a website + LinkedIn URL,
  produces scraped artifacts, seeds `design.md` and `voice.md`, and produces
  `client` claims via `brain-extract`.
- `research.brief.propose` reads the brain and writes a brief naming
  subreddits, search terms, and competitor domains.
- `research.run` fans out across sources, produces `market`-hint artifacts,
  and `brain-extract` turns them into `market` claims grounded with a URL
  locator.
- Reddit and Instagram scraping work via the Apify client + Firecrawl
  fallback; LinkedIn reuses the mas-platform integration.
- Every research workflow declares `tenant`; `maestro verify
  workflow-quality` passes; a leaks-tenant fixture fails the lint.
- `trace.node` on a `market` claim returns the scraped artifact and its URL.
- The promptfoo eval `evals/brain-research-quality.yaml` passes.

## Definition Of Done

- `workflows/gtm/{research-intake,brain-research}.fabro` + toml runners.
- Reddit and Instagram Apify actors wired into the Apify client; Firecrawl
  fallback. LinkedIn/Serper/Exa integrations reused.
- The brand-extraction prompt at `prompts/gtm/brand-extract.md`.
- Commands `research.*` in the command core, tested.
- `evals/brain-research-quality.yaml` covers grounding validity (URL-locator
  citations resolve), provenance correctness (client site → `client`, Reddit →
  `market`), and a no-invention check.
- `evals/brand-extract-quality.yaml` covers brand extraction: the generated
  `design.md`/`voice.md` reflect the scraped site (an LLM-judge check against
  the source), no invented brand attributes.
- A leaks-tenant negative fixture.
- `knowledge/known-gotchas.md` updated with scraping gotchas (rate limits,
  actor pricing, blocked pages).
- `maestro verify spec-quality specs/gtm/brain-research.md` passes.

## Risks

- **Reddit/Instagram scraping is brittle / rate-limited.** Mitigation: Apify
  actors + a Firecrawl fallback; per-source failure is isolated by fanout —
  one dead source does not fail the run.
- **Scraping cost.** Mitigation: per-artifact cheap-model extraction; the run
  manifest records token + scrape cost; briefs bound the scope.
- **Provenance mislabelling.** Mitigation: `provenance_hint` is set at
  acquisition by which target produced the artifact, not guessed at
  extraction; the eval checks it.
- **Volume swamps the brain.** Mitigation: topic summaries (Spec 2) digest the
  claims; dedup fingerprinting collapses repeats.
- **Scraped content is untrusted input.** Mitigation: the extraction prompt
  treats artifact text as quoted data, not instructions; claims must cite, not
  invent.

## Spec Kitty

Work packages: artifact schema, the Apify Reddit/Instagram actors, URL-intake
workflow, brand extraction, research briefs + propose, the market-research
fanout workflow, command-core commands, eval dataset.

## ADR

No ADR required for v0. A future ADR is required before a paying tenant,
covering scraping-provider redundancy, awareness-stage tagging as a
first-class field, and a research scheduling/refresh cadence.
