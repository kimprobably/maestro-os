# Active Workflow Eval Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add active workflow eval coverage so every actively used Fabro workflow has explicit call, child workflow, parent outcome, and native prompt coverage signals.

**Architecture:** Keep `evals/registry.yaml` as the eval source of truth, add `evals/active-workflows.yaml` as the active factory scope manifest, and extend the existing deterministic coverage checker to validate active workflows. The checker writes normalized eval evidence into `reports/evals/factory-health/` so existing eval index and factory dashboard surfaces can roll it up for Quincy and the factory owner.

**Tech Stack:** Node.js ESM scripts, built-in `node:test`, the existing lightweight YAML parser in `scripts/evals/eval-lib.mjs`, Fabro `.fabro` workflow files, GitHub Actions quality workflow.

---

## File Structure

- Create `evals/active-workflows.yaml`: committed manifest of production-ish active workflow groups, child workflows, native prompt policy, and required eval IDs.
- Create `scripts/evals/active-workflow-lib.mjs`: parser and static analyzer for active workflow manifests and Fabro workflow text.
- Modify `scripts/evals/verify-workflow-eval-coverage.mjs`: add `--active-workflows`, validate registry/manifest/workflow coverage, and keep the existing `--workflow` mode working.
- Modify `scripts/evals/test-workflow-eval-coverage.mjs`: add tests for active manifest parsing, missing eval IDs, native prompt tracking, child workflow coverage, and normalized eval evidence.
- Modify `evals/registry.yaml`: add active coverage meta eval plus object-proof, existing-feature, UX, build factory, WakeTask, and Hermes eval entries.
- Modify active `.fabro` files under `workflows/iphone-app-factory/`: add missing `--eval-id` flags to active `run-codex-prompt.mjs` calls.
- Modify `package.json`: add `eval:active-workflows`.
- Modify `.github/workflows/quality.yml`: run the active workflow eval check in CI.
- Update generated reports only after checks pass: `reports/evals/factory-health/active-workflows.eval-coverage.json`, `reports/eval-index.json`, `reports/eval-dashboard.md`, `reports/factory-health.json`, `reports/factory-dashboard.md`.

---

### Task 1: Add Active Workflow Manifest Parser

**Files:**
- Create: `evals/active-workflows.yaml`
- Create: `scripts/evals/active-workflow-lib.mjs`
- Modify: `scripts/evals/test-workflow-eval-coverage.mjs`

- [ ] **Step 1: Write failing parser tests**

Append tests to `scripts/evals/test-workflow-eval-coverage.mjs` that import `loadActiveWorkflowManifest`, `validateActiveWorkflowManifest`, and `analyzeFabroWorkflowText`.

```js
import {
  analyzeFabroWorkflowText,
  loadActiveWorkflowManifest,
  validateActiveWorkflowManifest,
} from "./active-workflow-lib.mjs";

test("active workflow manifest validates active groups and workflow paths", () => {
  withFixture((root) => {
    const manifestPath = join(root, "active-workflows.yaml");
    writeFileSync(
      manifestPath,
      `version: 1
groups:
  - id: fixture
    owner: quincy
    outcome_eval_id: fixture.outcome
    workflows:
      - path: workflows/fixture/parent.fabro
        role: parent
        workflow_eval_id: fixture.parent.workflow
        native_prompt_policy: tracked_pending
        required_call_eval_prefix: fixture
`,
    );

    const manifest = loadActiveWorkflowManifest(manifestPath);
    assert.deepEqual(validateActiveWorkflowManifest(manifest), []);
    assert.equal(manifest.groups[0].workflows[0].path, "workflows/fixture/parent.fabro");
  });
});

test("fabro analyzer finds wrapper calls, native prompts, and manager loop children", () => {
  const analysis = analyzeFabroWorkflowText(`digraph Fixture {
  child_stage [
    type="stack.manager_loop",
    workflow="workflows/fixture/child.fabro"
  ]
  wrapper [
    script="node scripts/iphone-app-factory/run-codex-prompt.mjs --stage intake --eval-id fixture.intake.call"
  ]
  native_prompt [prompt="@../../prompts/fixture.md"]
}`);

  assert.equal(analysis.codex_prompt_invocations.length, 1);
  assert.equal(analysis.codex_prompt_invocations[0].eval_id, "fixture.intake.call");
  assert.equal(analysis.native_prompt_nodes.length, 1);
  assert.equal(analysis.manager_loop_children[0].workflow, "workflows/fixture/child.fabro");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test scripts/evals/test-workflow-eval-coverage.mjs
```

Expected: FAIL with module export errors for `active-workflow-lib.mjs`.

