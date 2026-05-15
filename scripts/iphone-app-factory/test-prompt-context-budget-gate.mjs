#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/prompt-context-budget-gate.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "context-budget-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("prompt context budget gate rejects oversized prompt materialization inputs", () => {
  withTempDir((dir) => {
    const root = join(dir, ".workflow/iphone-app-factory");
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "stage-stdout.log"), "x".repeat(2048));

    const result = spawnSync(process.execPath, [
      script,
      "--root",
      root,
      "--out",
      join(root, "prompt-context-budget.json"),
      "--max-file-bytes",
      "1024",
      "--max-total-bytes",
      "4096",
    ], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /context file exceeds max size/);
    const report = JSON.parse(readFileSync(join(root, "prompt-context-budget.json"), "utf8"));
    assert.equal(report.ok, false);
    assert.match(report.next_action, /compact/);
  });
});

test("prompt context budget gate accepts compact workflow context", () => {
  withTempDir((dir) => {
    const root = join(dir, ".workflow/iphone-app-factory");
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "summary.md"), "compact summary\n");
    const result = spawnSync(process.execPath, [
      script,
      "--root",
      root,
      "--out",
      join(root, "prompt-context-budget.json"),
    ], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(join(root, "prompt-context-budget.json"), "utf8"));
    assert.equal(report.ok, true);
  });
});
