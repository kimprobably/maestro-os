# Eval Operating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Fabro/Promptfoo/Hermes evals into a centralized, self-reinforcing operating system where every model call, workflow stage, end-to-end function, and eval itself has executable evidence.

**Architecture:** Keep Promptfoo as one eval runner, not the source of truth. Add a repo-pinned eval registry, normalized result contract, Fabro artifact collector, coverage enforcement scripts, and Quincy workflow rules so Railway/Fabro runs produce a durable eval ledger/index.

**Tech Stack:** Node.js ESM scripts, Promptfoo, Fabro workflow artifacts, JSON/YAML registry files, existing Postgres eval tables, Hermes profile/skill docs, `node --test`.

---

## File Structure

Create these files:

- `docs/operator/specs/active/eval-operating-system-v0.md`: Doctrine/spec for the eval pyramid, lifecycle, waivers, fallback semantics, and Quincy/workflow-builder obligations.
- `evals/registry.yaml`: Central list of all known evals and coverage subjects.
- `evals/registry.schema.json`: Machine-readable registry contract.
- `evals/result.schema.json`: Machine-readable normalized result contract.
- `scripts/evals/eval-lib.mjs`: Shared registry loading, YAML parsing, hashing, result normalization, and artifact scanning helpers.
- `scripts/evals/test-registry-contract.mjs`: Tests for registry validity and seed coverage.
- `scripts/evals/validate-registry.mjs`: CLI validator for the eval registry.
- `scripts/evals/test-result-normalizer.mjs`: Tests for normalized result semantics, especially fallback masking.
- `scripts/evals/evaluate-call-artifact.mjs`: Deterministic call-level evaluator for Codex/model-call artifacts.
- `scripts/evals/test-call-artifact-eval.mjs`: Tests for call-level eval behavior.
- `scripts/evals/collect-index.mjs`: Collector that builds `reports/eval-index.json` from registry entries and local/Fabro artifacts.
- `scripts/evals/test-collect-index.mjs`: Tests for collector behavior.
- `scripts/evals/verify-workflow-eval-coverage.mjs`: Fails when `.fabro` workflows introduce AI calls or stages without registry coverage.
- `scripts/evals/test-workflow-eval-coverage.mjs`: Tests for coverage enforcement.
- `scripts/evals/render-dashboard.mjs`: Renders a lightweight dashboard markdown file from the eval index.
- `db/migrations/006_eval_ledger.sql`: Extends eval storage for Fabro lineage, normalized results, waivers, and meta-eval links.
- `docs/operator/evals/EVAL-OPERATING-RUNBOOK.md`: Human/operator runbook for local, Railway, and Quincy usage.

Modify these files:

- `package.json`: Add focused eval scripts.
- `scripts/iphone-app-factory/run-codex-prompt.mjs`: Require or accept `--eval-id`, run call artifact evaluation, and write normalized eval results.
- `scripts/iphone-app-factory/promptfoo-prompt-quality.mjs`: Normalize Promptfoo/fallback states so fallback does not erase Promptfoo failure.
- `scripts/app-feedback/promptfoo-workflow-quality.mjs`: Emit normalized result records.
- `scripts/consumer-radar/promptfoo-or-fallback.mjs`: Emit normalized result records.
- `workflows/factory/workflow-builder.fabro`: Add eval registry and coverage enforcement gates.
- `hermes/profiles/quincy/SOUL.md`: Make eval accounting a Quincy completion requirement.
- `hermes/skills/fabro-babysitter/SKILL.md`: Add the eval coverage/accounting checklist.
- `hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md`: Keep distributed Quincy/babysitter rules in sync.

Generated, not committed unless explicitly useful:

- `reports/eval-index.json`
- `reports/eval-dashboard.md`
- `reports/evals/<fabro_run_id>/<eval_id>.json`

---

### Task 1: Eval Doctrine Spec

**Files:**
- Create: `docs/operator/specs/active/eval-operating-system-v0.md`

- [ ] **Step 1: Create the doctrine document**

Write `docs/operator/specs/active/eval-operating-system-v0.md` with these sections and concrete rules:

```markdown
# Eval Operating System v0

## Purpose

The factory treats evals like tests. Every AI behavior has executable evidence, every workflow run records eval outcomes, and every eval can itself be evaluated.

## Source Of Truth

The source of truth is the repo-pinned eval registry plus normalized Fabro/Railway artifacts. Promptfoo is a runner and viewer, not the central record.

## Eval Pyramid

1. Call evals cover individual model/prompt invocations.
2. Stage evals cover small Fabro stages and child workflows.
3. Workflow/product evals cover complete user-facing functions.
4. Meta-evals cover evaluator quality, coverage, regressions, stale data, fallback masking, and waiver discipline.

## Blocking Rule

No new AI call, Fabro stage, child workflow, or product workflow may be marked complete unless the eval registry has a blocking eval or an explicit accepted-risk waiver.

## Fallback Rule

Fallback success never erases runner failure. Reports must separately record runner status, fallback status, gate status, and waiver status.

## Eval Lifecycle

States are draft, calibrating, blocking, ratcheted, quarantined, deprecated.

## Counterexample Rule

Every blocking eval must have at least one known-bad case or meta-eval proving it fails bad output.

## Quincy Rule

Quincy must report call coverage, stage coverage, workflow coverage, meta-eval coverage, failed evals, fallback usage, waivers, and artifact paths before marking Fabro workflow work complete.
```

- [ ] **Step 2: Self-check the spec**

Run:

```bash
rg -n "Source Of Truth|Eval Pyramid|Blocking Rule|Fallback Rule|Counterexample Rule|Quincy Rule" docs/operator/specs/active/eval-operating-system-v0.md
```

Expected: every required heading is present.

- [ ] **Step 3: Commit**

```bash
git add docs/operator/specs/active/eval-operating-system-v0.md
git commit -m "docs: define eval operating system doctrine"
```

---

### Task 2: Registry Schema And Seed Registry

