# iPhone App UX Studio Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Fabro workflow that iterates on an existing iPhone app with serious UI/UX research, Mobbin MCP references, durable competitor screenshot memory, adversarial design options, screenshot evidence, iOS CI, and postmortem learning capture.

**Architecture:** Add a new existing-app workflow next to the current iPhone app factory rather than replacing the build-from-scratch workflow. The workflow starts with remote Railway/Daytona preflight, retrieves or captures competitor references into a private design corpus, runs adversarial design direction fanout, selects a direction by rubric, implements UI changes in the existing app, and proves the result with screenshots, Appium/XCUITest, hosted macOS CI, UX review, and postmortem memory.

**Tech Stack:** Fabro DOT workflows, Daytona sandboxes with explicit network access, Claude Code Mobbin MCP (`https://api.mobbin.com/mcp`), Node.js CLI gates, SQLite local fallback plus optional Neon/Postgres for durable corpus metadata, private object storage for screenshots/videos, existing Hermes/operator ledger, GitHub Actions macOS CI, Appium/XCUITest, Promptfoo.

---

## Workflow Behavior In English

The workflow is for an existing app repo. It receives a repository URL or mounted app directory, app metadata, and a design goal. For WakeTask, the design goal is to make setup calm and trustworthy, wake mode impossible to misunderstand while half-asleep, and completion/accountability satisfying enough to support retention.

The workflow must not jump directly from research to SwiftUI implementation. It must first capture the current app, retrieve existing reference material from the durable design corpus, use Mobbin MCP and other internet sources to fill gaps, synthesize the product opportunity, generate multiple competing visual/interaction directions, adversarially critique those directions, and select one winning direction with an auditable rubric.

The workflow then writes a screen-level UX spec, maps that spec onto the app's real Swift files, implements visual-system and screen-flow changes, captures after screenshots, runs Appium/XCUITest, runs hosted macOS CI, and requires a UX-quality final review. Every run ends with a postmortem that writes learnings back to the durable ledger/corpus so the next run starts smarter.

Competitor screenshots and Mobbin-derived references must be handled as private research artifacts. The generated app repo should contain our own screenshots, reports, and implementation artifacts, not a public mirror of competitor or Mobbin assets.

## Expected Fabro Stage Order

1. `remote_environment_preflight`
2. `existing_app_intake`
3. `baseline_screenshot_capture`
4. `design_corpus_preflight`
5. `retrieve_existing_references`
6. `reference_gap_analysis`
7. `research_fanout`
8. `competitor_flow_research`
9. `app_store_review_mining`
10. `mobbin_mcp_research`
11. `pageflows_research`
12. `apple_hig_research`
13. `behavioral_ux_research`
14. `research_join`
15. `design_opportunity_synthesis`
16. `design_direction_fanout`
17. `calm_accountability_direction`
18. `hard_wake_direction`
19. `gamified_streak_direction`
20. `minimal_native_direction`
21. `design_cross_critique`
22. `design_tournament_consensus`
23. `screen_ux_spec`
24. `implementation_plan_gate`
25. `implement_visual_system`
26. `verify_visual_system`
27. `implement_screen_flows`
28. `verify_screen_flows`
29. `screenshot_evidence_gate`
30. `appium_exploratory_gate`
31. `ios_quality_gate`
32. `final_review_fanout`
33. `ux_quality_review`
34. `product_fidelity_review`
35. `ios_architecture_review`
36. `accessibility_review`
37. `security_privacy_review`
38. `release_readiness_review`
39. `final_consensus`
40. `publish_handoff`
41. `postmortem_learning_capture`

---

### Task 1: Contract Test For Existing-App UX Workflow

**Files:**
- Create: `scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs`
- Modify: `scripts/iphone-app-factory/validate-contract.mjs`
- Test: `scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs`

- [ ] **Step 1: Write the failing workflow contract test**

Create `scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs` with a Node test that reads `workflows/iphone-app-factory/iterate-existing-app-ux.fabro`, `workflows/iphone-app-factory/iterate-existing-app-ux.daytona.toml`, and the new prompt/script files. The test must assert the stage names in "Expected Fabro Stage Order" are present, the workflow has `join_policy="wait_all"` on fanouts, and the TOML includes explicit Daytona network access.

Use this required token list in the test:

```js
const requiredWorkflowTokens = [
  "remote_environment_preflight",
  "existing_app_intake",
  "baseline_screenshot_capture",
  "design_corpus_preflight",
  "retrieve_existing_references",
  "reference_gap_analysis",
  "research_fanout",
  "competitor_flow_research",
  "app_store_review_mining",
  "mobbin_mcp_research",
  "pageflows_research",
  "apple_hig_research",
  "behavioral_ux_research",
  "design_opportunity_synthesis",
  "design_direction_fanout",
  "calm_accountability_direction",
  "hard_wake_direction",
  "gamified_streak_direction",
  "minimal_native_direction",
  "design_cross_critique",
  "design_tournament_consensus",
  "screen_ux_spec",
  "implementation_plan_gate",
  "implement_visual_system",
  "implement_screen_flows",
  "screenshot_evidence_gate",
  "appium_exploratory_gate",
  "ios_quality_gate",
  "ux_quality_review",
  "accessibility_review",
  "postmortem_learning_capture",
];
```

