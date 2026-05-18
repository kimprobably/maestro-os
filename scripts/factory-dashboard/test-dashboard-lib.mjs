import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  buildFactoryDashboard,
  discoverReportArtifacts,
  parseJsonlEvents,
  readJsonlEvents,
  renderFactoryDashboard,
} from "./dashboard-lib.mjs";

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
  assert.ok(dashboard.attention_items.some((item) => item.title.includes("Missing blocking eval evidence")));
  assert.ok(dashboard.attention_items.some((item) => item.title.includes("Failed Fabro runs")));

  const markdown = renderFactoryDashboard(dashboard);
  assert.match(markdown, /# Factory Dashboard/);
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