**Files:**
- Create: `evals/registry.schema.json`
- Create: `evals/registry.yaml`
- Create: `scripts/evals/test-registry-contract.mjs`
- Create: `scripts/evals/validate-registry.mjs`
- Create: `scripts/evals/eval-lib.mjs`

- [ ] **Step 1: Write the failing registry test**

Create `scripts/evals/test-registry-contract.mjs`:

```js
#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { loadRegistry, validateRegistry } from "./eval-lib.mjs";

test("eval registry exists and validates", () => {
  assert.equal(existsSync("evals/registry.yaml"), true);
  const registry = loadRegistry("evals/registry.yaml");
  const errors = validateRegistry(registry);
  assert.deepEqual(errors, []);
});

test("seed registry covers existing Promptfoo evals", () => {
  const registry = loadRegistry("evals/registry.yaml");
  const paths = new Set(registry.evals.flatMap((entry) => entry.subject_paths || []));
  for (const path of [
    "evals/consumer-app-radar-quality.yaml",
    "evals/workflow-quality/enhancement-discovery.yaml",
    "evals/iphone-app-factory/prompt-quality.yaml",
    "evals/hermes-skill-governance/skill-promotion.yaml",
  ]) {
    assert.equal(paths.has(path), true, `registry missing ${path}`);
  }
});

test("blocking evals name a meta-eval or known-bad case", () => {
  const registry = loadRegistry("evals/registry.yaml");
  const blocking = registry.evals.filter((entry) => entry.blocking === true);
  assert.ok(blocking.length >= 4, "expected seeded blocking evals");
  for (const entry of blocking) {
    assert.ok(
      entry.meta_eval_id || (entry.counterexamples || []).length > 0,
      `${entry.id} needs meta_eval_id or counterexamples`,
    );
  }
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
node --test scripts/evals/test-registry-contract.mjs
```

Expected: FAIL because `evals/registry.yaml` and `scripts/evals/eval-lib.mjs` do not exist yet.

- [ ] **Step 3: Add the registry schema**

Create `evals/registry.schema.json` with required fields:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Maestro Eval Registry",
  "type": "object",
  "required": ["version", "evals"],
  "properties": {
    "version": { "type": "integer", "minimum": 1 },
    "evals": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "level", "state", "runner", "blocking", "subject_paths", "artifact_patterns", "owner"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9._-]+$" },
          "level": { "enum": ["call", "stage", "workflow", "product", "meta"] },
          "state": { "enum": ["draft", "calibrating", "blocking", "ratcheted", "quarantined", "deprecated"] },
          "runner": { "enum": ["promptfoo", "deterministic", "custom", "human-review", "ci"] },
          "blocking": { "type": "boolean" },
          "owner": { "type": "string" },
          "workflow": { "type": "string" },
          "fabro_node": { "type": "string" },
          "subject_paths": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
          "artifact_patterns": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
          "dataset": { "type": "string" },
          "rubric": { "type": "string" },
          "threshold": { "type": "number", "minimum": 0, "maximum": 1 },
          "meta_eval_id": { "type": "string" },
          "counterexamples": { "type": "array", "items": { "type": "string" } },
          "waiver_policy": { "enum": ["none", "explicit-accepted-risk", "temporary-with-expiry"] }
        },
        "additionalProperties": true
      }
    }
  },
  "additionalProperties": false
}
```

- [ ] **Step 4: Add shared registry helpers**

Create `scripts/evals/eval-lib.mjs` with `loadRegistry`, `validateRegistry`, `sha256File`, `normalizeEvalResult`, and `writeNormalizedResult`. Use only Node built-ins and a small YAML parser for the v0 subset:

```js
#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^["']|["']$/g, "");
}

export function parseRegistryYaml(text) {
  const registry = { version: 1, evals: [] };
  let current = null;
  let listKey = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) continue;
    if (/^version:/.test(line)) registry.version = Number(parseScalar(line.split(":").slice(1).join(":")));
    if (/^\s*-\s+id:/.test(line)) {
      current = { id: parseScalar(line.split(":").slice(1).join(":")) };
      registry.evals.push(current);
      listKey = null;
      continue;
    }
    if (!current) continue;
    const keyMatch = line.match(/^\s{2}([a-zA-Z0-9_]+):\s*(.*)$/);
    if (keyMatch) {
      const [, key, value] = keyMatch;
      if (value === "") {
        current[key] = [];
        listKey = key;
      } else {
        current[key] = parseScalar(value);
        listKey = null;
      }
      continue;
    }
    const itemMatch = line.match(/^\s{4}-\s+(.*)$/);
    if (itemMatch && listKey) current[listKey].push(parseScalar(itemMatch[1]));
  }
  return registry;
}

export function loadRegistry(path = "evals/registry.yaml") {
  return parseRegistryYaml(readFileSync(path, "utf8"));
}

export function validateRegistry(registry) {
  const errors = [];
  if (registry.version !== 1) errors.push("registry.version must be 1");
  if (!Array.isArray(registry.evals)) errors.push("registry.evals must be an array");
  const seen = new Set();
  for (const entry of registry.evals || []) {
    for (const key of ["id", "level", "state", "runner", "owner"]) {
      if (!entry[key]) errors.push(`${entry.id || "unknown"} missing ${key}`);
    }
    if (seen.has(entry.id)) errors.push(`duplicate eval id ${entry.id}`);
    seen.add(entry.id);
    if (!["call", "stage", "workflow", "product", "meta"].includes(entry.level)) errors.push(`${entry.id} has invalid level`);
    if (!["draft", "calibrating", "blocking", "ratcheted", "quarantined", "deprecated"].includes(entry.state)) errors.push(`${entry.id} has invalid state`);
    if (!Array.isArray(entry.subject_paths) || entry.subject_paths.length === 0) errors.push(`${entry.id} missing subject_paths`);
    if (!Array.isArray(entry.artifact_patterns) || entry.artifact_patterns.length === 0) errors.push(`${entry.id} missing artifact_patterns`);
    if (entry.blocking === true && !entry.meta_eval_id && (!entry.counterexamples || entry.counterexamples.length === 0)) {
      errors.push(`${entry.id} blocking eval needs meta_eval_id or counterexamples`);
    }
  }
  return errors;
}