- [ ] **Step 2: Run the failing contract test**

Run:

```bash
node --test scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs
```

Expected: FAIL because `iterate-existing-app-ux.fabro` does not exist yet.

- [ ] **Step 3: Wire the new test into the existing validator**

Modify `scripts/iphone-app-factory/validate-contract.mjs` so it also verifies the new UX studio workflow once the workflow file exists. Keep the original iPhone app factory contract checks unchanged.

- [ ] **Step 4: Confirm the original workflow contract still passes**

Run:

```bash
node scripts/iphone-app-factory/validate-contract.mjs
```

Expected: PASS for the existing `build-iphone-app.fabro` checks.

### Task 2: Remote Environment And Mobbin MCP Preflight

**Files:**
- Create: `scripts/iphone-app-factory/ux-studio-preflight.mjs`
- Create: `scripts/iphone-app-factory/test-ux-studio-preflight.mjs`
- Modify: `sandbox/bootstrap-agent-auth.sh`
- Modify: `workflows/fabro/daytona-environment-smoke.fabro`
- Test: `scripts/iphone-app-factory/test-ux-studio-preflight.mjs`

- [ ] **Step 1: Write failing preflight tests**

Create `scripts/iphone-app-factory/test-ux-studio-preflight.mjs` with tests for:

- `--skip-network` mode validates required env presence without printing values.
- missing `MOBBIN_EMAIL` reports only the key name.
- `GITHUB_TOKEN` or `GH_TOKEN` satisfies the GitHub credential group.
- `CLAUDE_CODE_OAUTH_TOKEN` or `CLAUDE_CODE_CREDENTIALS_JSON_BASE64` satisfies the Claude credential group.
- local Fabro URL fails unless `--allow-local` is provided.
- generated report includes `mobbin_mcp_configured` and `mobbin_mcp_authorized` booleans, never credentials.

Run:

```bash
node --test scripts/iphone-app-factory/test-ux-studio-preflight.mjs
```

Expected: FAIL because the preflight script does not exist.

- [ ] **Step 2: Implement UX studio preflight**

Create `scripts/iphone-app-factory/ux-studio-preflight.mjs`. It must write `.workflow/iphone-app-ux-studio/preflight.json` and print only redacted status.

Inputs:

```bash
node scripts/iphone-app-factory/ux-studio-preflight.mjs \
  --server "$FABRO_SERVER" \
  --expected-control-plane railway \
  --use-mobbin-mcp true
```

Required checks:

- Fabro server is Railway unless `--allow-local` is set.
- Current branch has an upstream unless `--skip-git` is set.
- Required env groups are present:
  - `OPENROUTER_API_KEY`
  - `APIFY_TOKEN`
  - `GITHUB_TOKEN` or `GH_TOKEN`
  - `CLAUDE_CODE_OAUTH_TOKEN` or `CLAUDE_CODE_CREDENTIALS_JSON_BASE64`
  - `CODEX_AUTH_JSON_BASE64`
  - `MOBBIN_EMAIL`
  - `MOBBIN_PASSWORD`
- Required tools are present:
  - `node`
  - `npm`
  - `gh`
  - `fabro`
  - `codex`
  - `claude`
  - `promptfoo`
  - `qlty`
- Required network targets are reachable unless `--skip-network` is set:
  - `https://api.github.com/rate_limit`
  - `https://apps.apple.com/`
  - `https://developer.apple.com/design/human-interface-guidelines/`
  - `https://mobbin.com/mcp`
  - `https://api.mobbin.com/mcp`
  - `https://pageflows.com/`
  - `https://www.reddit.com/`

- [ ] **Step 3: Add Mobbin MCP configuration support to CLI auth bootstrap**

Modify `sandbox/bootstrap-agent-auth.sh` so `install` mode attempts to configure Mobbin MCP for Claude Code when `claude` is available:

```sh
configure_mobbin_mcp() {
  if ! need_command claude; then
    warn "claude is missing; cannot configure Mobbin MCP"
    return 0
  fi
  if claude mcp list 2>/dev/null | grep -qi 'mobbin'; then
    log "mobbin_mcp=configured"
    return 0
  fi
  claude mcp add mobbin --transport http https://api.mobbin.com/mcp >/dev/null 2>&1 || {
    warn "Mobbin MCP registration failed; run: claude mcp add mobbin --transport http https://api.mobbin.com/mcp"
    return 0
  }
  log "mobbin_mcp=configured"
}
```

Call this after Claude credentials are installed and before the Claude probe. Do not force interactive Mobbin OAuth in non-interactive runs. The preflight should report `mobbin_mcp_authorized=false` when configured but not authorized.

- [ ] **Step 4: Strengthen Daytona network smoke**

