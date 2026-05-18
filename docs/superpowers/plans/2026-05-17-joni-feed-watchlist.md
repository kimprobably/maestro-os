# Joni Feed Watchlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Joni a private SQLite-backed LinkedIn feed watchlist that can select daily sources, capture posts, score performance, and produce AI-reviewed content ideas.

**Architecture:** Add one focused Node CLI for SQLite watchlist management and scoring. Keep HarvestAPI capture in the existing capture script, preserve source IDs through normalized posts, and wire both scripts into the Joni daily Fabro workflow.

**Tech Stack:** Node.js, sqlite3 CLI, Fabro workflow graphs, HarvestAPI profile-posts endpoint, Hermes/Joni prompt review.

---

### Task 1: Watchlist Tests

**Files:**
- Create: `scripts/hermes/test-joni-feed-watchlist.mjs`

- [x] Write tests for CSV import into SQLite.
- [x] Write tests for daily source cohort selection with top and rotating tiers.
- [x] Write tests proving capture output preserves source IDs and scoring produces candidate artifacts.
- [x] Run `node --test scripts/hermes/test-joni-feed-watchlist.mjs` and verify the missing CLI failure before implementing.

### Task 2: Watchlist CLI

**Files:**
- Create: `scripts/hermes/joni-feed-watchlist.mjs`

- [x] Implement `init`.
- [x] Implement `import-csv`.
- [x] Implement `select-sources`.
- [x] Implement `record-posts`.
- [x] Implement `score`.
- [x] Implement `ledger`.
- [x] Keep command output aggregate-only and avoid printing raw source lists.

### Task 3: Capture Metadata

**Files:**
- Modify: `scripts/hermes/joni-linkedin-capture.mjs`

- [x] Preserve `source_id` and `tier` from selected source config into normalized posts.
- [x] Keep HarvestAPI key presence-only and never print secret values.

### Task 4: Workflow Integration

**Files:**
- Modify: `workflows/hermes/joni-linkedin-daily.fabro`
- Modify: `workflows/hermes/joni-linkedin-daily.toml`
- Modify: `prompts/hermes/joni-linkedin-ai-review.md`
- Modify: `scripts/hermes/test-joni-linkedin-workflow.mjs`

- [x] Add DB initialization and source selection nodes before HarvestAPI validation.
- [x] Record snapshots and score candidates after deterministic capture.
- [x] Point Joni's AI prompt at `feed-candidates.md` and require evidence-bound output.
- [x] Add run inputs for feed DB path, source limit, top tier percentage, rotation limit, and candidate limit.

### Task 5: Operator Docs

**Files:**
- Create: `docs/operator/linkedin/JONI-FEED-WATCHLIST.md`
- Modify: `docs/operator/linkedin/JONI-LINKEDIN-LEDGER.md`
- Modify: `hermes/profiles/joni/skills/linkedin-operator/SKILL.md`

- [x] Document storage, import, daily loop, scoring, and output artifacts.
- [x] Update Joni's role boundaries to include private watchlist management.

### Task 6: Verification And Deploy

- [x] Run focused Node tests.
- [x] Run Fabro validation.
- [x] Run workflow-quality verification.
- [x] Import Tim's starter CSV into a private local SQLite DB as a smoke test.
- [ ] Commit the scoped code/docs changes.
- [ ] Push the branch.
- [ ] Deploy the Railway gateway.
- [ ] Upload the private SQLite watchlist DB to the Railway persistent volume.
- [ ] Set `HARVEST_API_KEY` on Railway via stdin.
- [ ] Run a small live capture smoke with a low source limit.
