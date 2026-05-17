---
id: spec:joni-productized-linkedin-agent
status: active
domain: hermes-linkedin
authority: planning-context
summary: Productize Joni as a thin Slack-resident LinkedIn growth agent over proven Blueprint-style scraping, corpus, eval, and edit-learning patterns.
links:
  local_sources:
    - hermes/profiles/joni/SOUL.md
    - hermes/profiles/joni/skills/linkedin-operator/SKILL.md
    - workflows/hermes/joni-linkedin-daily.fabro
    - scripts/hermes/joni-feed-watchlist.mjs
    - specs/gtm/brain-research.md
    - specs/gtm/brain.md
    - specs/gtm/campaign-generate.md
    - specs/gtm/edit-learning.md
    - /Users/timlife/Documents/claude code/mas-platform/apps/blueprint-api/CLAUDE.md
    - /Users/timlife/Documents/claude code/mas-platform/apps/blueprint-api/src/server/services/scraping.service.ts
    - /Users/timlife/Documents/claude code/mas-platform/apps/blueprint-api/src/trigger/posts.ts
---

# Joni Productized LinkedIn Agent Spec

## Purpose

Build Joni into a reusable LinkedIn growth agent that lives in Slack, learns a client's voice and market over time, watches a live LinkedIn corpus, surfaces outlier opportunities, drafts with Claude, captures human edits, and improves through evals.

This is not a full Blueprint rebuild. It is a thinner agentic operating layer that reuses the proven Blueprint patterns:

- scrape public LinkedIn/profile/content data through approved providers;
- turn raw source data into a durable client corpus;
- use Claude for high-quality writing and enrichment;
- preserve canonical client context in reviewed files;
- use evals as a first-class gate;
- feed human edits back into prompts, voice files, and eval candidates.

## Context

The current Joni implementation already proves the operating shape: she has a Hermes profile, a Slack gateway candidate, a LinkedIn operator skill, a private SQLite watchlist, HarvestAPI capture scripts, deterministic scoring, and a daily Fabro workflow. The missing product layer is the durable tenant corpus, eval-first drafting loop, human-edit learning, and cleaner separation between Tim-specific context and reusable agent infrastructure.

The existing Blueprint system in `mas-platform/apps/blueprint-api` is the proven reference for LinkedIn scraping, Claude-first enrichment, prompt versioning, and generated post workflows. The GTM specs in this repo define the future client brain, research intake, campaign generation, and edit-learning patterns. Joni v0 should reuse those patterns selectively while staying much thinner.

## Inputs

- Approved LinkedIn source lists, including the current Tim/Joni watchlist.
- HarvestAPI or Apify LinkedIn capture outputs.
- Client-owned profile, website, Blueprint, and content context when available.
- Tenant context files: `voice.md`, `icp.md`, `offer-map.md`, `story-bank.md`, `content-pillars.md`, and `forbidden-genericisms.md`.
- Slack instructions, approvals, rejects, and human-edited draft text.
- Published post URLs and approved analytics exports for performance review.
- Honcho memory summaries for recurring client/user preferences.

## Outputs

- A tenant-aware LinkedIn corpus with sources, posts, engagement snapshots, baselines, and outlier scores.
- Weekly outlier digests with URLs, metrics, outperformance rationale, and client-specific remix ideas.
- Draft candidates written in the client's voice and linked to evidence.
- Eval reports for outlier selection, draft quality, grounding, edit learning, and voice-card proposals.
- Human-edit records with before, after, diff, inferred intent, and routing outcome.
- Proposed tenant context updates and eval candidates, never silent canonical rewrites.
- Updated Joni skill/docs describing the product loop and state boundaries.

## Requirements

