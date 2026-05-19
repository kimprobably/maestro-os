import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  analyzeFabroWorkflowText,
  loadActiveWorkflowManifest,
  validateActiveWorkflowManifest,
} from "./active-workflow-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VERIFIER_PATH = join(__dirname, "verify-workflow-eval-coverage.mjs");

function withFixture(fn) {
  const root = mkdtempSync(join(tmpdir(), "workflow-eval-coverage-"));
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function writeRegistry(path, workflowPath) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `version: 1
evals:
  - id: good.call
    level: call
    state: blocking
    runner: deterministic
    blocking: true
    owner: evals
    subject_paths:
      - ${workflowPath}
    artifact_patterns:
      - reports/good-call.json
    counterexamples:
      - missing call artifact should fail
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
  - id: good.workflow
    level: workflow
    state: blocking
    runner: deterministic
    blocking: true
    owner: evals
    subject_paths:
      - ${workflowPath}
    artifact_patterns:
      - reports/good-workflow.json
    counterexamples:
      - uncovered workflow should fail
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
`,
  );
}

function writeNonBlockingRegistry(path, workflowPath) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `version: 1
evals:
  - id: good.call
    level: call
    state: draft
    runner: deterministic
    blocking: false
    owner: evals
    subject_paths:
      - ${workflowPath}
    artifact_patterns:
      - reports/good-call.json
    counterexamples:
      - draft call eval must not satisfy coverage
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
  - id: good.workflow
    level: workflow
    state: calibrating
    runner: deterministic
    blocking: false
    owner: evals
    subject_paths:
      - ${workflowPath}
    artifact_patterns:
      - reports/good-workflow.json
    counterexamples:
      - calibrating workflow eval must not satisfy coverage
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
`,
  );
}

