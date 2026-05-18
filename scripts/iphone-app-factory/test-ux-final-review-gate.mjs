#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const gate = join(repoRoot, "scripts/iphone-app-factory/ux-final-review-gate.mjs");
const required = [
  ".workflow/iphone-app-ux-studio/reviews/ux-quality.md",
  ".workflow/iphone-app-ux-studio/reviews/accessibility.md",
  ".workflow/iphone-app-factory/reviews/product-fidelity.md",
  ".workflow/iphone-app-factory/reviews/ios-architecture.md",
  ".workflow/iphone-app-factory/reviews/security-privacy.md",
  ".workflow/iphone-app-factory/reviews/release-readiness.md",
];

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "ux-final-review-gate-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function write(path, body, cwd) {
  const full = join(cwd, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, body);
}

function runGate(cwd) {
  return spawnSync(process.execPath, [gate], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("UX final review gate accepts all required approved reviews", () => {
  withTempDir((dir) => {
    for (const path of required) write(path, "# Review\n\nNo blocking issues.\n\nVERDICT: APPROVED\n", dir);
    const result = runGate(dir);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/iphone-app-ux-studio/final-review-gate.json"), "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.reviews.length, required.length);
  });
});

test("UX final review gate rejects missing, rejected, blocking, and secret-bearing reviews", () => {
  withTempDir((dir) => {
    write(required[0], "# Review\n\nVERDICT: APPROVED\n", dir);
    write(required[1], "# Review\n\nVERDICT: REJECTED\n", dir);
    write(required[2], "# Review\n\n- blocking: screenshots missing\n\nVERDICT: APPROVED\n", dir);
    write(required[3], "# Review\n\napi_key = sk-or-v1-secret-value\n\nVERDICT: APPROVED\n", dir);
    write(required[4], "# Review\n\nVERDICT: APPROVED\n", dir);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing review artifact/);
    assert.match(result.stderr, /review rejected/);
    assert.match(result.stderr, /blocking finding/);
    assert.match(result.stderr, /secret-looking value/);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/iphone-app-ux-studio/final-review-gate.json"), "utf8"));
    assert.equal(report.ok, false);
  });
});