- Joni must use Claude-class models for Slack-facing operator conversation and writing-quality lanes.
- Deterministic workflows must select, capture, normalize, dedupe, score, and persist before any AI interpretation.
- Every product state write must be tenant-scoped, with Tim represented as `tenant_id = "tim"` in v0.
- Evals must exist from the first implementation slice and must gate draft-ready output.
- Human edits must be captured as structured data and fed into edit-intent inference.
- Canonical voice/context changes must be proposed for review rather than auto-applied.
- Raw source lists, secrets, full exports, and private corpus data must stay out of Hermes memory and git.
- The implementation must remain thin enough to run as a Hermes/Fabro product layer without rebuilding the full Blueprint stack.
- Drafting and editing must be constraint-preserving. Fixing one failed criterion must not degrade a criterion that was already passing unless the operator explicitly asks for a full rewrite.

## Product Position

Stanley proves market demand but is narrow: outlier emails plus lightweight writing help. Joni should be stronger because she has:

- Slack residency and ongoing conversation;
- automation through Fabro;
- a durable corpus and memory;
- client brain/context files;
- explicit evals;
- human-edit learning;
- performance monitoring;
- the ability to become a broader GTM/content operating agent over time.

The v0 should still stay thin. The first product-quality target is not "build all of Blueprint inside Hermes." It is:

> daily/weekly LinkedIn signal capture -> outlier scoring -> client-specific ideas -> Claude drafts -> evals -> human edits -> learning loop.

## Observed Drafting Lessons

The first live Joni drafting trial surfaced a specific failure mode:

- The initial drafts were directionally useful but generic. The AI feel came from structure, vague hooks, and lack of lived GTM specificity more than from banned words.
- Adding "human roughness" fixed polish but overcorrected into fake-casual writing. Roughness needs a band, not a binary pass.
- Adding ideal-client and pain checks improved relevance but made the hook worse because the key phrase, "the handoff," was unclear to a scrolling reader.
- Deterministic lint is useful as a floor, but it can create local optimization. Passing a checklist is not the same as a good post.
- The editing process must preserve what got better. Joni should not rewrite the entire post every time one dimension fails.

The product lesson is that Joni needs a lightweight editorial loop, not just more voice rules.

## Existing System To Reuse

### Current Joni Assets

Joni already has:

- a Hermes profile and Slack gateway candidate;
- a LinkedIn operator skill with no-publish boundaries;
- a private SQLite watchlist seeded from Tim's source list;
- a HarvestAPI capture path;
- deterministic post capture, dedupe, snapshot, and scoring scripts;
- a Fabro daily workflow that performs capture before AI review.

These should remain the v0 operational base.

### Blueprint And GTM Patterns

`mas-platform/apps/blueprint-api` already implements the older, proven product pattern:

- `scraping.service.ts`: Apify LinkedIn profile and posts scraping with polling, actor IDs, cleaning, and failure behavior.
- `trigger/scrape.ts`: profile -> posts -> enrichment pipeline choreography.
- `trigger/posts.ts`: Claude-first post generation, prompt version tracking, batch generation, and non-blocking side tasks.
- `prompt.service.ts`: database-backed prompts, prompt caching, pivot context, split system/user post generation prompts.
- `ai.service.ts`: Claude primary for enrichment/writing with fallback.

The Maestro GTM specs also define reusable primitives:

- `brain-research.md`: scrape website/LinkedIn/market sources into artifacts, then extract claims.
- `brain.md`: tenant-scoped claims, topic summaries, and canonical `voice.md` / `icp.md` / `design.md`.
- `campaign-generate.md`: grounded content objects, voice check, and no-publish generation.
- `edit-learning.md`: capture human edits, infer intent, route taste vs defect, propose voice changes, and promote defect cases into evals.

Joni v0 should copy those patterns, not the full infrastructure.

## Non-Goals

- Do not publish, comment, DM, connect, or mutate LinkedIn state.
- Do not scrape private/authenticated LinkedIn surfaces outside explicitly approved providers/tools.
- Do not build a general company brain product in this slice.
- Do not build the full Blueprint campaign generator in Hermes.
- Do not silently auto-apply voice changes or prompt changes from agent self-learning.
- Do not store raw connection exports, secrets, full source lists, or private customer data in Hermes memory.

