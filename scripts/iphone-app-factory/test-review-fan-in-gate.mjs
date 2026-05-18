#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const gate = join(repoRoot, "scripts/iphone-app-factory/review-fan-in-gate.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "review-fan-in-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runGate(cwd, args = []) {
  return spawnSync(process.execPath, [gate, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("review fan-in gate rejects any source rejected verdict", () => {
  withTempDir((dir) => {
    const reviews = join(dir, ".workflow/iphone-app-factory/reviews");
    mkdirSync(reviews, { recursive: true });
    writeFileSync(join(reviews, "implementation-correctness.md"), "Looks fine.\nVERDICT: APPROVED\n");
    writeFileSync(join(reviews, "implementation-tests.md"), "- blocking: fake Appium evidence\nVERDICT: REJECTED\n");
    writeFileSync(join(reviews, "implementation-security.md"), "No issues.\nVERDICT: APPROVED\n");
    writeFileSync(join(reviews, "implementation-boilerplate.md"), "No rebuild.\nVERDICT: APPROVED\n");

    const result = runGate(dir, ["--mode", "implementation"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /review rejected/);
    assert.match(result.stderr, /blocking finding/);
  });
});

test("review fan-in gate accepts all approved source reviews", () => {
  withTempDir((dir) => {
    const reviews = join(dir, ".workflow/iphone-app-factory/reviews");
    mkdirSync(reviews, { recursive: true });
    for (const name of [
      "implementation-correctness.md",
      "implementation-tests.md",
      "implementation-security.md",
      "implementation-boilerplate.md",
    ]) {
      writeFileSync(join(reviews, name), "Reviewed.\nVERDICT: APPROVED\n");
    }

    const result = runGate(dir, ["--mode", "implementation"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok":true/);
  });
});
