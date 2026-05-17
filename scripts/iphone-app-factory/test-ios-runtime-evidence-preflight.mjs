#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptPath = "scripts/iphone-app-factory/ios-runtime-evidence-preflight.mjs";

function runPreflight(args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: "/tmp/nonexistent-ios-runtime-bin",
    },
  });
}

test("iOS runtime preflight can record hosted-worker blocker without failing the stage", () => {
  const dir = mkdtempSync(join(tmpdir(), "ios-runtime-preflight-"));
  try {
    const reportPath = join(dir, "preflight.json");
    const blockerPath = join(dir, "blocker.md");
    const result = runPreflight([
      "--manifest",
      join(dir, "missing-manifest.json"),
      "--out",
      reportPath,
      "--blocker",
      blockerPath,
      "--success-on-blocker",
    ]);

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    assert.equal(report.ok, false);
    assert.equal(report.failure_classification, "app build/test");
    assert.deepEqual(report.failures, [
      "missing screenshot manifest and no hosted macOS/iOS runtime tools are available",
    ]);
    assert.match(readFileSync(blockerPath, "utf8"), /iOS Runtime Evidence Blocker/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("iOS runtime preflight still fails missing runtime blockers by default", () => {
  const dir = mkdtempSync(join(tmpdir(), "ios-runtime-preflight-"));
  try {
    const result = runPreflight([
      "--manifest",
      join(dir, "missing-manifest.json"),
      "--out",
      join(dir, "preflight.json"),
      "--blocker",
      join(dir, "blocker.md"),
    ]);

    assert.equal(result.status, 1, result.stderr || result.stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
