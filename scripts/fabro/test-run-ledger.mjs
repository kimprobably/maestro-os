#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const ledger = join(repoRoot, "scripts/fabro/run-ledger.mjs");

function withTempHome(fn) {
  const dir = mkdtempSync(join(tmpdir(), "hermes-ledger-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runLedger(args, cwd) {
  return spawnSync(process.execPath, [ledger, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function sqliteAvailable() {
  return spawnSync("sqlite3", ["--version"], { encoding: "utf8" }).status === 0;
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

test("run-ledger initializes JSONL fallback and appends redacted event", () => {
  withTempHome((home) => {
    const fakeSecret = ["sk-or-v1", "secret"].join("-");
    const init = runLedger(["init", "--home", home, "--force-jsonl"], repoRoot);
    assert.equal(init.status, 0, init.stderr);
    const initReport = JSON.parse(init.stdout);
    assert.equal(initReport.storage, "jsonl");

    const append = runLedger(
      [
        "append-event",
        "--home",
        home,
        "--force-jsonl",
        "--run-id",
        "01TEST",
        "--event-kind",
        "failure_classified",
        "--current-status",
        "failed",
        "--failure-class",
        "transient_infra",
        "--next-action",
        "retry same stage",
        "--payload-json",
        JSON.stringify({ OPENROUTER_API_KEY: fakeSecret, note: "dns failure" }),
      ],
      repoRoot,
    );
    assert.equal(append.status, 0, append.stderr);
    const appendReport = JSON.parse(append.stdout);
    const jsonl = readFileSync(appendReport.path, "utf8");
    assert.match(jsonl, /\[redacted\]/);
    assert.doesNotMatch(jsonl, new RegExp(fakeSecret));

    const summary = runLedger(["summarize-run", "--home", home, "--force-jsonl", "--run-id", "01TEST"], repoRoot);
    assert.equal(summary.status, 0, summary.stderr);
    const summaryReport = JSON.parse(summary.stdout);
    assert.equal(summaryReport.summary.failure_class, "transient_infra");
  });
});

test("run-ledger mirrors Fabro append events into operator ledger", (t) => {
  if (!sqliteAvailable()) t.skip("sqlite3 unavailable");
  withTempHome((home) => {
    const fakeSecret = ["sk-or-v1", "secret"].join("-");
    const append = runLedger(
      [
        "append-event",
        "--home",
        home,
        "--run-id",
        "01MIRROR",
        "--event-kind",
        "status_changed",
        "--current-status",
        "running",
        "--next-action",
        "poll",
        "--payload-json",
        JSON.stringify({ OPENROUTER_API_KEY: fakeSecret, note: "started" }),
      ],
      repoRoot,
    );
    assert.equal(append.status, 0, append.stderr);

    assert.equal(sqlite(home, "SELECT subject_type || ':' || subject_key FROM ledger_subjects WHERE subject_type='fabro_run';"), "fabro_run:01MIRROR");
    assert.equal(sqlite(home, "SELECT event_type FROM ledger_events WHERE subject_type='fabro_run' AND subject_key='01MIRROR';"), "fabro.status_changed");
    const payload = sqlite(home, "SELECT payload_json FROM ledger_events WHERE subject_type='fabro_run' AND subject_key='01MIRROR';");
    assert.match(payload, /\[redacted\]/);
    assert.doesNotMatch(payload, new RegExp(fakeSecret));
  });
});
