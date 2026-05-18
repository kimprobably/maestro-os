#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/evals/evaluate-call-artifact.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "call-artifact-eval-"));
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

test("missing last message causes evaluator to exit non-zero", () => {
  withTempDir((dir) => {
    const callReport = join(dir, "call.json");
    const out = join(dir, "result.json");
    writeFileSync(callReport, `${JSON.stringify({ ok: true, status: 0 }, null, 2)}\n`);

    const result = run([
      "--eval-id",
      "iphone-feature.implementation.call",
      "--call-report",
      callReport,
      "--last-message",
      join(dir, "missing.md"),
      "--out",
      out,
    ]);

    assert.notEqual(result.status, 0);
  });
});

test("valid call report and last message writes normalized pass", () => {
  withTempDir((dir) => {
    mkdirSync(dir, { recursive: true });
    const callReport = join(dir, "call.json");
    const lastMessage = join(dir, "last.md");
    const out = join(dir, "result.json");
    writeFileSync(callReport, `${JSON.stringify({ ok: true, status: 0, model: "gpt-5.3-codex" }, null, 2)}\n`);
    writeFileSync(lastMessage, "Implemented the requested feature and wrote verification artifacts.\n");

    const result = run([
      "--eval-id",
      "iphone-feature.implementation.call",
      "--call-report",
      callReport,
      "--last-message",
      lastMessage,
      "--out",
      out,
    ]);

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(readFileSync(out, "utf8"));
    assert.equal(payload.eval_id, "iphone-feature.implementation.call");
    assert.equal(payload.level, "call");
    assert.equal(payload.runner, "deterministic");
    assert.equal(payload.gate_status, "passed");
  });
});

test("JSON primitive call report fails as malformed", () => {
  withTempDir((dir) => {
    const callReport = join(dir, "call.json");
    const lastMessage = join(dir, "last.md");
    const out = join(dir, "result.json");
    writeFileSync(callReport, "null\n");
    writeFileSync(lastMessage, "Implemented the requested feature and wrote verification artifacts.\n");

    const result = run([
      "--eval-id",
      "iphone-feature.implementation.call",
      "--call-report",
      callReport,
      "--last-message",
      lastMessage,
      "--out",
      out,
    ]);

    assert.notEqual(result.status, 0);
    const payload = JSON.parse(readFileSync(out, "utf8"));
    assert.equal(payload.gate_status, "failed");
    assert.equal(payload.metadata.failures.includes("call report must be a JSON object"), true);
  });
});
