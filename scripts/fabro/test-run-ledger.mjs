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
