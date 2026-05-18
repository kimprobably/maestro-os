#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/fabro/babysit-run.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "fabro-babysit-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("babysit-run classifies events and writes redacted Hermes JSONL ledger entries", () => {
  withTempDir((dir) => {
    const eventsFile = join(dir, "events.json");
    const fakeSecret = ["sk-or-v1", "secret"].join("-");
    writeFileSync(eventsFile, JSON.stringify({
      projection: {
        status: "failed",
        current_node: "simplification",
        git_commit_sha: "abc123",
        branch: "run/waketask",
      },
      events: [
        {
          cursor: 10,
          id: "evt-10",
          type: "stage.failed",
          status: "failed",
          message: `dns error while contacting proxy.app.daytona.io with OPENROUTER_API_KEY=${fakeSecret}`,
        },
      ],
    }));

    const result = run([
      "--run-id",
      "run-test",
      "--events-file",
      eventsFile,
      "--home",
      dir,
      "--force-jsonl",
      "--once",
      "--no-fail-on-terminal-failure",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.failure_class, "transient_infra");
    assert.equal(summary.last_event_cursor, 10);
    assert.doesNotMatch(result.stdout, new RegExp(fakeSecret));

    const ledgerPath = join(dir, "profiles/maestro-operator/state/fabro-run-ledger.jsonl");
    const ledger = readFileSync(ledgerPath, "utf8");
    assert.match(ledger, /transient_infra/);
    assert.match(ledger, /\[redacted\]/);
    assert.doesNotMatch(ledger, new RegExp(fakeSecret));
  });
});

test("babysit-run supports command event sources", () => {
  withTempDir((dir) => {
    const payload = JSON.stringify({
      projection: { status: "running", current_node: "research" },
      events: [{ cursor: 1, id: "evt-1", type: "stage.running", status: "running", message: "research started" }],
    }).replaceAll("'", "'\\''");
    const result = run([
      "--run-id",
      "run-command",
      "--event-command",
      `printf '%s' '${payload}'`,
      "--home",
      dir,
      "--force-jsonl",
      "--once",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.current_status, "running");
    assert.equal(summary.next_action, "continue polling Fabro events");
  });
});
