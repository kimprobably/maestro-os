import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

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
