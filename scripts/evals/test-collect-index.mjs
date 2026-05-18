import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COLLECTOR_PATH = join(__dirname, "collect-index.mjs");

test("collector indexes fallback-only result and reports missing blocking eval", () => {
  const root = mkdtempSync(join(tmpdir(), "eval-index-"));
  const registryPath = join(root, "evals", "registry.yaml");
  const resultPath = join(root, "reports", "evals", "run-1", "sample.pass.json");
  const outPath = join(root, "reports", "eval-index.json");

  mkdirSync(dirname(registryPath), { recursive: true });
  mkdirSync(dirname(resultPath), { recursive: true });

  writeFileSync(
    registryPath,
    `version: 1
evals:
  - id: sample.present
    level: workflow
    state: blocking
    runner: deterministic
    blocking: true
    owner: evals
    subject_paths:
      - evals/sample.yaml
    artifact_patterns:
      - reports/evals/run-1/sample.pass.json
    counterexamples:
      - fallback-only result must block
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
  - id: sample.missing
    level: workflow
    state: blocking
    runner: deterministic
    blocking: true
    owner: evals
    subject_paths:
      - evals/missing.yaml
    artifact_patterns:
      - reports/evals/run-1/missing.json
    counterexamples:
      - missing blocking result must block
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
`,
  );

  writeFileSync(
    resultPath,
    `${JSON.stringify(
      {
        schema_version: 1,
        eval_id: "sample.present",
        level: "workflow",
        runner: "deterministic",
        runner_status: "failed",
        fallback_status: "passed",
        waiver_status: "none",
        gate_status: "fallback_only",
        passed: false,
        artifact_uris: ["reports/evals/run-1/sample.pass.json"],
        created_at: "2026-05-17T00:00:00.000Z",
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync(process.execPath, [
    COLLECTOR_PATH,
    "--registry",
    registryPath,
    "--root",
    root,
    "--out",
    outPath,
  ]);

  assert.equal(result.status, 1, result.stderr.toString());

  const index = JSON.parse(readFileSync(outPath, "utf8"));
  assert.equal(index.summary.total_registered, 2);
  assert.equal(index.summary.missing_blocking, 1);
  assert.equal(index.summary.fallback_only, 1);
});

test("collector rejects result with reused eval id but wrong contract", () => {
  const root = mkdtempSync(join(tmpdir(), "eval-index-spoof-"));
  const registryPath = join(root, "evals", "registry.yaml");
  const resultPath = join(root, "reports", "evals", "run-1", "spoof.json");
  const outPath = join(root, "reports", "eval-index.json");

  mkdirSync(dirname(registryPath), { recursive: true });
  mkdirSync(dirname(resultPath), { recursive: true });

  writeFileSync(
    registryPath,
    `version: 1
evals:
  - id: product.quality
    level: product
    state: blocking
    runner: promptfoo
    blocking: true
    owner: evals
    subject_paths:
      - evals/product.yaml
    artifact_patterns:
      - reports/evals/run-1/product-quality.json
    counterexamples:
      - wrong runner must not satisfy product eval
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
`,
  );

  writeFileSync(
    resultPath,
    `${JSON.stringify(
      {
        schema_version: 1,
        eval_id: "product.quality",
        level: "call",
        runner: "deterministic",
        runner_status: "passed",
        fallback_status: "not_used",
        waiver_status: "none",
        gate_status: "passed",
        passed: true,
        artifact_uris: ["reports/evals/run-1/spoof.json"],
        created_at: "2026-05-17T00:00:00.000Z",
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync(process.execPath, [
    COLLECTOR_PATH,
    "--registry",
    registryPath,
    "--root",
    root,
    "--out",
    outPath,
  ]);

  assert.equal(result.status, 1, result.stderr.toString());

  const index = JSON.parse(readFileSync(outPath, "utf8"));
  assert.equal(index.summary.present_results, 0);
  assert.equal(index.summary.missing_blocking, 1);
  assert.ok(index.issues.some((issue) => issue.type === "result_registry_mismatch"));
});

test("collector rejects workflow-scoped result missing workflow identity", () => {
  const root = mkdtempSync(join(tmpdir(), "eval-index-missing-workflow-"));
  const registryPath = join(root, "evals", "registry.yaml");
  const resultPath = join(root, "reports", "evals", "run-1", "workflow-quality.json");
  const outPath = join(root, "reports", "eval-index.json");

  mkdirSync(dirname(registryPath), { recursive: true });
  mkdirSync(dirname(resultPath), { recursive: true });

  writeFileSync(
    registryPath,
    `version: 1
evals:
  - id: workflow.quality
    level: workflow
    state: blocking
    runner: deterministic
    blocking: true
    owner: evals
    workflow: expected-workflow
    subject_paths:
      - workflows/expected.fabro
    artifact_patterns:
      - reports/evals/run-1/workflow-quality.json
    counterexamples:
      - missing workflow identity must not satisfy registry contract
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
`,
  );

  writeFileSync(
    resultPath,
    `${JSON.stringify(
      {
        schema_version: 1,
        eval_id: "workflow.quality",
        level: "workflow",
        runner: "deterministic",
        runner_status: "passed",
        fallback_status: "not_used",
        waiver_status: "none",
        gate_status: "passed",
        passed: true,
        artifact_uris: ["reports/evals/run-1/workflow-quality.json"],
        created_at: "2026-05-17T00:00:00.000Z",
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync(process.execPath, [
    COLLECTOR_PATH,
    "--registry",
    registryPath,
    "--root",
    root,
    "--out",
    outPath,
  ]);

  assert.equal(result.status, 1, result.stderr.toString());

  const index = JSON.parse(readFileSync(outPath, "utf8"));
  assert.equal(index.summary.present_results, 0);
  assert.ok(index.issues.some((issue) => JSON.stringify(issue).includes("workflow mismatch")));
});

test("collector rejects call result missing registered fabro node", () => {
  const root = mkdtempSync(join(tmpdir(), "eval-index-missing-node-"));
  const registryPath = join(root, "evals", "registry.yaml");
  const resultPath = join(root, "reports", "evals", "run-1", "call.json");
  const outPath = join(root, "reports", "eval-index.json");

  mkdirSync(dirname(registryPath), { recursive: true });
  mkdirSync(dirname(resultPath), { recursive: true });

  writeFileSync(
    registryPath,
    `version: 1
evals:
  - id: call.quality
    level: call
    state: blocking
    runner: deterministic
    blocking: true
    owner: evals
    workflow: expected-workflow
    fabro_node: expected_node
    subject_paths:
      - workflows/expected.fabro
    artifact_patterns:
      - reports/evals/run-1/call.json
    counterexamples:
      - missing node identity must not satisfy call eval
    waiver_policy:
      owner: evals
      review_cadence: per-run
      requires_expiry: true
      requires_compensating_control: true
`,
  );

  writeFileSync(
    resultPath,
    `${JSON.stringify(
      {
        schema_version: 1,
        eval_id: "call.quality",
        level: "call",
        runner: "deterministic",
        workflow: "expected-workflow",
        runner_status: "passed",
        fallback_status: "not_used",
        waiver_status: "none",
        gate_status: "passed",
        passed: true,
        artifact_uris: ["reports/evals/run-1/call.json"],
        created_at: "2026-05-17T00:00:00.000Z",
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync(process.execPath, [
    COLLECTOR_PATH,
    "--registry",
    registryPath,
    "--root",
    root,
    "--out",
    outPath,
  ]);

  assert.equal(result.status, 1, result.stderr.toString());

  const index = JSON.parse(readFileSync(outPath, "utf8"));
  assert.equal(index.summary.present_results, 0);
  assert.ok(index.issues.some((issue) => JSON.stringify(issue).includes("fabro_node mismatch")));
});
