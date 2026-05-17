# Joni Editor Loop V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first thin Joni editorial loop: repo-managed voice editor skill, deterministic voice lint/regression checks, and tests that prevent roughness and hook overcorrection.

**Architecture:** Keep the implementation local to Hermes/Joni. A Node CLI scores a post and compares before/after edits; the Joni skill tells the agent how to use that CLI and preserve constraints. This slice does not expand the corpus DB or add multi-agent Fabro batches.

**Tech Stack:** Node.js ESM, `node --test`, Hermes skills Markdown, existing Joni profile install path.

---

### Task 1: Voice Eval CLI Tests

**Files:**
- Create: `scripts/hermes/test-joni-linkedin-voice-eval.mjs`
- Create: `scripts/hermes/joni-linkedin-voice-eval.mjs`

- [x] **Step 1: Write failing tests**

Create tests that assert:

- a good B2B-founder post passes voice lint;
- an over-rough post fails roughness;
- a too-polished long post fails roughness;
- a vague post without target reader and pain fails;
- a constrained rewrite fails if it improves roughness but makes the hook worse.

- [x] **Step 2: Run tests and verify RED**

Run:

```bash
node --test scripts/hermes/test-joni-linkedin-voice-eval.mjs
```

Expected: FAIL because `scripts/hermes/joni-linkedin-voice-eval.mjs` does not exist.

- [x] **Step 3: Implement minimal CLI**

Implement commands:

```bash
node scripts/hermes/joni-linkedin-voice-eval.mjs lint --file <path> --target "B2B founder" --pain "pipeline"
node scripts/hermes/joni-linkedin-voice-eval.mjs compare --before <path> --after <path> --target "B2B founder" --pain "pipeline"
```

The CLI returns JSON with `passes`, `checks`, `hook`, `roughness`, `issues`, and `summary`.

- [x] **Step 4: Run tests and verify GREEN**

Run:

```bash
node --test scripts/hermes/test-joni-linkedin-voice-eval.mjs
```

Expected: PASS.

### Task 2: Repo-Managed Joni Voice Skill

**Files:**
- Create: `hermes/profiles/joni/skills/maestro-linkedin-voice-editor/SKILL.md`
- Modify: `hermes/profiles/joni/skills/linkedin-operator/SKILL.md`
- Modify: `hermes/deploy/railway-gateway/entrypoint.sh`
- Modify: `scripts/hermes/test-specialist-profiles.mjs`

- [x] **Step 1: Write failing profile test**

Update `test-specialist-profiles.mjs` to assert the new voice editor skill exists, references the eval CLI, uses a constraint-preserving editorial loop, and says runtime-created skills are scratch until promoted.

- [x] **Step 2: Run test and verify RED**

Run:

```bash
node --test scripts/hermes/test-specialist-profiles.mjs
```

Expected: FAIL until the skill is created.

- [x] **Step 3: Add skill and operator link**

Create the skill with:

- brief lock;
- draft variants;
- eval-only pass;
- targeted edit plan;
- constrained rewrite;
- regression eval;
- human-edit capture note;
- no-publish boundary.

Update `linkedin-operator` to use the voice editor skill for post drafting and editing. Bind `maestro-linkedin-voice-editor` into the Joni Railway gateway skill list so the Slack runtime loads it.

- [x] **Step 4: Run test and verify GREEN**

Run:

```bash
node --test scripts/hermes/test-specialist-profiles.mjs
```

Expected: PASS.

### Task 3: Verification And Commit

**Files:**
- All files changed in Tasks 1-2.

- [x] **Step 1: Run full relevant tests**

Run:

```bash
node --test scripts/hermes/test-joni-linkedin-voice-eval.mjs scripts/hermes/test-specialist-profiles.mjs scripts/hermes/test-joni-linkedin-workflow.mjs scripts/hermes/test-joni-feed-watchlist.mjs
```

Expected: PASS.

- [x] **Step 2: Run diff check**

Run:

```bash
git diff --check
```

Expected: PASS.

- [x] **Step 3: Commit scoped changes**

Commit only the files in this plan with:

```bash
git add docs/superpowers/plans/2026-05-17-joni-editor-loop-v0.md scripts/hermes/joni-linkedin-voice-eval.mjs scripts/hermes/test-joni-linkedin-voice-eval.mjs scripts/hermes/test-specialist-profiles.mjs hermes/deploy/railway-gateway/entrypoint.sh hermes/profiles/joni/skills/maestro-linkedin-voice-editor/SKILL.md hermes/profiles/joni/skills/linkedin-operator/SKILL.md
git commit -m "feat: add Joni LinkedIn editor loop"
```