Modify `workflows/fabro/daytona-environment-smoke.fabro` to include the Mobbin MCP and design-research network probes in its tool run list. The smoke report must print URL status only, not credentials or cookies.

- [ ] **Step 5: Verify preflight tests**

Run:

```bash
node --test scripts/iphone-app-factory/test-ux-studio-preflight.mjs
sh -n sandbox/bootstrap-agent-auth.sh
```

Expected: PASS.

### Task 3: Private Design Corpus Schema And CLI

**Files:**
- Create: `hermes/design-corpus/schema.sql`
- Create: `hermes/design-corpus/README.md`
- Create: `scripts/iphone-app-factory/design-corpus.mjs`
- Create: `scripts/iphone-app-factory/test-design-corpus.mjs`
- Test: `scripts/iphone-app-factory/test-design-corpus.mjs`

- [ ] **Step 1: Write failing design corpus tests**

Create `scripts/iphone-app-factory/test-design-corpus.mjs` with tests for:

- `init` creates all tables in a temporary SQLite database.
- `upsert-source` records a competitor/source without duplicate rows.
- `add-asset` stores a private asset metadata row with `sha256`, `source_policy`, and `storage_key`.
- `add-observation` stores derived notes without requiring raw screenshot storage.
- `reference-pack` returns matching references by app domain, screen type, and tags.
- Mobbin references can be stored as source IDs/URLs/notes with `raw_asset_allowed=false`.

Run:

```bash
node --test scripts/iphone-app-factory/test-design-corpus.mjs
```

Expected: FAIL because the corpus CLI does not exist.

- [ ] **Step 2: Add schema**

Create `hermes/design-corpus/schema.sql` with these tables:

```sql
CREATE TABLE IF NOT EXISTS design_sources (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  app_name TEXT,
  app_store_id TEXT,
  bundle_id TEXT,
  source_policy TEXT NOT NULL,
  raw_asset_allowed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS design_assets (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES design_sources(id),
  asset_type TEXT NOT NULL,
  screen_type TEXT NOT NULL,
  flow_name TEXT,
  flow_step INTEGER,
  storage_provider TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  perceptual_hash TEXT,
  width INTEGER,
  height INTEGER,
  captured_at TEXT NOT NULL,
  private_only INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS design_observations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES design_sources(id),
  asset_id TEXT REFERENCES design_assets(id),
  app_domain TEXT NOT NULL,
  screen_type TEXT NOT NULL,
  observation_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  what_to_adapt TEXT NOT NULL,
  what_not_to_copy TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS design_reference_packs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  app_domain TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  query_json TEXT NOT NULL,
  observation_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 3: Implement corpus CLI**

Create `scripts/iphone-app-factory/design-corpus.mjs` with commands:

```bash
node scripts/iphone-app-factory/design-corpus.mjs init --db hermes/design-corpus/design-corpus.sqlite
node scripts/iphone-app-factory/design-corpus.mjs upsert-source --source-type mobbin --source-name Alarmy --source-url https://mobbin.com/... --source-policy reference-only --raw-asset-allowed false
node scripts/iphone-app-factory/design-corpus.mjs add-asset --source-id src_alarmy --asset-type screenshot --screen-type active_alarm --storage-key s3://private/path.png --sha256 abc123 --captured-at 2026-05-16T00:00:00Z
node scripts/iphone-app-factory/design-corpus.mjs add-observation --source-id src_alarmy --app-domain alarm_clock --screen-type active_alarm --observation-type interaction-pattern --summary "Large single action and high contrast hierarchy" --what-to-adapt "Use oversized confirm/progress targets in wake mode" --what-not-to-copy "Do not reproduce Alarmy's layout, copy, colors, or proprietary assets" --tags '["wake-mode","high-friction"]'
node scripts/iphone-app-factory/design-corpus.mjs reference-pack --run-id run_123 --app-domain alarm_clock --screen-type active_alarm --tags wake-mode,high-friction
```

Default to SQLite at `hermes/design-corpus/design-corpus.sqlite`. Add `DESIGN_CORPUS_DATABASE_URL` support for Neon/Postgres as a separate adapter only after SQLite tests pass; the first implementation may write a clear failure saying Postgres support is not enabled when that URL is provided.

- [ ] **Step 4: Document storage policy**

Create `hermes/design-corpus/README.md` stating:

- Competitor/Mobbin screenshots are private research artifacts.
- Mobbin references should prefer MCP IDs, URLs, titles, tags, and derived notes.
- Raw Mobbin screenshots are not stored unless the plan/source policy explicitly allows it.
- App repo artifacts should include our own screenshots, not competitor libraries.
- Object storage is private by default.
- `what_to_adapt` and `what_not_to_copy` are required for every observation.

- [ ] **Step 5: Verify corpus tests**

Run:

```bash
node --test scripts/iphone-app-factory/test-design-corpus.mjs
```

Expected: PASS.

### Task 4: Reference Retrieval, Gap Analysis, And Research Gates

**Files:**
- Create: `scripts/iphone-app-factory/reference-pack-gate.mjs`
- Create: `scripts/iphone-app-factory/test-reference-pack-gate.mjs`
- Create: `prompts/iphone-app-factory/ux-existing-app-intake.md`
- Create: `prompts/iphone-app-factory/ux-competitor-flow-research.md`
- Create: `prompts/iphone-app-factory/ux-mobbin-mcp-research.md`
- Create: `prompts/iphone-app-factory/ux-pageflows-research.md`
- Create: `prompts/iphone-app-factory/ux-apple-hig-research.md`
- Create: `prompts/iphone-app-factory/ux-behavioral-research.md`
- Create: `prompts/iphone-app-factory/ux-design-opportunity-synthesis.md`
- Test: `scripts/iphone-app-factory/test-reference-pack-gate.mjs`

- [ ] **Step 1: Write failing reference pack gate tests**

Create `scripts/iphone-app-factory/test-reference-pack-gate.mjs`. It must create fixture files under a temp `.workflow/iphone-app-ux-studio/research` directory and assert the gate fails unless all required artifacts exist:

- `existing-app-intake.md`
- `reference-gap-analysis.json`
- `competitor-flows.md`
- `app-store-review-mining.md`
- `mobbin-mcp-research.md`
- `pageflows-research.md`
- `apple-hig-research.md`
- `behavioral-ux-research.md`
- `design-opportunity-synthesis.md`
- `reference-pack.json`

Run:

```bash
node --test scripts/iphone-app-factory/test-reference-pack-gate.mjs
```

Expected: FAIL because the gate does not exist.

- [ ] **Step 2: Implement reference pack gate**

Create `scripts/iphone-app-factory/reference-pack-gate.mjs`. The gate should parse `reference-pack.json` and require:

- at least 12 total references,
- at least 4 competitor flow references,
- at least 4 Mobbin or Page Flows references when `use_mobbin_mcp=true`,
- at least 5 screen types,
- every observation includes `what_to_adapt` and `what_not_to_copy`,
- every raw asset has `private_only=true`,
- no credential-looking values in reports.

- [ ] **Step 3: Write existing app intake prompt**

Create `prompts/iphone-app-factory/ux-existing-app-intake.md`. It must instruct the agent to read the app repo, identify current screens/navigation/design-system usage, and write `.workflow/iphone-app-ux-studio/research/existing-app-intake.md`. It must explicitly prohibit rebuilding auth, payments, storage, networking, localization, settings, and the design system unless a later ADR approves it.

- [ ] **Step 4: Write research prompts**

Create the five research prompts listed in the Files section. Each prompt must require:

- structured headings,
- source list,
- source policy,
- `what_to_adapt`,
- `what_not_to_copy`,
- no secret output,
- no cloning proprietary screens,
- write to its specific `.workflow/iphone-app-ux-studio/research/*.md` artifact.

The Mobbin prompt must use official Mobbin MCP when available. The fallback is Mobbin web login through native email/password only, then non-Mobbin public references if MCP/login is unavailable.

- [ ] **Step 5: Write synthesis prompt**

Create `prompts/iphone-app-factory/ux-design-opportunity-synthesis.md`. It must synthesize:

- current app weaknesses,
- strongest competitor patterns,
- App Store review pains,
- Mobbin/Page Flows patterns,
- Apple HIG constraints,
- behavioral UX constraints,
- top screens to redesign,
- visual principles,
- anti-patterns to avoid.

For WakeTask-like alarm apps, it must explicitly evaluate calm setup mode, urgent wake mode, and reward/accountability mode.

- [ ] **Step 6: Verify research gate tests**

Run:

```bash
node --test scripts/iphone-app-factory/test-reference-pack-gate.mjs
```

Expected: PASS.

### Task 5: Baseline And After Screenshot Evidence Gates

**Files:**
- Create: `scripts/iphone-app-factory/ios-screenshot-manifest-gate.mjs`
- Create: `scripts/iphone-app-factory/test-ios-screenshot-manifest-gate.mjs`
- Create: `prompts/iphone-app-factory/ux-baseline-screenshot-capture.md`
- Create: `prompts/iphone-app-factory/ux-screenshot-evidence-review.md`
- Test: `scripts/iphone-app-factory/test-ios-screenshot-manifest-gate.mjs`

- [ ] **Step 1: Write failing screenshot manifest tests**

Create `scripts/iphone-app-factory/test-ios-screenshot-manifest-gate.mjs`. It must validate a fixture manifest at `reports/ios/screenshots/manifest.json` and fail when:

- required screens are missing,
- an image path is missing,
- width or height is zero,
- `blank_score` is too high,
- `text_clipping_risk` is true,
- no before/after pair exists for a redesigned screen.

Required screen keys:

```json
[
  "onboarding",
  "home",
  "primary_list",
  "create_or_edit",
  "active_task",
  "completion",
  "profile_or_settings",
  "paywall_or_subscription"
]
```

- [ ] **Step 2: Run the failing screenshot test**

Run:

```bash
node --test scripts/iphone-app-factory/test-ios-screenshot-manifest-gate.mjs
```

Expected: FAIL because the manifest gate does not exist.

- [ ] **Step 3: Implement screenshot manifest gate**

Create `scripts/iphone-app-factory/ios-screenshot-manifest-gate.mjs`. It should accept:

```bash
node scripts/iphone-app-factory/ios-screenshot-manifest-gate.mjs \
  --manifest reports/ios/screenshots/manifest.json \
  --phase after \
  --require-before-after true
```

The gate validates JSON only. The actual screenshot capture can happen through XCUITest/Appium/GitHub Actions, but every capture mechanism must write the same manifest shape.

- [ ] **Step 4: Write screenshot prompts**

Create:

- `prompts/iphone-app-factory/ux-baseline-screenshot-capture.md`
- `prompts/iphone-app-factory/ux-screenshot-evidence-review.md`

The baseline prompt must capture the current app before redesign. The evidence review prompt must compare before/after screenshots and reject blank screens, clipped text, overlapping controls, missing states, or an active-task screen that is not visually distinct from setup screens.

- [ ] **Step 5: Verify screenshot tests**

Run:

```bash
node --test scripts/iphone-app-factory/test-ios-screenshot-manifest-gate.mjs
```

Expected: PASS.

### Task 6: Adversarial Design Tournament Prompts And Gates

**Files:**
- Create: `scripts/iphone-app-factory/design-tournament-gate.mjs`
- Create: `scripts/iphone-app-factory/test-design-tournament-gate.mjs`
- Create: `prompts/iphone-app-factory/ux-design-direction-candidate.md`
- Create: `prompts/iphone-app-factory/ux-design-cross-critique.md`
- Create: `prompts/iphone-app-factory/ux-design-tournament-consensus.md`
- Create: `prompts/iphone-app-factory/ux-screen-spec.md`
- Test: `scripts/iphone-app-factory/test-design-tournament-gate.mjs`

- [ ] **Step 1: Write failing tournament gate tests**

Create `scripts/iphone-app-factory/test-design-tournament-gate.mjs`. It should validate `.workflow/iphone-app-ux-studio/design/tournament-consensus.json` and fail unless:

- at least three design directions were considered,
- each direction has scores for `differentiation`, `native_ios_quality`, `wake_state_usability`, `conversion_potential`, `accessibility`, `implementation_risk`, and `visual_distinctiveness`,
- a winner is selected,
- rejected directions have rejection reasons,
- selected direction includes screen-level implications,
- consensus includes a no-clone statement.

- [ ] **Step 2: Run the failing tournament test**

Run:

```bash
node --test scripts/iphone-app-factory/test-design-tournament-gate.mjs
```

Expected: FAIL because the gate does not exist.

- [ ] **Step 3: Implement tournament gate**

Create `scripts/iphone-app-factory/design-tournament-gate.mjs`. It should parse the consensus JSON, check the requirements above, and write `.workflow/iphone-app-ux-studio/design/tournament-gate.json`.

- [ ] **Step 4: Write design direction candidate prompt**

Create `prompts/iphone-app-factory/ux-design-direction-candidate.md`. The same prompt is used by multiple agents with different labels:

- `calm_accountability_direction`
- `hard_wake_direction`
- `gamified_streak_direction`
- `minimal_native_direction`

Each agent must write a Markdown direction and a JSON summary with:

- target emotion,
- visual principles,
- colors/tokens,
- typography,
- motion,
- screen-by-screen implications,
- monetization implications,
- accessibility risks,
- implementation risks.

- [ ] **Step 5: Write critique and consensus prompts**

Create:

- `prompts/iphone-app-factory/ux-design-cross-critique.md`
- `prompts/iphone-app-factory/ux-design-tournament-consensus.md`

Critic roles:

- half-asleep usability critic,
- premium iOS critic,
- conversion critic,
- accessibility critic,
- anti-clone critic,
- implementation risk critic.

The consensus prompt must produce both `.workflow/iphone-app-ux-studio/design/tournament-consensus.md` and `.workflow/iphone-app-ux-studio/design/tournament-consensus.json`.

- [ ] **Step 6: Write screen UX spec prompt**

Create `prompts/iphone-app-factory/ux-screen-spec.md`. It must turn the winning direction into per-screen implementation specs:

- onboarding,
- home,
- primary list,
- create/edit,
- active task,
- completion,
- history/streaks,
- profile/settings,
- paywall/subscription.

Each screen must include purpose, hierarchy, primary action, secondary actions, empty/loading/error states, copy direction, accessibility requirements, and screenshot acceptance criteria.

- [ ] **Step 7: Verify tournament tests**

Run:

```bash
node --test scripts/iphone-app-factory/test-design-tournament-gate.mjs
```

Expected: PASS.

### Task 7: Existing-App UI Implementation Prompts And Phase Gates

**Files:**
- Create: `prompts/iphone-app-factory/ux-implementation-plan.md`
- Create: `prompts/iphone-app-factory/ux-implement-visual-system.md`
- Create: `prompts/iphone-app-factory/ux-implement-screen-flows.md`
- Create: `prompts/iphone-app-factory/ux-review-ux-quality.md`
- Modify: `scripts/iphone-app-factory/phase-evidence-gate.mjs`
- Test: existing phase evidence tests plus workflow contract test

- [ ] **Step 1: Write implementation plan prompt**

Create `prompts/iphone-app-factory/ux-implementation-plan.md`. It must map the screen UX spec to exact files in the existing app repo. It must require:

- file list,
- expected SwiftUI components,
- tests to update,
- screenshot states to capture,
- Appium identifier changes,
- explicit non-goals.

Non-goals must include:

- no auth rebuild,
- no payment rebuild,
- no networking/storage rewrite,
- no bundle ID changes,
- no copied competitor assets.

- [ ] **Step 2: Write visual system implementation prompt**

Create `prompts/iphone-app-factory/ux-implement-visual-system.md`. It should focus on:

- design tokens,
- reusable WakeTask or app-specific SwiftUI components,
- theme colors,
- typography wrappers,
- cards/rows/progress components,
- Dynamic Type,
- VoiceOver labels.

It must write `.workflow/iphone-app-ux-studio/evidence/visual-system.md`.

- [ ] **Step 3: Write screen flow implementation prompt**

Create `prompts/iphone-app-factory/ux-implement-screen-flows.md`. It should implement the selected direction across the screen specs and preserve existing app behavior. It must write `.workflow/iphone-app-ux-studio/evidence/screen-flows.md`.

- [ ] **Step 4: Write UX quality review prompt**

Create `prompts/iphone-app-factory/ux-review-ux-quality.md`. It must reject when:

- the UI is mostly generic `List`/`Form` boilerplate without justified native intent,
- the active task/wake state is visually too calm,
- setup mode feels chaotic,
- completion/accountability is missing,
- screenshot evidence is missing,
- Mobbin/competitor references were copied rather than abstracted,
- text clips or controls overlap.

- [ ] **Step 5: Extend phase evidence gate for UX phases**

Modify `scripts/iphone-app-factory/phase-evidence-gate.mjs` so it accepts `visual-system` and `screen-flows` phases with evidence files under `.workflow/iphone-app-ux-studio/evidence/`.

- [ ] **Step 6: Run phase and contract tests**

Run:

```bash
node --test scripts/iphone-app-factory/phase-and-bootstrap.test.mjs
node --test scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs
```

Expected: PASS after the workflow exists.

### Task 8: Materialize The Fabro Workflow And Daytona Config

**Files:**
- Create: `workflows/iphone-app-factory/iterate-existing-app-ux.fabro`
- Create: `workflows/iphone-app-factory/iterate-existing-app-ux.daytona.toml`
- Create: `workflows/iphone-app-factory/iterate-existing-app-ux.waketask.toml`
- Modify: `scripts/iphone-app-factory/create-run-config.mjs`
- Test: `scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs`

- [ ] **Step 1: Create the workflow graph**

Create `workflows/iphone-app-factory/iterate-existing-app-ux.fabro` using the stage order in this plan. Reuse the model stylesheet pattern from `build-iphone-app.fabro`, with these additions:

- `.ux_research`
- `.design`
- `.critique`
- `.coding`
- `.macos`
- `.review`
- `.security`

Use `join_policy="wait_all"` on research, design direction, and final review fanouts. Use retry routes that send:

- environment failures back to `remote_environment_preflight`,
- weak research back to `research_fanout`,
- weak design back to `design_direction_fanout`,
- weak screen spec back to `screen_ux_spec`,
- UI implementation failures back to `implement_visual_system` or `implement_screen_flows`,
- screenshot failures back to `implement_screen_flows`,
- Appium failures back to `implement_screen_flows`,
- CI failures back to the implementation phase that caused them.

- [ ] **Step 2: Create Daytona TOML**

Create `workflows/iphone-app-factory/iterate-existing-app-ux.daytona.toml` with inputs:

```toml
[run.inputs]
repo_url = "https://github.com/kimprobably/waketask-ios.git"
base_branch = "main"
run_branch = "ux-studio/{{ run.id }}"
app_name = "WakeTask"
bundle_id = "com.keen.waketask"
app_dir = "."
app_domain = "alarm_clock"
target_audience = "US consumer iPhone users who struggle to wake up reliably"
design_goal = "Make setup calm and trustworthy, wake mode impossible to misunderstand while half-asleep, and completion/accountability satisfying enough to support retention."
max_competitors = "12"
use_mobbin_mcp = "true"
use_design_corpus = "true"
design_corpus_write_mode = "private"
selected_direction_mode = "automatic"
ios_validation_mode = "github"
allow_macos_deferred = "false"
```

Include explicit network:

```toml
[run.sandbox.daytona]
auto_stop_interval = 30
network = "allow_all"
```

Include env references for Fabro, GitHub, OpenRouter, agent auth, Mobbin, and optional design corpus storage. Do not include literal secret values.

- [ ] **Step 3: Create WakeTask rehearsal TOML**

Create `workflows/iphone-app-factory/iterate-existing-app-ux.waketask.toml` as a concrete run config for WakeTask. It should point at the WakeTask GitHub repo and use the design goal above.

- [ ] **Step 4: Extend run config generator**

Modify `scripts/iphone-app-factory/create-run-config.mjs` to accept:

```bash
--mode ux-iteration
--repo-url
--base-branch
--run-branch
--app-domain
--design-goal
--use-mobbin-mcp
--use-design-corpus
--selected-direction-mode
```

When `--mode ux-iteration` is used, it writes a TOML whose graph is `iterate-existing-app-ux.fabro`.

- [ ] **Step 5: Verify workflow contract**

Run:

```bash
node --test scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs
node scripts/iphone-app-factory/validate-contract.mjs
```

Expected: PASS.

### Task 9: Prompt Registry And Promptfoo Hardening

**Files:**
- Modify: `evals/iphone-app-factory/prompt-registry.json`
- Modify: `evals/iphone-app-factory/prompt-quality.yaml`
- Modify: `evals/iphone-app-factory/datasets/prompt-quality-golden.jsonl`
- Test: `scripts/iphone-app-factory/test-promptfoo-prompt-quality.mjs`

- [ ] **Step 1: Register new UX prompts**

Add every new `ux-*.md` prompt to `evals/iphone-app-factory/prompt-registry.json`. Required markers must cover:

- no secret output,
- Mobbin MCP preferred,
- no proprietary cloning,
- structured artifact path,
- `what_to_adapt`,
- `what_not_to_copy`,
- screenshot evidence,
- adversarial critique,
- postmortem learning capture.

- [ ] **Step 2: Add UX golden cases**

Extend `evals/iphone-app-factory/datasets/prompt-quality-golden.jsonl` with cases:

- `ux-existing-app-intake`
- `ux-mobbin-mcp-safe`
- `ux-design-tournament`
- `ux-screenshot-evidence`
- `ux-postmortem-learning`

- [ ] **Step 3: Strengthen Promptfoo config**

Modify `evals/iphone-app-factory/prompt-quality.yaml` so the output schema requires structured JSON fields for UX cases:

```json
{
  "covered": ["mobbin_mcp", "design_corpus", "adversarial_design", "screenshots", "accessibility", "postmortem"],
  "risks": [],
  "required_artifacts": []
}
```

- [ ] **Step 4: Run prompt quality tests**

Run:

```bash
node --test scripts/iphone-app-factory/test-promptfoo-prompt-quality.mjs
node scripts/iphone-app-factory/promptfoo-prompt-quality.mjs \
  --config evals/iphone-app-factory/prompt-quality.yaml \
  --registry evals/iphone-app-factory/prompt-registry.json \
  --out .workflow/iphone-app-factory/evals/prompt-quality.json \
  --allow-fallback true \
  --accepted-risk-promptfoo-failure false
```

Expected: PASS.

### Task 10: Documentation, Runbook, And Postmortem Learning Capture

**Files:**
- Create: `docs/IPHONE-APP-UX-STUDIO-WORKFLOW.md`
- Create: `prompts/iphone-app-factory/ux-postmortem-learning-capture.md`
- Create: `scripts/iphone-app-factory/ux-postmortem-gate.mjs`
- Create: `scripts/iphone-app-factory/test-ux-postmortem-gate.mjs`
- Modify: `docs/IPHONE-APP-FACTORY-WORKFLOW.md`
- Test: `scripts/iphone-app-factory/test-ux-postmortem-gate.mjs`

- [ ] **Step 1: Write failing postmortem gate tests**

Create `scripts/iphone-app-factory/test-ux-postmortem-gate.mjs` requiring `.workflow/iphone-app-ux-studio/postmortem.md` to include:

- run summary,
- what worked,
- what failed,
- where agents needed steering,
- gate effectiveness,
- prompt improvements,
- workflow improvements,
- design corpus additions,
- next-run recommendations.

- [ ] **Step 2: Implement postmortem gate**

Create `scripts/iphone-app-factory/ux-postmortem-gate.mjs`. It validates required sections and writes `.workflow/iphone-app-ux-studio/postmortem-gate.json`.

- [ ] **Step 3: Write postmortem prompt**

Create `prompts/iphone-app-factory/ux-postmortem-learning-capture.md`. It must instruct the agent to:

- inspect Fabro run events,
- inspect research/design/implementation/CI artifacts,
- classify failures,
- identify reusable learnings,
- update Hermes/operator ledger through the existing CLI when available,
- update design corpus observations when useful,
- avoid secret output.

- [ ] **Step 4: Write UX studio workflow docs**

Create `docs/IPHONE-APP-UX-STUDIO-WORKFLOW.md` documenting:

- purpose,
- when to use instead of `build-iphone-app`,
- Mobbin MCP setup,
- private design corpus policy,
- remote Railway/Daytona requirements,
- expected artifacts,
- WakeTask rehearsal command,
- troubleshooting.

- [ ] **Step 5: Link docs from factory docs**

Modify `docs/IPHONE-APP-FACTORY-WORKFLOW.md` to point existing-app UI iteration work to `docs/IPHONE-APP-UX-STUDIO-WORKFLOW.md`.

- [ ] **Step 6: Verify postmortem tests**

Run:

```bash
node --test scripts/iphone-app-factory/test-ux-postmortem-gate.mjs
```

Expected: PASS.

### Task 11: End-To-End Rehearsal Against WakeTask

**Files:**
- Modify only files required by failed gates during rehearsal.
- Runtime artifacts: `.workflow/iphone-app-ux-studio/**`, `reports/ios/**`

- [ ] **Step 1: Run local static validation**

Run:

```bash
node --test \
  scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs \
  scripts/iphone-app-factory/test-ux-studio-preflight.mjs \
  scripts/iphone-app-factory/test-design-corpus.mjs \
  scripts/iphone-app-factory/test-reference-pack-gate.mjs \
  scripts/iphone-app-factory/test-ios-screenshot-manifest-gate.mjs \
  scripts/iphone-app-factory/test-design-tournament-gate.mjs \
  scripts/iphone-app-factory/test-ux-postmortem-gate.mjs
```

Expected: PASS.

- [ ] **Step 2: Run remote preflight for Railway**

Run:

```bash
node scripts/iphone-app-factory/ux-studio-preflight.mjs \
  --server "${FABRO_SERVER:-https://fabro-maestro-production.up.railway.app/api/v1}" \
  --expected-control-plane railway \
  --use-mobbin-mcp true
```

Expected: PASS with presence-only env checks and no secret values.

- [ ] **Step 3: Generate WakeTask UX iteration config**

Run:

```bash
node scripts/iphone-app-factory/create-run-config.mjs \
  --mode ux-iteration \
  --repo-url https://github.com/kimprobably/waketask-ios.git \
  --base-branch main \
  --run-branch ux-studio/waketask-ui \
  --app-name WakeTask \
  --bundle-id com.keen.waketask \
  --app-dir . \
  --app-domain alarm_clock \
  --target-audience "US consumer iPhone users who struggle to wake up reliably" \
  --design-goal "Make setup calm and trustworthy, wake mode impossible to misunderstand while half-asleep, and completion/accountability satisfying enough to support retention." \
  --use-mobbin-mcp true \
  --use-design-corpus true \
  --selected-direction-mode automatic \
  --out workflows/iphone-app-factory/runs/waketask-ux-studio.railway.toml
```

Expected: writes a run-specific TOML with `network = "allow_all"` and no literal secrets.

- [ ] **Step 4: Launch against Railway Fabro**

Run from a clean pushed branch:

```bash
fabro run workflows/iphone-app-factory/runs/waketask-ux-studio.railway.toml
```

Expected: run appears in Railway Fabro UI, not only local Fabro.

- [ ] **Step 5: Babysit into Hermes/operator ledger**

Run:

```bash
node scripts/fabro/babysit-run.mjs --server "$FABRO_SERVER" --run-id "$FABRO_RUN_ID" --ledger-home hermes
```

Expected: Fabro run events are recorded, failures are classified, and next actions are summarized without secret output.

- [ ] **Step 6: Verify final evidence**

Require final handoff to include:

- selected design direction,
- rejected directions and reasons,
- before screenshots,
- after screenshots,
- screenshot manifest,
- Appium/XCUITest report,
- GitHub Actions run ID,
- commit SHA,
- artifact names,
- UX quality review,
- postmortem.

### Task 12: Self-Review Checklist

**Files:**
- This plan file.

- [ ] **Step 1: Verify spec coverage**

Confirm the plan covers:

- Mobbin MCP installation/configuration,
- internet access preflight,
- Railway Fabro enforcement,
- private competitor screenshot storage,
- durable metadata corpus,
- adversarial design fanout,
- UX critique,
- screenshot evidence,
- iOS/Appium quality,
- postmortem learning feedback.

- [ ] **Step 2: Scan for placeholders**

Run:

```bash
node - <<'NODE'
const fs = require("fs");
const path = "docs/superpowers/plans/2026-05-16-iphone-app-ux-studio-workflow.md";
const body = fs.readFileSync(path, "utf8");
const banned = ["T" + "BD", "TO" + "DO", "implement " + "later", "fill in " + "details", "as " + "appropriate", "as " + "needed"];
const failures = banned.filter((text) => body.includes(text));
if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true }));
NODE
```

Expected: `{"ok":true}`.

- [ ] **Step 3: Confirm exact paths are present**

Run:

```bash
rg -n "workflows/iphone-app-factory/iterate-existing-app-ux|scripts/iphone-app-factory/ux-studio|hermes/design-corpus|prompts/iphone-app-factory/ux-" docs/superpowers/plans/2026-05-16-iphone-app-ux-studio-workflow.md
```

Expected: matches for workflow, scripts, corpus, and prompts.