- [ ] **Step 3: Create the manifest parser and analyzer**

Create `scripts/evals/active-workflow-lib.mjs` with:

```js
import { existsSync, readFileSync } from "node:fs";
import { parseRegistryYaml } from "./eval-lib.mjs";

const ROLES = new Set(["parent", "child", "standalone"]);
const NATIVE_PROMPT_POLICIES = new Set(["none", "tracked_pending", "collector_required", "collected"]);

export function loadActiveWorkflowManifest(path = "evals/active-workflows.yaml") {
  return parseRegistryYaml(readFileSync(path, "utf8"));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateActiveWorkflowManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return ["active workflow manifest must be an object"];
  if (manifest.version !== 1) errors.push("active workflow manifest version must be 1");
  if (!Array.isArray(manifest.groups) || manifest.groups.length === 0) errors.push("active workflow manifest groups must be a non-empty array");

  for (const [groupIndex, group] of (manifest.groups || []).entries()) {
    const label = nonEmptyString(group?.id) ? group.id : `groups[${groupIndex}]`;
    if (!nonEmptyString(group?.id)) errors.push(`${label} id must be a non-empty string`);
    if (!nonEmptyString(group?.owner)) errors.push(`${label} owner must be a non-empty string`);
    if (!nonEmptyString(group?.outcome_eval_id)) errors.push(`${label} outcome_eval_id must be a non-empty string`);
    if (!Array.isArray(group?.workflows) || group.workflows.length === 0) errors.push(`${label} workflows must be a non-empty array`);

    for (const [workflowIndex, workflow] of (group.workflows || []).entries()) {
      const workflowLabel = nonEmptyString(workflow?.path) ? workflow.path : `${label}.workflows[${workflowIndex}]`;
      if (!nonEmptyString(workflow?.path)) errors.push(`${workflowLabel} path must be a non-empty string`);
      if (!ROLES.has(workflow?.role)) errors.push(`${workflowLabel} role must be one of ${Array.from(ROLES).join(", ")}`);
      if (!nonEmptyString(workflow?.workflow_eval_id)) errors.push(`${workflowLabel} workflow_eval_id must be a non-empty string`);
      if (!NATIVE_PROMPT_POLICIES.has(workflow?.native_prompt_policy ?? "none")) {
        errors.push(`${workflowLabel} native_prompt_policy must be one of ${Array.from(NATIVE_PROMPT_POLICIES).join(", ")}`);
      }
    }
  }

  return errors;
}

function unescapeFabroString(value) {
  return value.replace(/\\"/g, '"');
}

function extractAttribute(block, name) {
  const match = block.match(new RegExp(`\\\\b${name}\\\\s*=\\\\s*"((?:\\\\\\\\"|[^"])*)"`));
  return match ? unescapeFabroString(match[1]) : null;
}

function tokenizeCommand(command) {
  const tokens = [];
  const regex = /"((?:\\"|[^"])*)"|'([^']*)'|(\\S+)/g;
  let match;
  while ((match = regex.exec(command)) !== null) tokens.push(match[1] ?? match[2] ?? match[3]);
  return tokens;
}

function evalIdForCommand(command) {
  const tokens = tokenizeCommand(command);
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index] === "--eval-id") return tokens[index + 1] ?? null;
    if (tokens[index].startsWith("--eval-id=")) return tokens[index].slice("--eval-id=".length) || null;
  }
  return null;
}

function stageForCommand(command) {
  const tokens = tokenizeCommand(command);
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index] === "--stage") return tokens[index + 1] ?? null;
    if (tokens[index].startsWith("--stage=")) return tokens[index].slice("--stage=".length) || null;
  }
  return null;
}

export function analyzeFabroWorkflowText(text) {
  const nodeBlocks = [...text.matchAll(/(^|\\n)\\s*([A-Za-z0-9_:-]+)\\s*\\[([\\s\\S]*?)\\]/g)];
  const codexPromptInvocations = [];
  const nativePromptNodes = [];
  const managerLoopChildren = [];

  for (const match of nodeBlocks) {
    const node = match[2];
    const body = match[3];
    const line = text.slice(0, match.index).split(/\\r?\\n/).length;
    const script = extractAttribute(body, "script");
    const prompt = extractAttribute(body, "prompt");
    const type = extractAttribute(body, "type");
    const workflow = extractAttribute(body, "workflow");

    if (script?.includes("run-codex-prompt.mjs")) {
      codexPromptInvocations.push({ node, line, command: script, eval_id: evalIdForCommand(script), stage: stageForCommand(script) });
    }
    if (prompt?.startsWith("@")) nativePromptNodes.push({ node, line, prompt });
    if (type === "stack.manager_loop" && workflow) managerLoopChildren.push({ node, line, workflow });
  }

  return {
    codex_prompt_invocations: codexPromptInvocations,
    native_prompt_nodes: nativePromptNodes,
    manager_loop_children: managerLoopChildren,
  };
}

export function workflowFileExists(path) {
  return existsSync(path);
}
```

- [ ] **Step 4: Add the first active manifest**

Create `evals/active-workflows.yaml` with the active groups:

```yaml
version: 1
groups:
  - id: waketask-object-proof-program
    owner: quincy
    outcome_eval_id: iphone-object-proof.program.outcome
    workflows:
      - path: workflows/iphone-app-factory/waketask-object-proof-program.fabro
        role: parent
        workflow_eval_id: iphone-object-proof.program.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-program-preflight-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.preflight.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-program-spec-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.program-spec.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-barcode-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.barcode.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-barcode-learning-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.barcode-learning.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-preset-vision-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.preset-vision.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-preset-vision-learning-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.preset-vision-learning.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-same-object-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.same-object.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-same-object-learning-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.same-object-learning.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/object-proof-publish-postmortem-stage.fabro
        role: child
        workflow_eval_id: iphone-object-proof.postmortem.workflow
        native_prompt_policy: none

  - id: iphone-existing-app-feature-iteration
    owner: quincy
    outcome_eval_id: iphone-feature.iteration.outcome
    workflows:
      - path: workflows/iphone-app-factory/iterate-existing-app-features.fabro
        role: parent
        workflow_eval_id: iphone-feature.iteration.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/feature-context-intake-stage.fabro
        role: child
        workflow_eval_id: iphone-feature.context-intake.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/feature-existing-app-audit-stage.fabro
        role: child
        workflow_eval_id: iphone-feature.existing-app-audit.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/feature-research-stage.fabro
        role: child
        workflow_eval_id: iphone-feature.research.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/feature-spec-stage.fabro
        role: child
        workflow_eval_id: iphone-feature.spec.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/feature-implementation-plan-stage.fabro
        role: child
        workflow_eval_id: iphone-feature.implementation-plan.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/feature-implementation-stage.fabro
        role: child
        workflow_eval_id: iphone-feature.implementation.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/feature-validation-stage.fabro
        role: child
        workflow_eval_id: iphone-feature.validation.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/feature-publish-postmortem-stage.fabro
        role: child
        workflow_eval_id: iphone-feature.postmortem.workflow
        native_prompt_policy: none

  - id: iphone-app-build-factory
    owner: iphone-app-factory
    outcome_eval_id: iphone-build.factory.outcome
    workflows:
      - path: workflows/iphone-app-factory/build-iphone-app.fabro
        role: parent
        workflow_eval_id: iphone-build.factory.workflow
        native_prompt_policy: tracked_pending
      - path: workflows/iphone-app-factory/build-iphone-app.cli.fabro
        role: parent
        workflow_eval_id: iphone-build.factory-cli.workflow
        native_prompt_policy: tracked_pending

  - id: waketask-product-ux-iteration
    owner: quincy
    outcome_eval_id: waketask-product.iteration.outcome
    workflows:
      - path: workflows/iphone-app-factory/waketask-product-iteration.fabro
        role: parent
        workflow_eval_id: waketask-product.iteration.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/waketask-workflow-preflight-stage.fabro
        role: child
        workflow_eval_id: waketask-product.preflight.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/waketask-product-spec-stage.fabro
        role: child
        workflow_eval_id: waketask-product.spec.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/iterate-existing-app-ux.fabro
        role: child
        workflow_eval_id: iphone-ux.iteration.workflow
        native_prompt_policy: none
      - path: workflows/iphone-app-factory/waketask-validation-postmortem-stage.fabro
        role: child
        workflow_eval_id: waketask-product.validation-postmortem.workflow
        native_prompt_policy: none

  - id: hermes-create-agent
    owner: hermes
    outcome_eval_id: hermes.create-agent.outcome
    workflows:
      - path: workflows/hermes/create-agent.fabro
        role: standalone
        workflow_eval_id: hermes.create-agent.workflow
        native_prompt_policy: none
```

- [ ] **Step 5: Run tests to verify parser behavior**

Run:

```bash
node --test scripts/evals/test-workflow-eval-coverage.mjs
```

Expected: PASS for the new parser/analyzer tests.

- [ ] **Step 6: Commit Task 1**

```bash
git add evals/active-workflows.yaml scripts/evals/active-workflow-lib.mjs scripts/evals/test-workflow-eval-coverage.mjs
git commit -m "feat: add active workflow eval manifest"
```

---

### Task 2: Extend Coverage Verifier for Active Workflows

**Files:**
- Modify: `scripts/evals/verify-workflow-eval-coverage.mjs`
- Modify: `scripts/evals/test-workflow-eval-coverage.mjs`

- [ ] **Step 1: Write failing active coverage tests**

Add tests that execute the verifier with `--active-workflows` and assert that missing call evals, missing workflow evals, and untracked native prompts fail.

```js
test("active workflow coverage fails when active wrapper call lacks eval id", () => {
  withFixture((root) => {
    const workflowPath = join(root, "workflows/active.fabro");
    const manifestPath = join(root, "active-workflows.yaml");
    const registryPath = join(root, "registry.yaml");
    mkdirSync(dirname(workflowPath), { recursive: true });
    writeFileSync(workflowPath, `digraph Active { call [script="node scripts/iphone-app-factory/run-codex-prompt.mjs --stage one"] }`);
    writeFileSync(manifestPath, `version: 1
groups:
  - id: active
    owner: quincy
    outcome_eval_id: active.outcome
    workflows:
      - path: ${workflowPath}
        role: standalone
        workflow_eval_id: active.workflow
        native_prompt_policy: none
`);
    writeFileSync(registryPath, `version: 1
evals:
  - id: active.workflow
    level: workflow
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - ${workflowPath}
    artifact_patterns:
      - reports/active.workflow.json
    counterexamples:
      - active wrapper call without eval id must fail
    waiver_policy:
      owner: quincy
      review_cadence: per-workflow-change
      requires_expiry: true
      requires_compensating_control: true
  - id: active.outcome
    level: product
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - ${workflowPath}
    artifact_patterns:
      - reports/active.outcome.json
    counterexamples:
      - active outcome without coverage must fail
    waiver_policy:
      owner: quincy
      review_cadence: per-workflow-change
      requires_expiry: true
      requires_compensating_control: true
`);

    const result = run(["--registry", registryPath, "--active-workflows", manifestPath]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing --eval-id/);
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
node --test scripts/evals/test-workflow-eval-coverage.mjs
```

Expected: FAIL because `--active-workflows` is not supported yet.

- [ ] **Step 3: Add active mode arguments**

Modify `parseArgs` in `scripts/evals/verify-workflow-eval-coverage.mjs`:

```js
const args = {
  registry: "evals/registry.yaml",
  workflows: [],
  activeWorkflows: null,
  evalId: null,
  workflowId: null,
  evalResultOut: null,
};
```

Add:

```js
} else if (arg === "--active-workflows") {
  args.activeWorkflows = argv[++index];
```

Replace the workflow count validation with:

```js
if (args.workflows.length === 0 && !args.activeWorkflows) {
  throw new Error("at least one --workflow path or --active-workflows path is required");
}
```

- [ ] **Step 4: Validate active manifest coverage**

Import the new helpers:

```js
import {
  analyzeFabroWorkflowText,
  loadActiveWorkflowManifest,
  validateActiveWorkflowManifest,
  workflowFileExists,
} from "./active-workflow-lib.mjs";
```

Add `verifyActiveWorkflowCoverage`:

```js
function evalById(registry) {
  return new Map(registry.evals.map((entry) => [entry.id, entry]));
}

function entryCoversPath(entry, workflowPath) {
  return Array.isArray(entry?.subject_paths) && entry.subject_paths.some((subjectPath) => registrySubjectMatches(subjectPath, workflowPath));
}

function verifyActiveWorkflowCoverage({ registry, manifest }) {
  const errors = validateActiveWorkflowManifest(manifest);
  const entries = evalById(registry);
  const workflowSummaries = [];
  let codexPromptCalls = 0;
  let nativePromptNodes = 0;
  let managerLoopChildren = 0;

  for (const group of manifest.groups || []) {
    const outcomeEntry = entries.get(group.outcome_eval_id);
    if (!outcomeEntry || !isActiveBlockingEval(outcomeEntry) || !["workflow", "product"].includes(outcomeEntry.level)) {
      errors.push(`${group.id} outcome_eval_id ${group.outcome_eval_id} must be registered as blocking workflow/product eval`);
    }

    for (const workflow of group.workflows || []) {
      if (!workflowFileExists(workflow.path)) {
        errors.push(`${workflow.path} declared active but file does not exist`);
        continue;
      }

      const workflowEntry = entries.get(workflow.workflow_eval_id);
      if (!workflowEntry || !isActiveBlockingEval(workflowEntry) || !COVERAGE_LEVELS.has(workflowEntry.level)) {
        errors.push(`${workflow.path} workflow_eval_id ${workflow.workflow_eval_id} must be registered as blocking workflow/product eval`);
      } else if (!entryCoversPath(workflowEntry, workflow.path)) {
        errors.push(`${workflow.workflow_eval_id} subject_paths must include ${workflow.path}`);
      }

      const analysis = analyzeFabroWorkflowText(readFileSync(workflow.path, "utf8"));
      codexPromptCalls += analysis.codex_prompt_invocations.length;
      nativePromptNodes += analysis.native_prompt_nodes.length;
      managerLoopChildren += analysis.manager_loop_children.length;

      for (const invocation of analysis.codex_prompt_invocations) {
        if (!invocation.eval_id) {
          errors.push(`${workflow.path}:${invocation.line} run-codex-prompt.mjs command missing --eval-id <id>`);
          continue;
        }
        const callEntry = entries.get(invocation.eval_id);
        if (!callEntry || callEntry.level !== "call" || !isActiveBlockingEval(callEntry)) {
          errors.push(`${workflow.path}:${invocation.line} --eval-id ${invocation.eval_id} is not registered with level: call`);
        } else if (!entryCoversPath(callEntry, workflow.path)) {
          errors.push(`${invocation.eval_id} subject_paths must include ${workflow.path}`);
        }
      }

      if (analysis.native_prompt_nodes.length > 0 && (workflow.native_prompt_policy ?? "none") === "none") {
        errors.push(`${workflow.path} has ${analysis.native_prompt_nodes.length} native prompt nodes but native_prompt_policy is none`);
      }

      workflowSummaries.push({
        group_id: group.id,
        path: workflow.path,
        role: workflow.role,
        workflow_eval_id: workflow.workflow_eval_id,
        codex_prompt_calls: analysis.codex_prompt_invocations.length,
        native_prompt_nodes: analysis.native_prompt_nodes.length,
        native_prompt_policy: workflow.native_prompt_policy ?? "none",
        manager_loop_children: analysis.manager_loop_children.length,
      });
    }
  }

  return {
    errors,
    summary: {
      ok: errors.length === 0,
      active_groups: manifest.groups?.length ?? 0,
      workflows_scanned: workflowSummaries.length,
      codex_prompt_calls: codexPromptCalls,
      native_prompt_nodes: nativePromptNodes,
      manager_loop_children: managerLoopChildren,
      workflows: workflowSummaries,
    },
  };
}
```

- [ ] **Step 5: Wire active mode into main**

In the main try block, choose the active verifier when `args.activeWorkflows` is present:

```js
const result = args.activeWorkflows
  ? verifyActiveWorkflowCoverage({ registry, manifest: loadActiveWorkflowManifest(args.activeWorkflows) })
  : verifyWorkflowCoverage({ registry, workflows: args.workflows });
const { errors, summary } = result;
```

- [ ] **Step 6: Run verifier tests**

Run:

```bash
node --test scripts/evals/test-workflow-eval-coverage.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add scripts/evals/verify-workflow-eval-coverage.mjs scripts/evals/test-workflow-eval-coverage.mjs
git commit -m "feat: verify active workflow eval coverage"
```

---

### Task 3: Register Active Eval IDs

**Files:**
- Modify: `evals/registry.yaml`

- [ ] **Step 1: Run active verifier to capture expected failures**

Run:

```bash
node scripts/evals/verify-workflow-eval-coverage.mjs --registry evals/registry.yaml --active-workflows evals/active-workflows.yaml
```

Expected: FAIL with missing registry entries for active workflow, outcome, and call eval IDs.

- [ ] **Step 2: Add active coverage meta eval**

Append to `evals/registry.yaml`:

```yaml
  - id: active-workflows.eval-coverage
    level: meta
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - evals/active-workflows.yaml
      - scripts/evals/verify-workflow-eval-coverage.mjs
      - scripts/evals/active-workflow-lib.mjs
    artifact_patterns:
      - reports/evals/factory-health/active-workflows.eval-coverage.json
      - reports/eval-index.json
    counterexamples:
      - active workflow containing run-codex-prompt.mjs without --eval-id must fail coverage
      - active native Fabro prompt node without tracking policy must fail coverage
    waiver_policy:
      owner: quincy
      review_cadence: per-workflow-change
      requires_expiry: true
      requires_compensating_control: true
```

- [ ] **Step 3: Add object-proof call/workflow/outcome evals**

Add blocking deterministic evals for:

```text
iphone-object-proof.program.outcome
iphone-object-proof.program.workflow
iphone-object-proof.preflight.workflow
iphone-object-proof.program-spec.workflow
iphone-object-proof.program-spec.call
iphone-object-proof.barcode.workflow
iphone-object-proof.barcode.implementation.call
iphone-object-proof.barcode-learning.workflow
iphone-object-proof.barcode.learning.call
iphone-object-proof.preset-vision.workflow
iphone-object-proof.preset-vision.implementation.call
iphone-object-proof.preset-vision-learning.workflow
iphone-object-proof.preset-vision.learning.call
iphone-object-proof.same-object.workflow
iphone-object-proof.same-object.implementation.call
iphone-object-proof.same-object-learning.workflow
iphone-object-proof.same-object.learning.call
iphone-object-proof.postmortem.workflow
iphone-object-proof.program-postmortem.call
```

Each entry must include the matching workflow under `subject_paths`, `.workflow/object-proof-program/**` artifact patterns, owner `quincy`, and a counterexample specific to missing stage evidence or failed Codex call.

- [ ] **Step 4: Add existing-app feature evals**

Add blocking deterministic evals for:

```text
iphone-feature.iteration.outcome
iphone-feature.iteration.workflow
iphone-feature.context-intake.workflow
iphone-feature.context-intake.call
iphone-feature.existing-app-audit.workflow
iphone-feature.existing-app-audit.call
iphone-feature.research.workflow
iphone-feature.trend-context-research.call
iphone-feature.mobbin-competitor-research.call
iphone-feature.app-store-research.call
iphone-feature.behavioral-research.call
iphone-feature.research-synthesis.call
iphone-feature.spec.workflow
iphone-feature.spec.call
iphone-feature.implementation-plan.workflow
iphone-feature.implementation-plan.call
iphone-feature.implementation.workflow
iphone-feature.implementation.call
iphone-feature.validation.workflow
iphone-feature.validation-review.call
iphone-feature.postmortem.workflow
iphone-feature.postmortem.call
```

Reuse existing `iphone-feature.context-intake.call` and `iphone-feature.implementation.call` entries by editing them rather than duplicating IDs.

- [ ] **Step 5: Add build, UX, WakeTask product, and Hermes workflow evals**

Add blocking deterministic or promptfoo-backed evals for:

```text
iphone-build.factory.outcome
iphone-build.factory.workflow
iphone-build.factory-cli.workflow
waketask-product.iteration.outcome
waketask-product.iteration.workflow
waketask-product.preflight.workflow
waketask-product.spec.workflow
iphone-ux.iteration.workflow
waketask-product.validation-postmortem.workflow
hermes.create-agent.outcome
hermes.create-agent.workflow
```

The build factory workflow entries should name native prompt collection gaps in their counterexamples and artifact patterns.

- [ ] **Step 6: Validate registry**

Run:

```bash
npm run eval:registry
```

Expected: PASS with a larger eval count.

- [ ] **Step 7: Commit Task 3**

```bash
git add evals/registry.yaml
git commit -m "feat: register active workflow evals"
```

---

### Task 4: Wire Missing Wrapper Call Eval IDs

**Files:**
- Modify: `workflows/iphone-app-factory/feature-context-intake-stage.fabro`
- Modify: `workflows/iphone-app-factory/feature-existing-app-audit-stage.fabro`
- Modify: `workflows/iphone-app-factory/feature-research-stage.fabro`
- Modify: `workflows/iphone-app-factory/feature-spec-stage.fabro`
- Modify: `workflows/iphone-app-factory/feature-implementation-plan-stage.fabro`
- Modify: `workflows/iphone-app-factory/feature-implementation-stage.fabro`
- Modify: `workflows/iphone-app-factory/feature-validation-stage.fabro`
- Modify: `workflows/iphone-app-factory/feature-publish-postmortem-stage.fabro`
- Modify: `workflows/iphone-app-factory/iterate-existing-app-ux.fabro`

- [ ] **Step 1: Run active verifier to show missing workflow call eval IDs**

Run:

```bash
node scripts/evals/verify-workflow-eval-coverage.mjs --registry evals/registry.yaml --active-workflows evals/active-workflows.yaml
```

Expected: FAIL with missing `--eval-id` errors for existing-app feature and UX wrapper calls.

- [ ] **Step 2: Add existing-app feature eval IDs**

Patch each feature stage command:

```text
feature-context-intake -> --eval-id iphone-feature.context-intake.call
feature-existing-app-audit -> --eval-id iphone-feature.existing-app-audit.call
trend-context-research -> --eval-id iphone-feature.trend-context-research.call
feature-mobbin-competitor-research -> --eval-id iphone-feature.mobbin-competitor-research.call
feature-app-store-research -> --eval-id iphone-feature.app-store-research.call
feature-behavioral-research -> --eval-id iphone-feature.behavioral-research.call
feature-research-synthesis -> --eval-id iphone-feature.research-synthesis.call
feature-spec -> --eval-id iphone-feature.spec.call
feature-implementation-plan -> --eval-id iphone-feature.implementation-plan.call
feature-implementation -> --eval-id iphone-feature.implementation.call
feature-validation-review -> --eval-id iphone-feature.validation-review.call
feature-postmortem -> --eval-id iphone-feature.postmortem.call
```

- [ ] **Step 3: Add UX eval IDs**

Patch `workflows/iphone-app-factory/iterate-existing-app-ux.fabro` with `iphone-ux.<stage>.call` IDs for every `run-codex-prompt.mjs` stage. Use stage names already present in `--stage`, replacing underscores with hyphens only if the registry ID already uses hyphens.

Example:

```text
--stage existing-app-intake -> --eval-id iphone-ux.existing-app-intake.call
--stage final-consensus -> --eval-id iphone-ux.final-consensus.call
--stage postmortem-learning-capture -> --eval-id iphone-ux.postmortem-learning-capture.call
```

Add matching call entries to `evals/registry.yaml` if the active verifier reports missing registry IDs after patching.

- [ ] **Step 4: Run active verifier**

Run:

```bash
node scripts/evals/verify-workflow-eval-coverage.mjs --registry evals/registry.yaml --active-workflows evals/active-workflows.yaml
```

Expected: PASS or fail only on native prompt collection tracked-pending policy if Task 2 intentionally treats `tracked_pending` as attention instead of hard failure.

- [ ] **Step 5: Commit Task 4**

```bash
git add workflows/iphone-app-factory/*.fabro evals/registry.yaml
git commit -m "feat: wire active workflow call eval ids"
```

---

### Task 5: Add CI Script and Normalized Evidence

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/quality.yml`
- Create: `reports/evals/factory-health/active-workflows.eval-coverage.json`
- Modify: `reports/eval-index.json`
- Modify: `reports/eval-dashboard.md`
- Modify: `reports/factory-health.json`
- Modify: `reports/factory-dashboard.md`

- [ ] **Step 1: Add package script**

Modify `package.json`:

```json
"eval:active-workflows": "node scripts/evals/verify-workflow-eval-coverage.mjs --registry evals/registry.yaml --active-workflows evals/active-workflows.yaml --eval-id active-workflows.eval-coverage --workflow-id active-workflows --eval-result-out reports/evals/factory-health/active-workflows.eval-coverage.json"
```

- [ ] **Step 2: Add CI command**

In `.github/workflows/quality.yml`, add `npm run eval:active-workflows` inside `Factory Eval System Checks` after `npm run eval:coverage`.

```yaml
          npm run eval:coverage
          npm run eval:active-workflows
          npm run eval:index || eval_index_status=$?
```

- [ ] **Step 3: Run local checks**

Run:

```bash
node --test scripts/evals/test-workflow-eval-coverage.mjs scripts/factory-dashboard/test-dashboard-lib.mjs
npm run eval:registry
npm run eval:coverage
npm run eval:active-workflows
npm run eval:index
npm run eval:dashboard
npm run factory:dashboard
```

Expected: all commands complete successfully. If `eval:index` fails because older blocking evals lack runtime evidence, keep the existing CI baseline rule unchanged and inspect `reports/eval-index.json` to confirm there are no schema or parser issues.

- [ ] **Step 4: Inspect generated owner rollup**

Run:

```bash
node -e 'const h=require("node:fs").readFileSync("reports/factory-health.json","utf8"); const j=JSON.parse(h); console.log(JSON.stringify({status:j.status, owner_actions:j.owner_rollup?.owner_actions, evals:j.quality}, null, 2))'
```

Expected: owner actions mention real active coverage issues if any remain; no raw local filesystem paths should appear.

- [ ] **Step 5: Commit Task 5**

```bash
git add package.json .github/workflows/quality.yml reports/evals/factory-health/active-workflows.eval-coverage.json reports/eval-index.json reports/eval-dashboard.md reports/factory-health.json reports/factory-dashboard.md
git commit -m "ci: check active workflow eval coverage"
```

---

### Task 6: Usefulness Review and PR Prep

**Files:**
- Create: `reports/active-workflow-eval-review.md`

- [ ] **Step 1: Generate the usefulness review from artifacts**

Run this command to create `reports/active-workflow-eval-review.md` from the normalized coverage result and factory dashboard JSON:

```bash
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from "node:fs";

const coverage = JSON.parse(readFileSync("reports/evals/factory-health/active-workflows.eval-coverage.json", "utf8"));
const factory = JSON.parse(readFileSync("reports/factory-health.json", "utf8"));
const index = JSON.parse(readFileSync("reports/eval-index.json", "utf8"));
const summary = coverage.metadata?.summary ?? {};
const workflows = summary.workflows ?? [];
const childWorkflows = workflows.filter((workflow) => workflow.role === "child").length;
const parentWorkflows = workflows.filter((workflow) => workflow.role === "parent" || workflow.role === "standalone").length;
const nativePending = workflows.filter((workflow) => workflow.native_prompt_nodes > 0 && workflow.native_prompt_policy !== "collected");
const ownerActions = factory.owner_rollup?.owner_actions ?? [];
const indexIssues = index.issues ?? [];

writeFileSync(
  "reports/active-workflow-eval-review.md",
  `# Active Workflow Eval Review

## Coverage

- Active groups covered: ${summary.active_groups ?? 0}
- Active workflows scanned: ${summary.workflows_scanned ?? 0}
- Wrapper model calls covered: ${summary.codex_prompt_calls ?? 0}
- Native Fabro prompt nodes tracked: ${summary.native_prompt_nodes ?? 0}
- Child workflow evals registered: ${childWorkflows}
- Parent or standalone outcome surfaces registered: ${parentWorkflows}

## Useful Signals

- Factory dashboard status: ${factory.status ?? "unknown"}
- Blocking eval evidence missing: ${factory.quality?.blocking_missing_count ?? 0}
- Eval index issues: ${indexIssues.length}
- Owner actions: ${ownerActions.length === 0 ? "none" : ownerActions.join("; ")}

## Weak Evals To Strengthen

- Artifact-existence evals that need semantic rubrics: wrapper call evals currently prove command success and usable final artifacts before they prove domain quality.
- Native prompt nodes that need runtime collection: ${nativePending.map((workflow) => `${workflow.path} (${workflow.native_prompt_nodes})`).join("; ") || "none"}

## Next Actions

1. Implement Fabro native prompt evidence collector.
2. Add semantic promptfoo rubrics for the highest-volume workflow stages.
3. Tune dashboard owner actions after one real PR and one real Fabro run.
`,
);
NODE
```

Expected: `reports/active-workflow-eval-review.md` contains concrete counts from `reports/evals/factory-health/active-workflows.eval-coverage.json`, `reports/eval-index.json`, and `reports/factory-health.json`.

- [ ] **Step 2: Run final verification**

Run:

```bash
node --test scripts/evals/test-workflow-eval-coverage.mjs scripts/factory-dashboard/test-dashboard-lib.mjs
npm run eval:registry
npm run eval:coverage
npm run eval:active-workflows
npm run eval:index || true
npm run eval:dashboard
npm run factory:dashboard
git status --short
```

Expected: tests and registry/coverage commands pass. If `eval:index` returns nonzero only for the accepted missing evidence baseline, note that explicitly in the PR body.

- [ ] **Step 3: Commit Task 6**

```bash
git add reports/active-workflow-eval-review.md reports/eval-index.json reports/eval-dashboard.md reports/factory-health.json reports/factory-dashboard.md
git commit -m "docs: review active workflow eval usefulness"
```

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin codex/active-workflow-evals
gh pr create --base main --head codex/active-workflow-evals --title "Add active workflow eval coverage" --body-file /tmp/active-workflow-evals-pr.md
```

The PR body should include:

```md
## Summary

- Adds an active workflow manifest for currently used Fabro workflows.
- Extends deterministic eval coverage to wrapper calls, workflow evals, parent outcomes, and native prompt tracking.
- Wires missing eval IDs into active iPhone factory workflows.
- Adds CI and dashboard evidence for active workflow eval coverage.

## Verification

- `node --test scripts/evals/test-workflow-eval-coverage.mjs scripts/factory-dashboard/test-dashboard-lib.mjs`
- `npm run eval:registry`
- `npm run eval:coverage`
- `npm run eval:active-workflows`
- `npm run eval:index`
- `npm run eval:dashboard`
- `npm run factory:dashboard`
```

---

## Self-Review Checklist

- Spec coverage: Tasks 1-5 implement the manifest, registry, call coverage, workflow coverage, native prompt tracking, normalized evidence, dashboard rollup, and CI requirements. Task 6 covers usefulness review.
- Placeholder scan: The plan intentionally names exact files, commands, IDs, and expected outcomes. No implementation step should leave missing eval IDs or unlabeled native prompt nodes hidden.
- Type consistency: The manifest consistently uses `groups`, `outcome_eval_id`, `workflows`, `workflow_eval_id`, `role`, and `native_prompt_policy`. The verifier summary consistently uses `codex_prompt_calls`, `native_prompt_nodes`, `manager_loop_children`, and `workflows`.