## Architecture

### Runtime Roles

Joni should use Claude for the Slack-facing operator conversation and for all writing-quality lanes:

- voice extraction;
- content strategy interpretation;
- post drafting;
- rewriting;
- critique;
- edit-intent inference;
- subjective eval judging where deterministic checks are not enough.

Fabro and scripts own deterministic work:

- corpus ingestion;
- source selection;
- capture;
- dedupe;
- snapshot storage;
- baseline calculation;
- outlier scoring;
- artifact writing;
- eval command orchestration.

Hermes owns the agent surface:

- Slack conversation;
- profile prompt and skill loading;
- short-term task context;
- tool invocation;
- operator handoff.

Honcho owns long-term conversational memory:

- user/client preferences discovered through interaction;
- recurring feedback themes;
- relationship context;
- soft behavioral memory.

Canonical Markdown owns reviewed source-of-truth context:

- `voice.md`;
- `icp.md`;
- `offer-map.md`;
- `story-bank.md`;
- `content-pillars.md`;
- `forbidden-genericisms.md`;
- approved prompt/skill behavior notes.

SQLite owns queryable product state:

- tenants;
- sources;
- posts;
- snapshots;
- baselines;
- scores;
- draft candidates;
- human edits;
- eval results;
- prompt/model runs.

### Productization Boundary

V0 can run as one deployment/profile per tenant. The schema should still be tenant-ready:

- every product table has `tenant_id`;
- file paths are namespaced under a tenant profile path;
- Tim's deployment uses `tenant_id = "tim"`;
- no table or prompt assumes Maestro is the only customer.

This keeps the current implementation simple while avoiding a rewrite when packaging this as a product.

## Data Model

Use a new or extended SQLite database rather than overloading the current watchlist-only store. The current store can be migrated forward.

Core tables:

```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE linkedin_sources (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'profile',
  display_name TEXT NOT NULL,
  title TEXT,
  company_name TEXT,
  follower_count INTEGER NOT NULL DEFAULT 0,
  connections_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'watching',
  tier TEXT NOT NULL DEFAULT 'unassigned',
  source_notes TEXT,
  imported_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_selected_at TEXT,
  last_captured_at TEXT,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, linkedin_url)
);

CREATE TABLE linkedin_posts (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  linkedin_url TEXT,
  source_id TEXT,
  author_name TEXT,
  author_url TEXT,
  content_hash TEXT NOT NULL,
  content_excerpt TEXT NOT NULL,
  posted_at TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  latest_likes INTEGER NOT NULL DEFAULT 0,
  latest_comments INTEGER NOT NULL DEFAULT 0,
  latest_shares INTEGER NOT NULL DEFAULT 0,
  latest_total INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, linkedin_url)
);

CREATE TABLE post_snapshots (
  tenant_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  source_id TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  weighted_total INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, post_id, captured_at)
);

CREATE TABLE author_baselines (
  tenant_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  window_days INTEGER NOT NULL,
  median_weighted_total REAL NOT NULL DEFAULT 0,
  avg_weighted_total REAL NOT NULL DEFAULT 0,
  median_comment_count REAL NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  computed_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, source_id, window_days)
);

CREATE TABLE outlier_scores (
  tenant_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  scored_at TEXT NOT NULL,
  score REAL NOT NULL,
  outperformance_ratio REAL NOT NULL,
  velocity_score REAL NOT NULL,
  engagement_rate REAL NOT NULL,
  rationale_json TEXT NOT NULL,
  PRIMARY KEY (tenant_id, post_id, scored_at)
);

CREATE TABLE draft_candidates (
  tenant_id TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  source_post_id TEXT,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  hook TEXT NOT NULL,
  body TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  eval_summary_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE human_edits (
  tenant_id TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  before_body TEXT NOT NULL,
  after_body TEXT NOT NULL,
  diff TEXT NOT NULL,
  editor TEXT,
  source TEXT NOT NULL DEFAULT 'slack',
  intent_json TEXT,
  learned BOOLEAN NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE eval_runs (
  tenant_id TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  eval_name TEXT NOT NULL,
  prompt_version TEXT,
  model TEXT,
  status TEXT NOT NULL,
  score REAL,
  report_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

The schema should evolve in scripts with tests. Do not move to Postgres until the agent/product surface proves it needs shared multi-tenant querying or hosted app access.

## Tenant Context Files

For Tim's first tenant, create a private product-shaped context folder:

```text
docs/operator/linkedin/tenants/tim/
  voice.md
  icp.md
  offer-map.md
  story-bank.md
  content-pillars.md
  forbidden-genericisms.md
  prompt-notes.md