function run(args) {
  return spawnSync(process.execPath, [VERIFIER_PATH, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("run-codex-prompt command missing --eval-id fails", () => {
  withFixture((root) => {
    const workflowPath = join(root, "missing-eval-id.fabro");
    const registryPath = join(root, "registry.yaml");
    writeRegistry(registryPath, workflowPath);
    writeFileSync(
      workflowPath,
      `digraph Fixture {
  review [
    script="node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/example.md --stage review --out .workflow/review.json"
  ]
}
`,
    );

    const result = run(["--registry", registryPath, "--workflow", workflowPath]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing --eval-id/);
  });
});

test("run-codex-prompt command with registered call eval passes", () => {
  withFixture((root) => {
    const workflowPath = join(root, "covered.fabro");
    const registryPath = join(root, "registry.yaml");
    writeRegistry(registryPath, workflowPath);
    writeFileSync(
      workflowPath,
      `digraph Fixture {
  review [
    script="node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/example.md --stage review --out .workflow/review.json --eval-id good.call"
  ]
}
`,
    );

    const result = run(["--registry", registryPath, "--workflow", workflowPath]);

    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.ok, true);
    assert.equal(summary.workflows_scanned, 1);
    assert.equal(summary.codex_prompt_calls, 1);
  });
});

test("workflow coverage can emit normalized passing eval evidence", () => {
  withFixture((root) => {
    const workflowPath = join(root, "covered.fabro");
    const registryPath = join(root, "registry.yaml");
    const evalOutPath = join(root, "reports/evals/local/good.workflow.json");
    writeRegistry(registryPath, workflowPath);
    writeFileSync(
      workflowPath,
      `digraph Fixture {
  review [
    script="node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/example.md --stage review --out .workflow/review.json --eval-id good.call"
  ]
}
`,
    );

    const result = run([
      "--registry",
      registryPath,
      "--workflow",
      workflowPath,
      "--eval-id",
      "good.workflow",
      "--workflow-id",
      "fixture-workflow",
      "--eval-result-out",
      evalOutPath,
    ]);

    assert.equal(result.status, 0, result.stderr);
    const evalResult = JSON.parse(readFileSync(evalOutPath, "utf8"));
    assert.equal(evalResult.eval_id, "good.workflow");
    assert.equal(evalResult.level, "workflow");
    assert.equal(evalResult.runner, "deterministic");
    assert.equal(evalResult.workflow, "fixture-workflow");
    assert.equal(evalResult.runner_status, "passed");
    assert.equal(evalResult.gate_status, "passed");
    assert.equal(evalResult.passed, true);
    assert.ok(evalResult.artifact_uris.includes(evalOutPath));
  });
});

test("workflow coverage emits failed eval evidence before exiting nonzero", () => {
  withFixture((root) => {
    const workflowPath = join(root, "missing-eval-id.fabro");
    const registryPath = join(root, "registry.yaml");
    const evalOutPath = join(root, "reports/evals/local/good.workflow.json");
    writeRegistry(registryPath, workflowPath);
    writeFileSync(
      workflowPath,
      `digraph Fixture {
  review [
    script="node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/example.md --stage review --out .workflow/review.json"
  ]
}
`,
    );

    const result = run([
      "--registry",
      registryPath,
      "--workflow",
      workflowPath,
      "--eval-id",
      "good.workflow",
      "--workflow-id",
      "fixture-workflow",
      "--eval-result-out",
      evalOutPath,
    ]);

    assert.notEqual(result.status, 0);
    const evalResult = JSON.parse(readFileSync(evalOutPath, "utf8"));
    assert.equal(evalResult.runner_status, "failed");
    assert.equal(evalResult.gate_status, "failed");
    assert.equal(evalResult.passed, false);
    assert.ok(evalResult.metadata.errors.some((error) => error.includes("missing --eval-id")));
  });
});

test("eval id on a later chained command does not cover codex prompt call", () => {
  withFixture((root) => {
    const workflowPath = join(root, "chained-false-pass.fabro");
    const registryPath = join(root, "registry.yaml");
    writeRegistry(registryPath, workflowPath);
    writeFileSync(
      workflowPath,
      `digraph Fixture {
  review [
    script="node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/example.md --stage review --out .workflow/review.json && node scripts/other-tool.mjs --eval-id good.call"
  ]
}
`,
    );

    const result = run(["--registry", registryPath, "--workflow", workflowPath]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing --eval-id/);
  });
});

test("draft or non-blocking evals do not satisfy workflow coverage", () => {
  withFixture((root) => {
    const workflowPath = join(root, "non-blocking.fabro");
    const registryPath = join(root, "registry.yaml");
    writeNonBlockingRegistry(registryPath, workflowPath);
    writeFileSync(
      workflowPath,
      `digraph Fixture {
  review [
    script="node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/example.md --stage review --out .workflow/review.json --eval-id good.call"
  ]
}
`,
    );

    const result = run(["--registry", registryPath, "--workflow", workflowPath]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not registered with level: call/);
    assert.match(result.stderr, /missing registered stage\/workflow\/product eval/);
  });
});

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
    stack.child_workflow="workflows/fixture/child.fabro"
  ]
  wrapper [
    script="node scripts/iphone-app-factory/run-codex-prompt.mjs --stage intake --eval-id fixture.intake.call"
  ]
  native_prompt [prompt="@../../prompts/fixture.md"]
}`);

  assert.equal(analysis.codex_prompt_invocations.length, 1);
  assert.equal(analysis.codex_prompt_invocations[0].eval_id, "fixture.intake.call");
  assert.equal(analysis.codex_prompt_invocations[0].stage, "intake");
  assert.equal(analysis.native_prompt_nodes.length, 1);
  assert.equal(analysis.manager_loop_children[0].workflow, "workflows/fixture/child.fabro");
});

test("active workflow coverage fails when active wrapper call lacks eval id", () => {
  withFixture((root) => {
    const workflowPath = join(root, "workflows/active.fabro");
    const manifestPath = join(root, "active-workflows.yaml");
    const registryPath = join(root, "registry.yaml");
    mkdirSync(dirname(workflowPath), { recursive: true });
    writeFileSync(
      workflowPath,
      `digraph Active {
  call [script="node scripts/iphone-app-factory/run-codex-prompt.mjs --stage one"]
}
`,
    );
    writeFileSync(
      manifestPath,
      `version: 1
groups:
  - id: active
    owner: quincy
    outcome_eval_id: active.outcome
    workflows:
      - path: ${workflowPath}
        role: standalone
        workflow_eval_id: active.workflow
        native_prompt_policy: none