export function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}

export function sha256File(path) {
  return existsSync(path) ? sha256Text(readFileSync(path)) : null;
}

export function normalizeEvalResult(input) {
  const runnerPassed = input.runner_status === "passed";
  const fallbackPassed = input.fallback_status === "passed";
  const waiver = input.waiver_status === "accepted";
  const gateStatus = runnerPassed ? "passed" : waiver ? "waived" : fallbackPassed ? "fallback_only" : "failed";
  return {
    schema_version: 1,
    eval_id: input.eval_id,
    level: input.level,
    runner: input.runner,
    fabro_run_id: input.fabro_run_id || process.env.FABRO_RUN_ID || null,
    workflow: input.workflow || null,
    fabro_node: input.fabro_node || null,
    git_sha: input.git_sha || process.env.GITHUB_SHA || null,
    model: input.model || null,
    prompt_version: input.prompt_version || null,
    dataset_sha256: input.dataset_sha256 || null,
    rubric_version: input.rubric_version || null,
    evaluator_version: input.evaluator_version || null,
    score: input.score ?? null,
    runner_status: input.runner_status || "not_run",
    fallback_status: input.fallback_status || "not_used",
    waiver_status: input.waiver_status || "none",
    gate_status: gateStatus,
    passed: gateStatus === "passed" || gateStatus === "waived",
    failure_class: input.failure_class || null,
    artifact_uris: input.artifact_uris || [],
    parent_eval_id: input.parent_eval_id || null,
    metadata: input.metadata || {},
    created_at: input.created_at || new Date().toISOString()
  };
}

export function writeNormalizedResult(path, input) {
  const result = normalizeEvalResult(input);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
```

- [ ] **Step 5: Seed `evals/registry.yaml`**

Create a v0 registry with existing evals plus meta-eval seeds:

```yaml
version: 1
evals:
  - id: consumer-radar.product-quality
    level: product
    state: blocking
    runner: promptfoo
    blocking: true
    owner: quincy
    workflow: consumer-app-radar
    subject_paths:
      - evals/consumer-app-radar-quality.yaml
      - scripts/consumer-radar/promptfoo-or-fallback.mjs
    artifact_patterns:
      - reports/consumer-radar/quality/promptfoo-report.json
    counterexamples:
      - missing product surface should fail
    waiver_policy: explicit-accepted-risk

  - id: enhancement-discovery.workflow-quality
    level: workflow
    state: blocking
    runner: promptfoo
    blocking: true
    owner: quincy
    workflow: enhancement-discovery
    subject_paths:
      - evals/workflow-quality/enhancement-discovery.yaml
      - scripts/app-feedback/promptfoo-workflow-quality.mjs
    artifact_patterns:
      - .workflow/enhancement-discovery/evals/promptfoo-workflow-quality.json
      - .workflow/enhancement-discovery/evals/*-contract.json
    counterexamples:
      - missing dataset lineage should fail
    waiver_policy: explicit-accepted-risk

  - id: iphone-factory.prompt-quality
    level: workflow
    state: blocking
    runner: promptfoo
    blocking: true
    owner: quincy
    workflow: iphone-app-factory
    subject_paths:
      - evals/iphone-app-factory/prompt-quality.yaml
      - evals/iphone-app-factory/prompt-registry.json
      - scripts/iphone-app-factory/promptfoo-prompt-quality.mjs
    artifact_patterns:
      - .workflow/iphone-app-factory/evals/prompt-quality.json
      - .workflow/iphone-app-factory/evals/promptfoo-output.json
    counterexamples:
      - promptfoo failure plus fallback pass must not become clean pass
    waiver_policy: explicit-accepted-risk

  - id: hermes.skill-promotion-quality
    level: stage
    state: blocking
    runner: promptfoo
    blocking: true
    owner: quincy
    workflow: hermes-skill-governance
    subject_paths:
      - evals/hermes-skill-governance/skill-promotion.yaml
      - evals/hermes-skill-governance/datasets/skill-promotion-golden.jsonl
    artifact_patterns:
      - .workflow/hermes-skill-governance/evals/*.json
    counterexamples:
      - skill without promotion evidence should fail
    waiver_policy: explicit-accepted-risk

  - id: eval.meta.fallback-masking
    level: meta
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - scripts/evals/test-result-normalizer.mjs
      - scripts/evals/eval-lib.mjs
    artifact_patterns:
      - reports/evals/*/eval.meta.fallback-masking.json
    counterexamples:
      - runner failed and fallback passed must produce fallback_only or waived, never passed
    waiver_policy: none
```

- [ ] **Step 6: Add the validator CLI**

Create `scripts/evals/validate-registry.mjs`:

```js
#!/usr/bin/env node
import { loadRegistry, validateRegistry } from "./eval-lib.mjs";

const registry = loadRegistry(process.argv[2] || "evals/registry.yaml");
const errors = validateRegistry(registry);
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, eval_count: registry.evals.length }, null, 2));
```

- [ ] **Step 7: Run registry tests**

Run:

```bash
node --test scripts/evals/test-registry-contract.mjs
node scripts/evals/validate-registry.mjs
```

Expected: PASS and validator prints `ok: true`.

- [ ] **Step 8: Commit**

```bash
git add evals/registry.schema.json evals/registry.yaml scripts/evals/eval-lib.mjs scripts/evals/test-registry-contract.mjs scripts/evals/validate-registry.mjs
git commit -m "feat: add central eval registry"
```

---

### Task 3: Normalized Result Contract

**Files:**
- Create: `evals/result.schema.json`
- Create: `scripts/evals/test-result-normalizer.mjs`
- Modify: `scripts/evals/eval-lib.mjs`

- [ ] **Step 1: Write the failing result normalizer test**

Create `scripts/evals/test-result-normalizer.mjs`:

```js
#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEvalResult } from "./eval-lib.mjs";

