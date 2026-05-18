#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/artifact-metadata-gate.mjs");

function sh(cwd, command) {
  const result = spawnSync("sh", ["-lc", command], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "artifact-metadata-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeApp(dir) {
  const appDir = join(dir, "apps/waketask-iphone");
  mkdirSync(join(appDir, ".github/workflows"), { recursive: true });
  mkdirSync(join(appDir, "reports/ios"), { recursive: true });
  writeFileSync(join(appDir, "README.md"), "# WakeTask\n");
  writeFileSync(join(appDir, ".github/workflows/ios-quality.yml"), "jobs:\n  ios:\n    runs-on: macos-15\n");
  writeFileSync(join(appDir, "reports/ios/ios-quality-report.json"), "{\"ok\":true}\n");
  writeFileSync(join(appDir, "reports/ios/appium-exploratory-report.json"), "{\"ok\":true}\n");
  return "apps/waketask-iphone";
}

test("artifact metadata gate verifies generated app artifacts and pushed branch", () => {
  withTempDir((dir) => {
    const appDir = writeApp(dir);
    const bare = join(dir, "remote.git");
    sh(dir, "git init -b main && git config user.email test@example.com && git config user.name Test");
    sh(dir, `git add . && git commit -m init && git init --bare ${JSON.stringify(bare)} && git remote add origin ${JSON.stringify(bare)} && git push -u origin main`);

    const result = spawnSync(process.execPath, [script, appDir, "--remote", bare], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/iphone-app-factory/artifact-metadata-gate.json"), "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.metadata_push.ok, true);
    assert.match(JSON.stringify(report.app_github_workflows), /ios-quality.yml/);
  });
});

test("artifact metadata gate fails when metadata branch is not pushed", () => {
  withTempDir((dir) => {
    const appDir = writeApp(dir);
    sh(dir, "git init -b main && git config user.email test@example.com && git config user.name Test && git add . && git commit -m init");
    const result = spawnSync(process.execPath, [script, appDir], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not visible on origin/);
  });
});
