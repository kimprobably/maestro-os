#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/ios-ci-gate.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "ios-ci-gate-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(cwd, appDir, extra = []) {
  return spawnSync(process.execPath, [script, appDir, "--mode", "github", "--allow-deferred", "false", ...extra], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeWorkflow(appDir) {
  mkdirSync(join(appDir, ".github/workflows"), { recursive: true });
  writeFileSync(join(appDir, ".github/workflows/ios-quality.yml"), "jobs:\n  ios:\n    runs-on: macos-15\n    steps:\n      - run: xcodebuild test\n");
}

test("ios-ci-gate rejects workflow-only evidence when deferral is disabled", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    writeWorkflow(appDir);
    const result = run(dir, appDir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing hosted GitHub Actions iOS evidence/);
  });
});

test("ios-ci-gate accepts hosted GitHub Actions report with run id, sha, conclusion, and artifacts", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    writeWorkflow(appDir);
    mkdirSync(join(appDir, "reports/ios"), { recursive: true });
    writeFileSync(join(appDir, "reports/ios/ios-quality-report.json"), JSON.stringify({
      ok: true,
      github_actions: {
        run_id: 123456,
        commit_sha: "abcdef123456",
        conclusion: "success",
        artifacts: [{ name: "ios-quality-report" }, { name: "appium-exploratory-report" }],
      },
    }));
    const result = run(dir, appDir);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/iphone-app-factory/ios-ci-gate.json"), "utf8"));
    assert.equal(report.status, "passed_github_actions");
  });
});