test("runner pass is a clean pass", () => {
  const result = normalizeEvalResult({
    eval_id: "example.eval",
    level: "workflow",
    runner: "promptfoo",
    runner_status: "passed",
    fallback_status: "not_used"
  });
  assert.equal(result.gate_status, "passed");
  assert.equal(result.passed, true);
});

test("runner failure plus fallback pass is not a clean pass", () => {
  const result = normalizeEvalResult({
    eval_id: "example.eval",
    level: "workflow",
    runner: "promptfoo",
    runner_status: "failed",
    fallback_status: "passed"
  });
  assert.equal(result.gate_status, "fallback_only");
  assert.equal(result.passed, false);
});

test("accepted waiver is explicit", () => {
  const result = normalizeEvalResult({
    eval_id: "example.eval",
    level: "workflow",
    runner: "promptfoo",
    runner_status: "failed",
    fallback_status: "passed",
    waiver_status: "accepted"
  });
  assert.equal(result.gate_status, "waived");
  assert.equal(result.passed, true);
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
node --test scripts/evals/test-result-normalizer.mjs
```

Expected: PASS if Task 2 helper was implemented with the fallback rule. If it fails, fix `normalizeEvalResult` before continuing.

- [ ] **Step 3: Add the result schema**

Create `evals/result.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Maestro Normalized Eval Result",
  "type": "object",
  "required": ["schema_version", "eval_id", "level", "runner", "runner_status", "fallback_status", "waiver_status", "gate_status", "passed", "created_at"],
  "properties": {
    "schema_version": { "const": 1 },
    "eval_id": { "type": "string" },
    "level": { "enum": ["call", "stage", "workflow", "product", "meta"] },
    "runner": { "enum": ["promptfoo", "deterministic", "custom", "human-review", "ci"] },
    "fabro_run_id": { "type": ["string", "null"] },
    "workflow": { "type": ["string", "null"] },
    "fabro_node": { "type": ["string", "null"] },
    "git_sha": { "type": ["string", "null"] },
    "model": { "type": ["string", "null"] },
    "prompt_version": { "type": ["string", "null"] },
    "dataset_sha256": { "type": ["string", "null"] },
    "rubric_version": { "type": ["string", "null"] },
    "evaluator_version": { "type": ["string", "null"] },
    "score": { "type": ["number", "null"], "minimum": 0, "maximum": 1 },
    "runner_status": { "enum": ["passed", "failed", "error", "skipped", "not_run"] },
    "fallback_status": { "enum": ["passed", "failed", "not_used"] },
    "waiver_status": { "enum": ["none", "accepted"] },
    "gate_status": { "enum": ["passed", "failed", "fallback_only", "waived"] },
    "passed": { "type": "boolean" },
    "failure_class": { "type": ["string", "null"] },
    "artifact_uris": { "type": "array", "items": { "type": "string" } },
    "parent_eval_id": { "type": ["string", "null"] },
    "metadata": { "type": "object" },
    "created_at": { "type": "string" }
  },
  "additionalProperties": false
}
```

- [ ] **Step 4: Run normalizer tests**

Run:

```bash
node --test scripts/evals/test-result-normalizer.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add evals/result.schema.json scripts/evals/test-result-normalizer.mjs scripts/evals/eval-lib.mjs
git commit -m "feat: define normalized eval result contract"
```

---

### Task 4: Call-Level Eval Hook

**Files:**
- Create: `scripts/evals/evaluate-call-artifact.mjs`
- Create: `scripts/evals/test-call-artifact-eval.mjs`
- Modify: `scripts/iphone-app-factory/run-codex-prompt.mjs`
- Modify: `evals/registry.yaml`

- [ ] **Step 1: Add seeded call evals to the registry**

Append registry entries for the main iPhone feature iteration calls already run through `run-codex-prompt.mjs`:

```yaml
  - id: iphone-feature.context-intake.call
    level: call
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    workflow: iphone-app-feature-iteration
    fabro_node: context_intake_child
    subject_paths:
      - workflows/iphone-app-factory/feature-context-intake-stage.fabro
      - scripts/iphone-app-factory/run-codex-prompt.mjs
    artifact_patterns:
      - .workflow/iphone-app-ux-studio/codex/*context*.json
      - .workflow/iphone-app-ux-studio/codex/*context*.last-message.md
    counterexamples:
      - missing last-message artifact should fail
    waiver_policy: explicit-accepted-risk

  - id: iphone-feature.implementation.call
    level: call
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    workflow: iphone-app-feature-iteration
    fabro_node: implementation_child
    subject_paths:
      - workflows/iphone-app-factory/feature-implementation-stage.fabro
      - scripts/iphone-app-factory/run-codex-prompt.mjs
    artifact_patterns:
      - .workflow/iphone-app-ux-studio/codex/*implementation*.json
      - .workflow/iphone-app-ux-studio/codex/*implementation*.last-message.md
    counterexamples:
      - failed Codex status should fail
    waiver_policy: explicit-accepted-risk
```

- [ ] **Step 2: Write the failing call artifact eval test**

Create `scripts/evals/test-call-artifact-eval.mjs`:

```js
#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const fixtureDir = ".workflow/test-call-artifact-eval";

test("call artifact eval fails missing last message", () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(`${fixtureDir}/call.json`, JSON.stringify({ ok: true, status: 0 }, null, 2));
  const result = spawnSync(process.execPath, [
    "scripts/evals/evaluate-call-artifact.mjs",
    "--eval-id", "iphone-feature.implementation.call",
    "--call-report", `${fixtureDir}/call.json`,
    "--last-message", `${fixtureDir}/missing.md`,
    "--out", `${fixtureDir}/result.json`
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
});

test("call artifact eval writes normalized pass", () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(`${fixtureDir}/call.json`, JSON.stringify({ ok: true, status: 0, model: "gpt-5.3-codex" }, null, 2));
  writeFileSync(`${fixtureDir}/last.md`, "Implemented the requested feature and wrote verification artifacts.\n");
  const result = spawnSync(process.execPath, [
    "scripts/evals/evaluate-call-artifact.mjs",
    "--eval-id", "iphone-feature.implementation.call",
    "--call-report", `${fixtureDir}/call.json`,
    "--last-message", `${fixtureDir}/last.md`,
    "--out", `${fixtureDir}/result.json`
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(readFileSync(`${fixtureDir}/result.json`, "utf8"));
  assert.equal(payload.eval_id, "iphone-feature.implementation.call");
  assert.equal(payload.level, "call");
  assert.equal(payload.gate_status, "passed");
});
```

- [ ] **Step 3: Run the failing call eval test**

Run:

```bash
node --test scripts/evals/test-call-artifact-eval.mjs
```

Expected: FAIL because `evaluate-call-artifact.mjs` does not exist.

- [ ] **Step 4: Implement `evaluate-call-artifact.mjs`**

Create a deterministic evaluator that:

- Loads `--eval-id`, `--call-report`, `--last-message`, and `--out`.
- Fails if the call report is missing, malformed, `ok !== true`, or `status !== 0`.
- Fails if the last message is missing or shorter than 40 characters.
- Writes normalized result through `writeNormalizedResult`.

Required CLI shape:

```bash
node scripts/evals/evaluate-call-artifact.mjs \
  --eval-id iphone-feature.implementation.call \
  --call-report .workflow/iphone-app-ux-studio/codex/implement_feature.json \
  --last-message .workflow/iphone-app-ux-studio/codex/implement_feature.last-message.md \
  --out reports/evals/local/iphone-feature.implementation.call.json
```

- [ ] **Step 5: Wire `run-codex-prompt.mjs` to call evals**

Modify `scripts/iphone-app-factory/run-codex-prompt.mjs`:

- Add `const evalId = argValue("--eval-id", process.env.EVAL_ID || null);`
- Add `const evalOutPath = resolve(argValue("--eval-out", \`reports/evals/${process.env.FABRO_RUN_ID || "local"}/${evalId || stage}.json\`));`
- After writing the existing call report, if `evalId` is present, spawn:

```js
spawnSync(process.execPath, [
  "scripts/evals/evaluate-call-artifact.mjs",
  "--eval-id", evalId,
  "--call-report", outPath,
  "--last-message", lastMessagePath,
  "--out", evalOutPath
], { encoding: "utf8", stdio: "inherit" });
```

- If the spawned evaluator exits non-zero, exit non-zero.
- Include `eval_id` and `normalized_eval_result_path` in the existing call report JSON.

- [ ] **Step 6: Run tests**

Run:

```bash
node --test scripts/evals/test-call-artifact-eval.mjs
node scripts/evals/validate-registry.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add evals/registry.yaml scripts/evals/evaluate-call-artifact.mjs scripts/evals/test-call-artifact-eval.mjs scripts/iphone-app-factory/run-codex-prompt.mjs
git commit -m "feat: add call-level eval hook"
```

---

### Task 5: Normalize Existing Promptfoo Wrappers

**Files:**
- Modify: `scripts/iphone-app-factory/promptfoo-prompt-quality.mjs`
- Modify: `scripts/app-feedback/promptfoo-workflow-quality.mjs`
- Modify: `scripts/consumer-radar/promptfoo-or-fallback.mjs`
- Modify: `scripts/evals/test-result-normalizer.mjs`

- [ ] **Step 1: Extend tests for wrapper semantics**

Add this test to `scripts/evals/test-result-normalizer.mjs`:

```js
test("wrapper result preserves fallback-only status", () => {
  const result = normalizeEvalResult({
    eval_id: "iphone-factory.prompt-quality",
    level: "workflow",
    runner: "promptfoo",
    runner_status: "failed",
    fallback_status: "passed",
    score: 0
  });
  assert.equal(result.passed, false);
  assert.equal(result.gate_status, "fallback_only");
});
```

- [ ] **Step 2: Add normalized output to iPhone prompt quality wrapper**

Modify `scripts/iphone-app-factory/promptfoo-prompt-quality.mjs` to call `writeNormalizedResult` after it writes its existing report:

```js
import { writeNormalizedResult } from "../evals/eval-lib.mjs";
```

Map:

- `promptfooOk === true` -> `runner_status: "passed"`
- `promptfooResult && promptfooResult.status !== 0` -> `runner_status: "failed"`
- no Promptfoo attempt because missing env/skip -> `runner_status: "skipped"`
- `fallbackOk === true && !promptfooOk` -> `fallback_status: "passed"`
- `acceptedRiskPromptfooFailure === true` -> `waiver_status: "accepted"`

Write to:

```js
const normalizedOutPath = resolve(argValue(
  "--normalized-out",
  `reports/evals/${process.env.FABRO_RUN_ID || "local"}/iphone-factory.prompt-quality.json`
));
```

- [ ] **Step 3: Normalize app-feedback workflow quality wrapper**

Modify `scripts/app-feedback/promptfoo-workflow-quality.mjs` to write:

```js
reports/evals/${process.env.FABRO_RUN_ID || "local"}/enhancement-discovery.workflow-quality.json
```

Use `runner_status: promptfooOk ? "passed" : promptfooResult ? "failed" : "skipped"`.

- [ ] **Step 4: Normalize consumer radar Promptfoo wrapper**

Modify `scripts/consumer-radar/promptfoo-or-fallback.mjs` to write:

```js
reports/evals/${process.env.FABRO_RUN_ID || "local"}/consumer-radar.product-quality.json
```

Preserve its current output path and behavior, but add normalized result output.

- [ ] **Step 5: Run focused tests and smoke wrappers without external credentials**

Run:

```bash
node --test scripts/evals/test-result-normalizer.mjs
node scripts/iphone-app-factory/promptfoo-prompt-quality.mjs --skip-promptfoo true --accepted-risk-promptfoo-failure true --out .workflow/test-evals/prompt-quality.json --normalized-out .workflow/test-evals/normalized-prompt-quality.json
node scripts/evals/validate-registry.mjs
```

Expected:

- Normalizer tests PASS.
- iPhone wrapper exits 0 only because accepted risk was explicit.
- `.workflow/test-evals/normalized-prompt-quality.json` has `gate_status: "waived"`, not `passed`.

- [ ] **Step 6: Commit**

```bash
git add scripts/iphone-app-factory/promptfoo-prompt-quality.mjs scripts/app-feedback/promptfoo-workflow-quality.mjs scripts/consumer-radar/promptfoo-or-fallback.mjs scripts/evals/test-result-normalizer.mjs
git commit -m "feat: normalize promptfoo eval outcomes"
```

---

### Task 6: Eval Index Collector And Dashboard

**Files:**
- Create: `scripts/evals/collect-index.mjs`
- Create: `scripts/evals/test-collect-index.mjs`
- Create: `scripts/evals/render-dashboard.mjs`
- Modify: `scripts/evals/eval-lib.mjs`

- [ ] **Step 1: Write collector tests**

Create `scripts/evals/test-collect-index.mjs`:

```js
#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const fixtureDir = ".workflow/test-eval-index";

test("collector reports missing blocking evals and counts fallback-only evals", () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(`${fixtureDir}/reports/evals/run-1`, { recursive: true });
  writeFileSync(`${fixtureDir}/registry.yaml`, `version: 1
evals:
  - id: sample.pass
    level: workflow
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - sample
    artifact_patterns:
      - reports/evals/run-1/sample.pass.json
    counterexamples:
      - bad sample should fail
    waiver_policy: explicit-accepted-risk
  - id: sample.missing
    level: call
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - missing
    artifact_patterns:
      - reports/evals/run-1/sample.missing.json
    counterexamples:
      - missing should fail
    waiver_policy: explicit-accepted-risk
`);
  writeFileSync(`${fixtureDir}/reports/evals/run-1/sample.pass.json`, JSON.stringify({
    schema_version: 1,
    eval_id: "sample.pass",
    level: "workflow",
    runner: "deterministic",
    runner_status: "failed",
    fallback_status: "passed",
    waiver_status: "none",
    gate_status: "fallback_only",
    passed: false,
    artifact_uris: [],
    metadata: {},
    created_at: new Date().toISOString()
  }, null, 2));
  const result = spawnSync(process.execPath, [
    "scripts/evals/collect-index.mjs",
    "--registry", `${fixtureDir}/registry.yaml`,
    "--root", fixtureDir,
    "--out", `${fixtureDir}/index.json`
  ], { encoding: "utf8" });
  assert.equal(result.status, 1);
  const index = JSON.parse(readFileSync(`${fixtureDir}/index.json`, "utf8"));
  assert.equal(index.summary.total_registered, 2);
  assert.equal(index.summary.missing_blocking, 1);
  assert.equal(index.summary.fallback_only, 1);
});
```

- [ ] **Step 2: Run the failing collector test**

Run:

```bash
node --test scripts/evals/test-collect-index.mjs
```

Expected: FAIL because `collect-index.mjs` does not exist.

- [ ] **Step 3: Implement `collect-index.mjs`**

The collector must:

- Load `--registry`.
- Search `--root` for normalized result JSON files under `reports/evals/**`.
- Match result files by `eval_id`.
- Produce a JSON object with `summary`, `evals`, and `missing`.
- Exit `1` if any blocking eval is missing, failed, or fallback-only without waiver.
- Exit `0` when all blocking evals are passed or waived.

Required output shape:

```json
{
  "schema_version": 1,
  "created_at": "2026-05-17T00:00:00.000Z",
  "summary": {
    "total_registered": 0,
    "blocking_registered": 0,
    "present_results": 0,
    "passed": 0,
    "failed": 0,
    "fallback_only": 0,
    "waived": 0,
    "missing_blocking": 0
  },
  "evals": [],
  "missing": []
}
```

- [ ] **Step 4: Implement `render-dashboard.mjs`**

Create a markdown dashboard from `reports/eval-index.json`:

```markdown
# Eval Dashboard

Generated: <timestamp>

## Summary

| Metric | Count |
| --- | ---: |
| Registered | 0 |
| Blocking | 0 |
| Present Results | 0 |
| Passed | 0 |
| Failed | 0 |
| Fallback Only | 0 |
| Waived | 0 |
| Missing Blocking | 0 |

## Blocking Issues

- <eval_id>: <reason>
```

Default command:

```bash
node scripts/evals/render-dashboard.mjs --index reports/eval-index.json --out reports/eval-dashboard.md
```

- [ ] **Step 5: Run collector and dashboard tests**

Run:

```bash
node --test scripts/evals/test-collect-index.mjs
node scripts/evals/collect-index.mjs --registry evals/registry.yaml --root . --out reports/eval-index.json || true
node scripts/evals/render-dashboard.mjs --index reports/eval-index.json --out reports/eval-dashboard.md
```

Expected:

- Test PASS.
- Live collector may exit 1 because the repo does not yet have all blocking results for the latest run. That is acceptable at this stage.
- Dashboard file renders and shows missing eval debt honestly.

- [ ] **Step 6: Commit**

```bash
git add scripts/evals/collect-index.mjs scripts/evals/test-collect-index.mjs scripts/evals/render-dashboard.mjs scripts/evals/eval-lib.mjs
git commit -m "feat: collect eval ledger index"
```

---

### Task 7: Workflow Coverage Enforcement

**Files:**
- Create: `scripts/evals/verify-workflow-eval-coverage.mjs`
- Create: `scripts/evals/test-workflow-eval-coverage.mjs`
- Modify: `workflows/factory/workflow-builder.fabro`
- Modify: `package.json`

- [ ] **Step 1: Write coverage tests**

Create `scripts/evals/test-workflow-eval-coverage.mjs`:

```js
#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const fixtureDir = ".workflow/test-eval-coverage";

test("coverage fails when codex prompt call lacks eval id", () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(`${fixtureDir}/workflows`, { recursive: true });
  writeFileSync(`${fixtureDir}/workflows/bad.fabro`, `digraph Bad {
    call [shape=parallelogram, script="node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/x.md --stage bad"]
  }`);
  writeFileSync(`${fixtureDir}/registry.yaml`, `version: 1\nevals: []\n`);
  const result = spawnSync(process.execPath, [
    "scripts/evals/verify-workflow-eval-coverage.mjs",
    "--registry", `${fixtureDir}/registry.yaml`,
    "--workflow", `${fixtureDir}/workflows/bad.fabro`
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing --eval-id/);
});

test("coverage passes when codex call eval id is registered", () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(`${fixtureDir}/workflows`, { recursive: true });
  writeFileSync(`${fixtureDir}/workflows/good.fabro`, `digraph Good {
    call [shape=parallelogram, script="node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/x.md --stage good --eval-id good.call"]
  }`);
  writeFileSync(`${fixtureDir}/registry.yaml`, `version: 1
evals:
  - id: good.call
    level: call
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - workflows/good.fabro
    artifact_patterns:
      - reports/evals/*/good.call.json
    counterexamples:
      - missing call output should fail
    waiver_policy: explicit-accepted-risk
`);
  const result = spawnSync(process.execPath, [
    "scripts/evals/verify-workflow-eval-coverage.mjs",
    "--registry", `${fixtureDir}/registry.yaml`,
    "--workflow", `${fixtureDir}/workflows/good.fabro`
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
```

- [ ] **Step 2: Run the failing coverage test**

Run:

```bash
node --test scripts/evals/test-workflow-eval-coverage.mjs
```

Expected: FAIL because `verify-workflow-eval-coverage.mjs` does not exist.

- [ ] **Step 3: Implement workflow coverage verifier**

Create `scripts/evals/verify-workflow-eval-coverage.mjs`:

- Accept `--registry` and one or more `--workflow` args.
- Parse workflow text with regex, not DOT semantics.
- For every `run-codex-prompt.mjs` command, require `--eval-id <id>`.
- Require the eval id to exist in registry with `level: call`.
- For every workflow file scanned, require at least one registered `stage`, `workflow`, or `product` eval whose `subject_paths` includes the workflow path.
- Print JSON summary on stdout when successful.
- Print actionable errors on stderr and exit `1` when missing.

- [ ] **Step 4: Add workflow-builder gate**

Modify `workflows/factory/workflow-builder.fabro`:

- Add an `eval_registry_gate` node after `wait_for_builder_files`.
- Script:

```bash
node scripts/evals/validate-registry.mjs && node scripts/evals/verify-workflow-eval-coverage.mjs --registry evals/registry.yaml --workflow workflows/factory/workflow-builder.fabro
```

- Route `eval_registry_gate` success into the materialization sequence.
- Retry/fix target should return to `define_quality_bar`.

- [ ] **Step 5: Add package scripts**

Modify `package.json` scripts:

```json
{
  "eval:registry": "node scripts/evals/validate-registry.mjs",
  "eval:coverage": "node scripts/evals/verify-workflow-eval-coverage.mjs --registry evals/registry.yaml --workflow workflows/factory/workflow-builder.fabro",
  "eval:index": "node scripts/evals/collect-index.mjs --registry evals/registry.yaml --root . --out reports/eval-index.json",
  "eval:dashboard": "node scripts/evals/render-dashboard.mjs --index reports/eval-index.json --out reports/eval-dashboard.md"
}
```

- [ ] **Step 6: Run coverage tests**

Run:

```bash
node --test scripts/evals/test-workflow-eval-coverage.mjs
npm run eval:registry
npm run eval:coverage
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/evals/verify-workflow-eval-coverage.mjs scripts/evals/test-workflow-eval-coverage.mjs workflows/factory/workflow-builder.fabro package.json
git commit -m "feat: enforce eval coverage in workflow builder"
```

---

### Task 8: Eval Ledger Database Migration

**Files:**
- Create: `db/migrations/006_eval_ledger.sql`

- [ ] **Step 1: Add migration**

Create `db/migrations/006_eval_ledger.sql`:

```sql
ALTER TABLE eval_runs
  ADD COLUMN IF NOT EXISTS fabro_run_id TEXT,
  ADD COLUMN IF NOT EXISTS workflow_slug TEXT,
  ADD COLUMN IF NOT EXISTS fabro_node TEXT,
  ADD COLUMN IF NOT EXISTS git_sha TEXT,
  ADD COLUMN IF NOT EXISTS runner TEXT,
  ADD COLUMN IF NOT EXISTS runner_status TEXT,
  ADD COLUMN IF NOT EXISTS fallback_status TEXT,
  ADD COLUMN IF NOT EXISTS waiver_status TEXT,
  ADD COLUMN IF NOT EXISTS gate_status TEXT,
  ADD COLUMN IF NOT EXISTS parent_eval_run_id UUID REFERENCES eval_runs(eval_run_id);

ALTER TABLE eval_outcomes
  ADD COLUMN IF NOT EXISTS eval_id TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS artifact_uris JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS failure_class TEXT;

CREATE TABLE IF NOT EXISTS eval_waivers (
  waiver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eval_id TEXT NOT NULL,
  fabro_run_id TEXT,
  reason TEXT NOT NULL,
  accepted_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eval_runs_fabro_run_id ON eval_runs(fabro_run_id);
CREATE INDEX IF NOT EXISTS idx_eval_runs_gate_status ON eval_runs(gate_status);
CREATE INDEX IF NOT EXISTS idx_eval_outcomes_eval_id ON eval_outcomes(eval_id);
```

- [ ] **Step 2: Schema smoke check**

Run:

```bash
rg -n "fabro_run_id|gate_status|eval_waivers|parent_eval_run_id" db/migrations/006_eval_ledger.sql
```

Expected: all terms present.

- [ ] **Step 3: Commit**

```bash
git add db/migrations/006_eval_ledger.sql
git commit -m "feat: extend eval ledger schema"
```

---

### Task 9: Quincy And Babysitter Rules

**Files:**
- Modify: `hermes/profiles/quincy/SOUL.md`
- Modify: `hermes/skills/fabro-babysitter/SKILL.md`
- Modify: `hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md`
- Create: `docs/operator/evals/EVAL-OPERATING-RUNBOOK.md`

- [ ] **Step 1: Update Quincy profile**

Add a section to `hermes/profiles/quincy/SOUL.md`:

```markdown
## Eval Operating Discipline

Quincy treats evals as production tests for the factory.

Before marking Fabro workflow work complete, Quincy must report:

- Call eval coverage for every model invocation.
- Stage eval coverage for each child workflow or meaningful Fabro stage.
- Workflow/product eval coverage for the full user-facing function.
- Meta-eval coverage for changed or newly promoted evals.
- Failed evals, fallback-only evals, skipped evals, and accepted-risk waivers.
- Artifact paths or Fabro/Railway run IDs proving the claims.

Missing blocking eval coverage is a blocker. Fallback-only success is not a clean pass.
```

- [ ] **Step 2: Update babysitter skill**

Add a checklist to both babysitter skill files:

```markdown
## Eval Accounting Checklist

For every Fabro run or workflow-building task:

1. Run or inspect `node scripts/evals/validate-registry.mjs`.
2. Run or inspect workflow coverage for touched `.fabro` files.
3. Collect normalized eval results into `reports/eval-index.json`.
4. Report missing blocking evals.
5. Report fallback-only evals separately from passing evals.
6. Require an accepted-risk waiver before treating a fallback-only eval as complete.
7. For changed evals, require a counterexample or meta-eval.
```

- [ ] **Step 3: Add operator runbook**

Create `docs/operator/evals/EVAL-OPERATING-RUNBOOK.md`:

```markdown
# Eval Operating Runbook

## Local Commands

- `npm run eval:registry`
- `npm run eval:coverage`
- `npm run eval:index`
- `npm run eval:dashboard`

## Reading The Dashboard

`reports/eval-dashboard.md` is the quick operator view. Missing blocking evals and fallback-only evals are action items, not informational notes.

## Promptfoo

Promptfoo remains a runner and local viewer. Use `promptfoo view -p 15500` for local inspection, but use the eval index as the central record.

## Railway/Fabro

Fabro/Railway run IDs must appear in normalized results when available through `FABRO_RUN_ID`.

## Waivers

Waivers require an explicit reason, owner, and expiry when the registry says `temporary-with-expiry`.
```

- [ ] **Step 4: Verify docs**

Run:

```bash
rg -n "Eval Operating Discipline|Eval Accounting Checklist|Fallback-only|Promptfoo remains a runner" hermes/profiles/quincy/SOUL.md hermes/skills/fabro-babysitter/SKILL.md hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md docs/operator/evals/EVAL-OPERATING-RUNBOOK.md
```

Expected: all required phrases present.

- [ ] **Step 5: Commit**

```bash
git add hermes/profiles/quincy/SOUL.md hermes/skills/fabro-babysitter/SKILL.md hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md docs/operator/evals/EVAL-OPERATING-RUNBOOK.md
git commit -m "docs: add Quincy eval operating discipline"
```

---

### Task 10: End-To-End Verification

**Files:**
- Modify only if previous task verification exposes a defect.

- [ ] **Step 1: Run all focused eval-system tests**

Run:

```bash
node --test scripts/evals/test-registry-contract.mjs
node --test scripts/evals/test-result-normalizer.mjs
node --test scripts/evals/test-call-artifact-eval.mjs
node --test scripts/evals/test-collect-index.mjs
node --test scripts/evals/test-workflow-eval-coverage.mjs
```

Expected: PASS.

- [ ] **Step 2: Run registry and coverage commands**

Run:

```bash
npm run eval:registry
npm run eval:coverage
```

Expected: PASS.

- [ ] **Step 3: Generate current index and dashboard**

Run:

```bash
npm run eval:index || true
npm run eval:dashboard
```

Expected:

- `reports/eval-index.json` exists.
- `reports/eval-dashboard.md` exists.
- The index may report missing blocking evals until live workflows emit all normalized results.

- [ ] **Step 4: Verify Promptfoo dashboard status is documented**

Run:

```bash
curl -s http://localhost:15500/api/results | head -c 200 || true
```

Expected: local dashboard may respond, but this is only supporting evidence. Do not treat local Promptfoo DB as central truth.

- [ ] **Step 5: Final git review**

Run:

```bash
git status --short
git diff --stat
```

Expected: only files from this plan are changed, aside from pre-existing dirty worktree items.

- [ ] **Step 6: Commit final fixes if needed**

```bash
git add docs/operator/specs/active/eval-operating-system-v0.md evals scripts/evals db/migrations/006_eval_ledger.sql docs/operator/evals/EVAL-OPERATING-RUNBOOK.md hermes/profiles/quincy/SOUL.md hermes/skills/fabro-babysitter/SKILL.md hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md workflows/factory/workflow-builder.fabro package.json scripts/iphone-app-factory/run-codex-prompt.mjs scripts/iphone-app-factory/promptfoo-prompt-quality.mjs scripts/app-feedback/promptfoo-workflow-quality.mjs scripts/consumer-radar/promptfoo-or-fallback.mjs
git commit -m "feat: build eval operating system v0"
```

---

## Self-Review Checklist

- [ ] Doctrine covers source of truth, pyramid, lifecycle, fallback, waivers, counterexamples, and Quincy.
- [ ] Registry covers existing Promptfoo configs before adding new evals.
- [ ] Normalized result contract distinguishes `passed`, `fallback_only`, `waived`, and `failed`.
- [ ] Call-level hook gives every `run-codex-prompt.mjs` invocation an `eval_id`.
- [ ] Workflow coverage gate fails missing evals before new workflows are treated as complete.
- [ ] Collector/dashboard surfaces missing coverage as debt, not silence.
- [ ] DB migration preserves existing `eval_runs` / `eval_outcomes` and extends them instead of replacing them.
- [ ] Promptfoo remains a runner/viewer, not the central source of truth.
- [ ] Quincy cannot mark completion without eval accounting evidence.