`,
    );
    writeFileSync(
      registryPath,
      `version: 1
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
`,
    );

    const result = run(["--registry", registryPath, "--active-workflows", manifestPath]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing --eval-id/);
  });
});

test("active workflow coverage passes for registered calls and tracked native prompts", () => {
  withFixture((root) => {
    const workflowPath = join(root, "workflows/active.fabro");
    const childPath = join(root, "workflows/child.fabro");
    const manifestPath = join(root, "active-workflows.yaml");
    const registryPath = join(root, "registry.yaml");
    const evalOutPath = join(root, "reports/evals/factory-health/active-workflows.eval-coverage.json");
    mkdirSync(dirname(workflowPath), { recursive: true });
    writeFileSync(
      workflowPath,
      `digraph Active {
  child [type="stack.manager_loop", stack.child_workflow="./child.fabro"]
  call [script="node scripts/iphone-app-factory/run-codex-prompt.mjs --stage one --eval-id active.one.call"]
  native [prompt="@../../prompts/active.md"]
}
`,
    );
    writeFileSync(childPath, `digraph Child { start [shape=Mdiamond] }`);
    writeFileSync(
      manifestPath,
      `version: 1
groups:
  - id: active
    owner: quincy
    outcome_eval_id: active.outcome
    workflows:
      - path: ${workflowPath}
        role: parent
        workflow_eval_id: active.workflow
        native_prompt_policy: tracked_pending
      - path: ${childPath}
        role: child
        workflow_eval_id: active.child.workflow
        native_prompt_policy: none
`,
    );
    writeFileSync(
      registryPath,
      `version: 1
evals:
  - id: active-workflows.eval-coverage
    level: meta
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - ${manifestPath}
    artifact_patterns:
      - ${evalOutPath}
    counterexamples:
      - missing active workflow eval coverage must fail
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
      - missing active outcome evidence must fail
    waiver_policy:
      owner: quincy
      review_cadence: per-workflow-change
      requires_expiry: true
      requires_compensating_control: true
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
      - missing active workflow evidence must fail
    waiver_policy:
      owner: quincy
      review_cadence: per-workflow-change
      requires_expiry: true
      requires_compensating_control: true
  - id: active.child.workflow
    level: workflow
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - ${childPath}
    artifact_patterns:
      - reports/active.child.workflow.json
    counterexamples:
      - missing child workflow evidence must fail
    waiver_policy:
      owner: quincy
      review_cadence: per-workflow-change
      requires_expiry: true
      requires_compensating_control: true
  - id: active.one.call
    level: call
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - ${workflowPath}
    artifact_patterns:
      - reports/active.one.call.json
    counterexamples:
      - missing active call evidence must fail
    waiver_policy:
      owner: quincy
      review_cadence: per-workflow-change
      requires_expiry: true
      requires_compensating_control: true
`,
    );

    const result = run([
      "--registry",
      registryPath,
      "--active-workflows",
      manifestPath,
      "--eval-id",
      "active-workflows.eval-coverage",
      "--workflow-id",
      "active-workflows",
      "--eval-result-out",
      evalOutPath,
    ]);

    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.active_groups, 1);
    assert.equal(summary.workflows_scanned, 2);
    assert.equal(summary.codex_prompt_calls, 1);
    assert.equal(summary.native_prompt_nodes, 1);
    const evalResult = JSON.parse(readFileSync(evalOutPath, "utf8"));
    assert.equal(evalResult.eval_id, "active-workflows.eval-coverage");
    assert.equal(evalResult.runner_status, "passed");
  });
});

test("active workflow coverage fails when native prompts are untracked or child manifest entries are missing", () => {
  withFixture((root) => {
    const workflowPath = join(root, "workflows/active.fabro");
    const childPath = join(root, "workflows/child.fabro");
    const manifestPath = join(root, "active-workflows.yaml");
    const registryPath = join(root, "registry.yaml");
    mkdirSync(dirname(workflowPath), { recursive: true });
    writeFileSync(
      workflowPath,
      `digraph Active {
  child [type="stack.manager_loop", stack.child_workflow="./child.fabro"]
  native [prompt="@../../prompts/active.md"]
}
`,
    );
    writeFileSync(childPath, `digraph Child { start [shape=Mdiamond] }`);
    writeFileSync(
      manifestPath,
      `version: 1
groups:
  - id: active
    owner: quincy
    outcome_eval_id: active.outcome
    workflows:
      - path: ${workflowPath}
        role: parent
        workflow_eval_id: active.workflow
        native_prompt_policy: none
`,
    );
    writeRegistry(registryPath, workflowPath);

    const result = run(["--registry", registryPath, "--active-workflows", manifestPath]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /native prompt nodes/);
    assert.match(result.stderr, /child workflow .* is not declared active/);
  });
});
