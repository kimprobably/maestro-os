#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const ledger = join(repoRoot, "scripts/operator-ledger/operator-ledger.mjs");
const contextBuilder = join(repoRoot, "scripts/operator-ledger/slack-thread-context.mjs");

function withTempHome(fn) {
  const dir = mkdtempSync(join(tmpdir(), "operator-ledger-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runScript(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runLedger(args) {
  return runScript(ledger, args);
}

function runContext(args) {
  return runScript(contextBuilder, args);
}

function sqlite(home, sql) {
  const db = join(home, "profiles/maestro-operator/state/operator-ledger.sqlite");
  const result = spawnSync("sqlite3", [db, sql], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test("operator-ledger initializes sqlite schema", () => {
  withTempHome((home) => {
    const init = runLedger(["init", "--home", home]);
    assert.equal(init.status, 0, init.stderr);
    const report = JSON.parse(init.stdout);
    assert.equal(report.storage, "sqlite");

    const tables = sqlite(home, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
      .split("\n")
      .filter(Boolean);
    assert.deepEqual(
      tables.filter((name) => name.startsWith("ledger_")),
      [
        "ledger_actions",
        "ledger_checkpoints",
        "ledger_cursors",
        "ledger_events",
        "ledger_links",
        "ledger_subjects",
      ],
    );
  });
});

test("operator-ledger appends redacted idempotent events and summarizes subjects", () => {
  withTempHome((home) => {
    const fakeSecret = ["xoxb", "secret", "token"].join("-");
    const baseArgs = [
      "--home",
      home,
      "--subject-type",
      "slack_thread",
      "--subject-key",
      "C123:171000.1",
      "--event-type",
      "slack.message.received",
      "--source",
      "slack",
      "--external-id",
      "C123:171000.2",
      "--summary",
      "Tim asked Miles to babysit a run",
      "--payload-json",
      JSON.stringify({
        text: `please inspect this token ${fakeSecret}`,
        SLACK_BOT_TOKEN: fakeSecret,
      }),
    ];

    const first = runLedger(["append-event", ...baseArgs]);
    assert.equal(first.status, 0, first.stderr);
    const second = runLedger(["append-event", ...baseArgs]);
    assert.equal(second.status, 0, second.stderr);

    assert.equal(sqlite(home, "SELECT COUNT(*) FROM ledger_events;"), "1");
    assert.equal(sqlite(home, "SELECT subject_type || ':' || subject_key FROM ledger_subjects;"), "slack_thread:C123:171000.1");

    const payload = sqlite(home, "SELECT payload_json FROM ledger_events LIMIT 1;");
    assert.match(payload, /\[redacted\]/);
    assert.doesNotMatch(payload, new RegExp(fakeSecret));

    const checkpoint = runLedger([
      "upsert-checkpoint",
      "--home",
      home,
      "--subject-type",
      "slack_thread",
      "--subject-key",
      "C123:171000.1",
      "--summary",
      "Older thread context was compacted.",
      "--state-json",
      JSON.stringify({ goal: "debug Slack reliability" }),
    ]);
    assert.equal(checkpoint.status, 0, checkpoint.stderr);

    const summary = runLedger([
      "summarize-subject",
      "--home",
      home,
      "--subject-type",
      "slack_thread",
      "--subject-key",
      "C123:171000.1",
    ]);
    assert.equal(summary.status, 0, summary.stderr);
    const report = JSON.parse(summary.stdout);
    assert.equal(report.summary.checkpoint.summary, "Older thread context was compacted.");
    assert.equal(report.summary.recent_events.length, 1);
  });
});

test("operator-ledger JSONL fallback redacts events", () => {
  withTempHome((home) => {
    const fakeSecret = ["lin_api", "secret"].join("_");
    const append = runLedger([
      "append-event",
      "--home",
      home,
      "--force-jsonl",
      "--subject-type",
      "slack_thread",
      "--subject-key",
      "C123:171000.1",
      "--event-type",
      "slack.message.received",
      "--source",
      "slack",
      "--external-id",
      "C123:171000.2",
      "--payload-json",
      JSON.stringify({ LINEAR_API_KEY: fakeSecret, text: fakeSecret }),
    ]);
    assert.equal(append.status, 0, append.stderr);
    const report = JSON.parse(append.stdout);
    const jsonl = readFileSync(report.path, "utf8");
    assert.match(jsonl, /\[redacted\]/);
    assert.doesNotMatch(jsonl, new RegExp(fakeSecret));
  });
});

test("slack-thread-context returns current, recent messages, checkpoint, and links", () => {
  withTempHome((home) => {
    const subjectArgs = [
      "--home",
      home,
      "--subject-type",
      "slack_thread",
      "--subject-key",
      "C123:171000.1",
      "--source",
      "slack",
    ];
    for (let i = 1; i <= 6; i += 1) {
      const append = runLedger([
        "append-event",
        ...subjectArgs,
        "--event-type",
        "slack.message.received",
        "--external-id",
        `C123:171000.${i}`,
        "--payload-json",
        JSON.stringify({ user: i % 2 ? "tim" : "miles", text: `message ${i}` }),
      ]);
      assert.equal(append.status, 0, append.stderr);
    }

    const checkpoint = runLedger([
      "upsert-checkpoint",
      "--home",
      home,
      "--subject-type",
      "slack_thread",
      "--subject-key",
      "C123:171000.1",
      "--summary",
      "Messages 1-3 were compacted into this summary.",
      "--state-json",
      JSON.stringify({ open_question: "why Slack was flaky" }),
    ]);
    assert.equal(checkpoint.status, 0, checkpoint.stderr);

    const link = runLedger([
      "link-subjects",
      "--home",
      home,
      "--from-type",
      "slack_thread",
      "--from-key",
      "C123:171000.1",
      "--to-type",
      "fabro_run",
      "--to-key",
      "01RUN",
      "--relationship",
      "controls",
    ]);
    assert.equal(link.status, 0, link.stderr);

    const context = runContext([
      "--home",
      home,
      "--subject-key",
      "C123:171000.1",
      "--current-event-id",
      "C123:171000.6",
      "--recent-limit",
      "2",
    ]);
    assert.equal(context.status, 0, context.stderr);
    const payload = JSON.parse(context.stdout);
    assert.equal(payload.current_message.payload.text, "message 6");
    assert.deepEqual(payload.recent_messages.map((event) => event.payload.text), ["message 4", "message 5"]);
    assert.equal(payload.checkpoint.summary, "Messages 1-3 were compacted into this summary.");
    assert.equal(payload.linked_subjects[0].to_type, "fabro_run");

    const raw = JSON.stringify(payload);
    assert.doesNotMatch(raw, /message 1/);
    assert.doesNotMatch(raw, /message 2/);
    assert.doesNotMatch(raw, /message 3/);
    assert.match(payload.trust_boundary, /untrusted context/);
  });
});