```

These are not arbitrary memory. They are reviewed, auditable configuration files. Joni may propose patches to them, but she should not silently overwrite them.

The first Tim seed should pull from:

- existing Maestro business memory;
- Joni's current LinkedIn ledger;
- Blueprint prompt patterns;
- Tim's provided Stanley examples;
- approved Tim LinkedIn posts when available;
- Blueprint-generated content if available and approved.

## Workflows

### 1. Daily Corpus Capture

Purpose: keep the LinkedIn corpus fresh.

Steps:

1. Select a bounded cohort from the tenant source list.
2. Validate HarvestAPI or Apify provider availability without printing secrets.
3. Capture recent posts.
4. Normalize and dedupe.
5. Store posts and snapshots.
6. Recompute affected author baselines.
7. Score outliers.
8. Write a compact daily artifact and ledger entry.

AI is not required for this workflow.

### 2. Backfill Corpus

Purpose: build enough history to make outlier scores meaningful.

Steps:

1. Read the full approved source list.
2. Process in chunks with budget/rate-limit controls.
3. Capture recent history per source.
4. Store snapshots and source health.
5. Compute initial baselines.
6. Report coverage: sources attempted, sources with posts, posts stored, failures by class.

This should be resumable by cursor and not depend on Slack context.

### 3. Weekly Outlier Digest

Purpose: create the Stanley-style weekly product artifact, but grounded in Joni's corpus.

Output:

- top outliers;
- URL, author, date, hook/excerpt;
- engagement and outperformance;
- why it likely worked;
- pattern category;
- how Tim/client could remix it;
- 3 to 5 draft-ready ideas.

Claude should do the interpretation, but only after deterministic scoring selects the candidate set.

### 4. Draft From Outlier

Purpose: turn one or more outlier patterns into client-specific posts.

Steps:

1. Load source post and score rationale.
2. Load tenant context files.
3. Load relevant Honcho memory summary.
4. Ask Claude for 2 to 3 draft options.
5. Run evals.
6. If evals pass, store draft candidates and post to Slack.
7. If evals fail, run one repair pass, then store with status `needs_review` if still weak.

### 5. Lightweight Editorial Loop

Purpose: improve drafts without over-rotating.

This should start as one workflow with role-separated passes, not multiple deployed agents. Move to a multi-agent Fabro batch only after the lightweight loop fails on repeated real drafts.

Steps:

1. **Brief lock**: write a compact brief before drafting:
   - target reader;
   - pain point;
   - why the post exists;
   - source/outlier pattern;
   - offer or business loop it supports;
   - one core idea the post must preserve.
2. **Draft variants**: produce 2 to 3 materially different versions, mostly varying the hook and angle rather than randomly changing voice.
3. **Eval-only pass**: score each draft without rewriting. The evaluator must identify passing criteria and failing criteria separately.
4. **Targeted edit plan**: before rewriting, state which failures will be fixed and which passing traits must be preserved. Example: "Improve hook clarity without increasing roughness, preserve B2B founder/pipeline specificity, preserve no-em-dash lint."
5. **Constrained rewrite**: make the smallest edit that fixes the failing criteria. Default max body change should be modest unless the draft is structurally broken.
6. **Regression eval**: re-score and compare against the prior draft. Reject the rewrite if it improves one dimension while making hook clarity, ICP specificity, pain specificity, or voice worse.
7. **Selection**: return the best draft plus the scorecard and unresolved risks. If no version passes, ask for a stronger source example or more client context instead of polishing weak material.

Do not optimize for "sounds human" in isolation. Human roughness is a seasoning, not the post's point.

### 6. Human Edit Capture

Purpose: save human edits so they improve the system.

Inputs:

- Slack reply with edited draft;
- explicit "use this version";
- manual file edit;
- future UI edit.

Steps:

1. Find the draft candidate being edited.
2. Store before/after and unified diff.
3. Run edit-intent inference.
4. Classify as `taste`, `defect`, `fact correction`, or `formatting`.
5. Route:
   - taste -> Honcho conclusion plus possible `voice.md` proposal after repetition;
   - defect -> eval candidate;
   - fact correction -> source/context update proposal;
   - formatting -> prompt note if recurring.

Do not auto-promote eval candidates or auto-edit `voice.md`.

### 7. Performance Review

Purpose: learn from published content.

Inputs:

- explicit post URLs;
- approved analytics export;
- future owned LinkedIn API/export path.

Steps:

1. Capture metrics for Tim/client posts.
2. Compare against the tenant's own baseline.
3. Write performance notes.
4. Distill internal claims: "this hook angle worked for this tenant."
5. Feed the next weekly digest and drafting run.

## Evals

Evals are required from v0, not a later hardening pass.

Initial eval set:

1. `joni-outlier-scoring-quality`
   - deterministic fixture over stored posts;
   - confirms recency, author baseline normalization, comment weighting, and "big creator only" bias controls.

2. `joni-draft-quality`
   - LLM rubric or promptfoo;
   - checks specificity, voice match, no generic ChatGPT phrasing, usable hook, clear point, evidence tie, and non-plagiarism.
   - checks that the hook is clear without hidden context. If the hook uses a phrase like "the handoff," the target reader must immediately understand what handoff means.
   - checks that the ideal client and pain point appear early enough to make the post commercially useful, not just intellectually interesting.
   - checks that light human roughness is inside a target band. Too little can feel sterile; too much feels forced.
   - checks for copywriter rhythm: stacked fragments, repeated declarations, dramatic three-item lists, and vague diagnostic questions.

3. `joni-grounding-quality`
   - every generated idea cites source post IDs, source URLs, or tenant context files;
   - rejects invented metrics, fake URLs, and unsupported claims.

4. `joni-edit-learn-quality`
   - fixture diffs with labelled intent;
   - checks taste vs defect vs fact correction classification.

5. `joni-voice-card-quality`
   - checks proposed voice/context changes against source edits;
   - rejects one-off, unsupported, or overbroad voice mutations.

6. `joni-weekly-digest-quality`
   - checks that the digest is useful, concise, evidence-backed, and has draftable ideas.

7. `joni-edit-regression-quality`
   - compares pre-edit and post-edit versions;
   - rejects overcorrection when a rewrite fixes one issue but worsens hook clarity, specificity, roughness balance, or target-reader fit;
   - includes fixtures for "too polished," "too rough," "unclear hook," "ICP bolted on awkwardly," and "good targeted edit."

Promptfoo can be the primary harness where possible. Deterministic script gates should cover shape, source references, recency windows, score math, and no-secret output.

Every workflow that uses Claude for product output should write an eval report path and store it in `eval_runs`.

## Verification Plan

Use deterministic tests and eval artifacts for every slice:

- Schema tests: initialize a temporary corpus DB and assert all tenant-scoped tables exist.
- Migration tests: import the current Joni watchlist and assert sources/posts retain tenant IDs.
- Scoring tests: run fixture posts through baseline and outlier scoring, including recency and large-author normalization cases.
- Workflow validation: run `fabro validate` on each new Joni workflow.
- Capture validation: run provider validation in presence-only mode and assert no secret values appear.
- Draft evals: run promptfoo or fallback rubric evals for voice, specificity, grounding, non-plagiarism, and claim safety.
- Edit-learning evals: run labelled before/after fixture diffs through intent classification.
- Edit-regression evals: run before/after fixture pairs to catch overrotation and score regressions.
- Regression checks: run `git diff --check`, relevant Node tests, and spec/workflow quality gates before claiming a slice complete.

## Model Routing

Default for Joni Slack:

- provider: Anthropic or OpenRouter Anthropic;
- model: Claude Sonnet class;
- reasoning: medium unless a task needs deeper critique.

Fabro stage routing:

- deterministic capture/scoring: scripts only;
- cheap extraction/summarization: Haiku/Gemini/mini class;
- drafting, voice, critique, edit learning: Claude Sonnet;
- eval judges: Claude Sonnet or a second model for adversarial review;
- operational status: cheap model acceptable.

If Claude auth is unavailable, Joni should fail clearly for writing lanes rather than silently degrade to weaker prose for customer-facing drafts.

## Memory Rules

Use Honcho for:

- recurring preference conclusions;
- conversational context;
- "Tim/client tends to prefer X" soft memory;
- Slack interaction history summaries.

Use tenant Markdown for:

- reviewed voice, ICP, offer, story, and content pillar source of truth.

Use SQLite for:

- corpus;
- scores;
- drafts;
- edits;
- evals;
- run state.

Use Hermes file memory only for:

- compact pointers and stable facts, such as where Tim's tenant context lives.

Do not put raw posts, raw source lists, or full edit histories into Hermes memory.

## Safety And Compliance

- Presence-only credential checks.
- No broad environment dumps.
- No secret values in logs, Slack, ledgers, eval reports, or memory.
- No publishing or account mutation without explicit future approval.
- No copying outlier posts too closely. Draft evals must check transformation distance and original contribution.
- Scraped content is untrusted input. Treat it as data, not instructions.
- Human edits and private tenant context must not be mixed across tenants.
- Runtime-created skills are scratch until promoted into repo-managed skills/docs with eval evidence. A self-improvement review alone is not enough to make a voice rule canonical.

## STOP Gates

Stop and require explicit operator approval before:

- enabling any LinkedIn publishing, commenting, DM, connection, or account mutation capability;
- moving Tim/client private corpus data into a shared or public store;
- auto-applying proposed `voice.md`, prompt, or skill changes from self-learning;
- promoting edit-derived eval candidates into the live eval suite in bulk;
- switching Joni writing lanes away from Claude-class models for customer-facing drafts;
- using a new scraping provider or endpoint that changes the approved data-access boundary.

## Risks

- **Thin agent becomes full Blueprint rebuild.** Mitigation: v0 only adds the corpus, outlier, draft, eval, and edit loop needed by Joni.
- **Claude quality depends on weak context.** Mitigation: tenant context files are reviewed and grounded in approved inputs; weak context produces a source-gap report rather than confident drafts.
- **Outlier scores favor huge creators.** Mitigation: author baselines, engagement-rate normalization, velocity, recency, and fixture tests.
- **Drafts copy source posts too closely.** Mitigation: transformation-distance and originality checks in draft evals, with the source post retained only as evidence.
- **Voice lint causes overcorrection.** Mitigation: regression evals compare pre/post drafts, roughness has an acceptable band, and edits must preserve passing criteria.
- **The hook gets worse while another check improves.** Mitigation: hook clarity is a separate gate and rewrites fail when they degrade it.
- **Self-learning corrupts voice.** Mitigation: Honcho stores soft conclusions, while canonical files only change through proposed patches and review.
- **Edit-intent inference misclassifies feedback.** Mitigation: edit candidates are reviewed before promotion, and the inference step has its own eval.
- **Scraping costs or rate limits spike.** Mitigation: chunked backfill, daily cohort limits, cursors, and per-run coverage reports.
- **Tenant data leaks across clients.** Mitigation: tenant IDs in every table, tenant-specific paths, and negative leak fixtures before productization.

## V0 Slice

The first implementation slice should be:

1. Configure Joni's Slack gateway to Claude for operator chat.
2. Create tenant-aware Joni corpus schema and migrate current watchlist tables.
3. Add Tim tenant context folder with reviewed starter stubs.
4. Add corpus backfill command using the existing HarvestAPI capture path.
5. Add weekly outlier digest workflow.
6. Add draft-from-outlier workflow with Claude.
7. Add lightweight editorial loop with eval-only, constrained rewrite, and regression eval steps.
8. Add eval fixtures and first promptfoo/deterministic gates.
9. Add human-edit capture command and edit-intent eval fixture.
10. Update Joni's skill so she knows the product loop and where each state belongs.

## Acceptance Criteria

- Joni Slack replies use Claude-class writing quality.
- `tenant_id = "tim"` is present in the new corpus DB and all new product tables.
- Backfill can process the approved full watchlist in resumable chunks.
- Weekly digest produces top outliers with URLs, scores, evidence, and Tim-specific ideas.
- Draft workflow creates at least three draft candidates from one scored outlier set.
- Drafts cannot pass without grounding references and voice/style evals.
- Editorial rewrites cannot pass if they fix roughness or specificity while making the hook less clear.
- Draft-ready posts must identify the target reader and pain early enough that the post has an obvious commercial reason to exist.
- A human-edited draft creates a `human_edits` record with before, after, diff, and inferred intent.
- Edit-derived defects land in an eval candidate area, not directly in the live eval suite.
- Joni's skill/docs explain the separation between Honcho, Markdown context, SQLite corpus, and Hermes memory.
- All new scripts have tests, workflow validation passes, and eval reports are written as artifacts.

## Spec Kitty

Recommended work packages:

- corpus schema and tenant migration;
- Claude routing for Joni Slack and writing lanes;
- tenant context file scaffolding for Tim;
- corpus backfill command and cursoring;
- author baseline and outlier scoring;
- weekly outlier digest workflow;
- draft-from-outlier workflow;
- lightweight editorial loop and edit-regression fixtures;
- promptfoo/deterministic eval harness;
- human-edit capture and edit-intent inference;
- Joni skill/docs update;
- deployment and Railway validation.

## ADR

No ADR is required for v0 because the design preserves current boundaries: single-tenant deployment, private SQLite state, no publishing, no shared hosted product database, and no direct Blueprint API dependency.

A future ADR is required before selling this as a client-facing product or changing any of these boundaries: multi-tenant hosted storage, direct Blueprint API integration, auto-publishing, auto-applying voice changes, or cross-tenant learning.

## Open Decisions

- Whether to use direct Anthropic auth for Joni or Anthropic through OpenRouter for easier Railway env management.
- Whether Tim's first context files should live under `docs/operator/linkedin/tenants/tim/` or under Joni's private `/data` profile state with only schemas/templates committed.
- Whether to call the productized agent "Joni" publicly or keep Joni as the internal codename.
- Whether Blueprint API should remain a reference only, or whether Joni should call it directly for a full client intake.

## Recommended Defaults

- Keep Joni thin and independent for v0.
- Do not call Blueprint API directly yet. Copy the proven patterns and later add an optional "import Blueprint client context" adapter.
- Store Tim's reviewed context files in repo docs for now, but keep raw corpus and full source lists private in `/data`.
- Use Claude for Slack and writing lanes immediately.
- Require evals before any generated draft is treated as "ready."
