import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  buildFactoryDashboard,
  defaultRunLedgerSources,
  discoverReportArtifacts,
  parseJsonlEvents,
  readJsonlEvents,
  readRunLedgerSource,
  renderFactoryDashboard,
} from "./dashboard-lib.mjs";

const CLI_PATH = join(import.meta.dirname, "render-factory-dashboard.mjs");

function sqliteAvailable() {
  return spawnSync("sqlite3", ["--version"], { encoding: "utf8" }).status === 0;
}

function artifact(path) {
  return {
    path,
    bytes: 128,
    modified_at: "2026-05-18T12:00:00.000Z",
  };
}

test("factory dashboard promotes missing blocking evals and failed runs into attention", () => {
  const dashboard = buildFactoryDashboard({
    now: "2026-05-18T13:00:00.000Z",
    evalIndex: {
      created_at: "2026-05-18T12:00:00.000Z",
      summary: {
        total_registered: 2,
        blocking_registered: 2,
        present_results: 1,
        passed: 1,
        failed: 0,
        fallback_only: 0,
        waived: 0,
        missing_blocking: 1,
      },
      evals: [
        {
          id: "sample.present",
          blocking: true,
          status: "passed",
          result: { gate_status: "passed", passed: true },
        },
        {
          id: "sample.missing",
          blocking: true,
          status: "missing",
          result: null,
        },
      ],
      missing: [{ eval_id: "sample.missing", blocking: true, reason: "missing blocking result" }],
      issues: [],
    },
    artifacts: [
      artifact("reports/eval-index.json"),
      artifact("reports/eval-dashboard.md"),
      artifact("reports/consumer-radar/quality/native-checks.json"),
      artifact("reports/consumer-radar/reviews/kimi-feedback.json"),
      artifact("reports/consumer-radar/review-consensus.json"),
    ],
    ledgerEvents: [
      {
        run_id: "fabro-failed",
        workflow: "consumer-radar",
        event_kind: "failure_classified",
        current_status: "failed",
        failure_class: "eval_gate_failed",
        next_action: "fix missing eval evidence",
        recorded_at: "2026-05-18T12:15:00.000Z",
      },
      {
        run_id: "fabro-complete",
        workflow: "consumer-radar",
        event_kind: "completed",
        current_status: "completed",
        recorded_at: "2026-05-18T12:20:00.000Z",
      },
    ],
  });

  assert.equal(dashboard.status, "attention_required");
  assert.equal(dashboard.working, false);
  assert.equal(dashboard.production.artifacts.total, 5);
  assert.equal(dashboard.production.runs.total, 2);
  assert.equal(dashboard.production.runs.completed, 1);
  assert.equal(dashboard.production.runs.failed, 1);
  assert.equal(dashboard.quality.missing_blocking, 1);
  assert.equal(dashboard.owner_rollup.status, "attention_required");
  assert.equal(dashboard.owner_rollup.key_metrics.factory_status, "attention_required");
  assert.equal(dashboard.owner_rollup.key_metrics.report_artifacts, 5);
  assert.ok(dashboard.owner_rollup.owner_actions.length <= 3);
  assert.ok(dashboard.owner_rollup.owner_actions.some((item) => item.action.includes("Assign Quincy")));
  assert.equal(dashboard.agent_access.daily_owner, "quincy");
  assert.deepEqual(dashboard.agent_access.required_outputs, [
    "reports/factory-dashboard.md",
    "reports/factory-health.json",
  ]);
  assert.ok(dashboard.attention_items.some((item) => item.title.includes("Missing blocking eval evidence")));
  assert.ok(dashboard.attention_items.some((item) => item.title.includes("Failed Fabro runs")));

  const markdown = renderFactoryDashboard(dashboard);
  assert.match(markdown, /# Factory Dashboard/);
  assert.match(markdown, /## Owner Rollup/);
  assert.match(markdown, /ATTENTION REQUIRED/);
  assert.match(markdown, /sample\.missing/);
  assert.match(markdown, /fabro-failed/);
});

test("factory dashboard is working when blocking evals pass and runs complete", () => {
  const dashboard = buildFactoryDashboard({
    now: "2026-05-18T13:00:00.000Z",
    evalIndex: {
      created_at: "2026-05-18T12:00:00.000Z",
      summary: {
        total_registered: 1,
        blocking_registered: 1,
        present_results: 1,
        passed: 1,
        failed: 0,
        fallback_only: 0,
        waived: 0,
        missing_blocking: 0,
      },
      evals: [
        {
          id: "sample.present",
          blocking: true,
          status: "passed",
          result: { gate_status: "passed", passed: true },
        },
      ],
      missing: [],
      issues: [],
    },
    artifacts: [artifact("reports/evals/run-1/sample.present.json")],
    ledgerEvents: [
      {
        run_id: "fabro-complete",
        workflow: "consumer-radar",
        event_kind: "completed",
        current_status: "completed",
        recorded_at: "2026-05-18T12:20:00.000Z",
      },
    ],
  });

  assert.equal(dashboard.status, "working");
  assert.equal(dashboard.working, true);
  assert.deepEqual(dashboard.attention_items, []);
  assert.match(renderFactoryDashboard(dashboard), /WORKING/);
});

test("renderer writes agent-readable factory health JSON", () => {
  const root = mkdtempSync(join(tmpdir(), "factory-health-cli-"));
  try {
    const reportsRoot = join(root, "reports");
    const evalIndexPath = join(reportsRoot, "eval-index.json");
    const markdownOut = join(reportsRoot, "factory-dashboard.md");
    const jsonOut = join(reportsRoot, "factory-health.json");

    mkdirSync(reportsRoot, { recursive: true });
    writeFileSync(
      evalIndexPath,
      `${JSON.stringify(
        {
          schema_version: 1,
          created_at: "2026-05-18T12:00:00.000Z",
          summary: {
            total_registered: 1,
            blocking_registered: 1,
            present_results: 0,
            passed: 0,
            failed: 0,
            fallback_only: 0,
            waived: 0,
            missing_blocking: 1,
          },
          evals: [{ id: "sample.missing", blocking: true, result: null }],
          missing: [{ eval_id: "sample.missing", blocking: true, reason: "missing blocking result" }],
          issues: [],
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(join(reportsRoot, "quality-report.json"), "{}\n");

    const result = spawnSync(process.execPath, [
      CLI_PATH,
      "--eval-index",
      evalIndexPath,
      "--reports-root",
      reportsRoot,
      "--out",
      markdownOut,
      "--json-out",
      jsonOut,
    ], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    assert.equal(result.status, 0, result.stderr);
    const health = JSON.parse(readFileSync(jsonOut, "utf8"));
    assert.equal(health.schema_version, 1);
    assert.equal(health.owner_rollup.status, "attention_required");
    assert.equal(health.agent_access.daily_owner, "quincy");
    assert.ok(health.owner_rollup.owner_actions[0].title.includes("Missing blocking eval evidence"));
    assert.match(readFileSync(markdownOut, "utf8"), /Owner Rollup/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderer auto-discovers default Hermes JSONL run ledger", () => {
  const root = mkdtempSync(join(tmpdir(), "factory-health-auto-ledger-"));
  try {
    const hermesHome = join(root, ".hermes");
    const reportsRoot = join(root, "reports");
    const ledgerPath = join(hermesHome, "profiles", "maestro-operator", "state", "fabro-run-ledger.jsonl");
    const evalIndexPath = join(reportsRoot, "eval-index.json");
    const markdownOut = join(reportsRoot, "factory-dashboard.md");
    const jsonOut = join(reportsRoot, "factory-health.json");

    mkdirSync(dirname(ledgerPath), { recursive: true });
    mkdirSync(reportsRoot, { recursive: true });
    writeFileSync(
      ledgerPath,
      `${JSON.stringify({
        recorded_at: "2026-05-18T12:20:00.000Z",
        run_id: "auto-run",
        workflow_file: "workflows/factory/workflow-builder.fabro",
        event_kind: "completed",
        current_status: "completed",
        next_action: "none",
      })}\n`,
    );
    writeFileSync(
      evalIndexPath,
      `${JSON.stringify(
        {
          schema_version: 1,
          created_at: "2026-05-18T12:00:00.000Z",
          summary: {
            total_registered: 1,
            blocking_registered: 1,
            present_results: 1,
            passed: 1,
            failed: 0,
            fallback_only: 0,
            waived: 0,
            missing_blocking: 0,
          },
          evals: [{ id: "sample.present", blocking: true, result: { gate_status: "passed", passed: true } }],
          missing: [],
          issues: [],
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(join(reportsRoot, "artifact.json"), "{}\n");

    const result = spawnSync(process.execPath, [
      CLI_PATH,
      "--eval-index",
      evalIndexPath,
      "--reports-root",
      reportsRoot,
      "--out",
      markdownOut,
      "--json-out",
      jsonOut,
    ], {
      cwd: root,
      env: { ...process.env, HERMES_HOME: hermesHome },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    assert.equal(result.status, 0, result.stderr);
    const health = JSON.parse(readFileSync(jsonOut, "utf8"));
    assert.equal(health.production.runs.total, 1);
    assert.equal(health.production.runs.completed, 1);
    assert.equal(health.production.runs.source_connected, true);
    assert.equal(health.sources.run_ledger, ledgerPath);
    assert.ok(!health.attention_items.some((item) => item.title === "Run ledger not connected"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("default run ledger sources include profile and legacy Hermes paths", () => {
  assert.deepEqual(defaultRunLedgerSources({ hermesHome: "/tmp/hermes", profile: "maestro-operator" }), [
    "/tmp/hermes/profiles/maestro-operator/state/fabro-run-ledger.jsonl",
    "/tmp/hermes/profiles/maestro-operator/state/fabro-run-ledger.sqlite",
    "/tmp/hermes/state/fabro-run-ledger.jsonl",
    "/tmp/hermes/state/fabro-run-ledger.sqlite",
  ]);
});

test("sqlite run ledger reader maps current run rows", (t) => {
  if (!sqliteAvailable()) t.skip("sqlite3 unavailable");

  const root = mkdtempSync(join(tmpdir(), "factory-health-sqlite-ledger-"));
  try {
    const dbPath = join(root, "fabro-run-ledger.sqlite");
    const result = spawnSync("sqlite3", [
      dbPath,
      `CREATE TABLE fabro_runs (
        run_id TEXT PRIMARY KEY,
        workflow_file TEXT,
        current_status TEXT NOT NULL,
        current_node TEXT,
        next_node_id TEXT,
        failure_class TEXT,
        latest_git_sha TEXT,
        run_branch TEXT,
        sandbox_name TEXT,
        sandbox_id TEXT,
        next_action TEXT,
        updated_at TEXT
      );
      INSERT INTO fabro_runs (
        run_id, workflow_file, current_status, current_node, next_node_id,
        failure_class, latest_git_sha, run_branch, sandbox_name, sandbox_id,
        next_action, updated_at
      ) VALUES (
        'sqlite-run', 'workflows/factory/workflow-builder.fabro', 'failed',
        'quality_gate', NULL, 'quality_gate', 'abc123', 'factory/sqlite-run',
        NULL, NULL, 'fix eval evidence', '2026-05-18T12:30:00.000Z'
      );`,
    ], { encoding: "utf8" });

    assert.equal(result.status, 0, result.stderr);
    const parsed = readRunLedgerSource(dbPath);
    assert.equal(parsed.events.length, 1);
    assert.equal(parsed.events[0].run_id, "sqlite-run");
    assert.equal(parsed.events[0].current_status, "failed");
    assert.equal(parsed.events[0].failure_class, "quality_gate");
    assert.deepEqual(parsed.issues, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("factory dashboard flags missing run ledger coverage", () => {
  const dashboard = buildFactoryDashboard({
    now: "2026-05-18T13:00:00.000Z",
    evalIndex: {
      created_at: "2026-05-18T12:00:00.000Z",
      summary: {
        total_registered: 1,
        blocking_registered: 1,
        present_results: 1,
        passed: 1,
        failed: 0,
        fallback_only: 0,
        waived: 0,
        missing_blocking: 0,
      },
      evals: [
        {
          id: "sample.present",
          blocking: true,
          status: "passed",
          result: { gate_status: "passed", passed: true },
        },
      ],
      missing: [],
      issues: [],
    },
    artifacts: [artifact("reports/evals/run-1/sample.present.json")],
    ledgerEvents: [],
    sources: { run_ledger: null },
  });

  assert.equal(dashboard.status, "attention_required");
  assert.ok(dashboard.attention_items.some((item) => item.title.includes("Run ledger not connected")));
  assert.match(renderFactoryDashboard(dashboard), /not connected/);
});

test("factory dashboard flags unknown run status and sanitizes malformed workflow labels", () => {
  const dashboard = buildFactoryDashboard({
    now: "2026-05-18T13:00:00.000Z",
    evalIndex: {
      created_at: "2026-05-18T12:00:00.000Z",
      summary: {
        total_registered: 1,
        blocking_registered: 1,
        present_results: 1,
        passed: 1,
        failed: 0,
        fallback_only: 0,
        waived: 0,
        missing_blocking: 0,
      },
      evals: [
        {
          id: "sample.present",
          blocking: true,
          status: "passed",
          result: { gate_status: "passed", passed: true },
        },
      ],
      missing: [],
      issues: [],
    },
    artifacts: [artifact("reports/evals/run-1/sample.present.json")],
    ledgerEvents: [
      {
        run_id: "run-unknown",
        workflow_file: "[object Object]",
        event_kind: "observed",
        current_status: "unknown",
        recorded_at: "2026-05-18T12:20:00.000Z",
      },
    ],
    sources: { run_ledger: "ledger.jsonl" },
  });

  assert.equal(dashboard.status, "attention_required");
  assert.ok(dashboard.attention_items.some((item) => item.title.includes("Unknown Fabro run status")));
  const markdown = renderFactoryDashboard(dashboard);
  assert.match(markdown, /run-unknown: unknown/);
  assert.doesNotMatch(markdown, /\[object Object\]/);
});

test("report discovery categorizes generated artifacts and excludes dashboard self-output", () => {
  const root = mkdtempSync(join(tmpdir(), "factory-dashboard-"));
  try {
    const paths = [
      "reports/.DS_Store",
      "reports/factory-dashboard.md",
      "reports/evals/run-1/result.json",
      "reports/eval-index.json",
      "reports/consumer-radar/quality/native-checks.json",
      "reports/consumer-radar/reviews/kimi-feedback.json",
      "reports/consumer-radar/review-consensus.json",
    ];

    for (const path of paths) {
      const absolutePath = join(root, path);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, "{}\n");
    }

    const artifacts = discoverReportArtifacts(join(root, "reports"), { repoRoot: root });
    assert.deepEqual(
      artifacts.map((item) => item.path),
      [
        "reports/consumer-radar/quality/native-checks.json",
        "reports/consumer-radar/review-consensus.json",
        "reports/consumer-radar/reviews/kimi-feedback.json",
        "reports/eval-index.json",
        "reports/evals/run-1/result.json",
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("jsonl parser keeps valid ledger events and reports malformed lines", () => {
  const parsed = parseJsonlEvents(
    [
      JSON.stringify({ run_id: "run-1", current_status: "completed" }),
      "",
      "not-json",
      JSON.stringify({ run_id: "run-2", current_status: "failed" }),
    ].join("\n"),
    "ledger.jsonl",
  );

  assert.equal(parsed.events.length, 2);
  assert.equal(parsed.issues.length, 1);
  assert.equal(parsed.issues[0].type, "malformed_jsonl");
  assert.equal(parsed.issues[0].line, 3);
});

test("jsonl reader reports a configured missing ledger file", () => {
  const root = mkdtempSync(join(tmpdir(), "factory-dashboard-missing-ledger-"));
  try {
    const parsed = readJsonlEvents(join(root, "missing.jsonl"));
    assert.deepEqual(parsed.events, []);
    assert.equal(parsed.issues.length, 1);
    assert.equal(parsed.issues[0].type, "missing_jsonl");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
