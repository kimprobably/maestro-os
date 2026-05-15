#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const gate = join(repoRoot, "scripts/iphone-app-factory/appium-report-gate.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "appium-gate-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeReport(dir, payload) {
  const reports = join(dir, "apps/demo-iphone/reports/ios");
  mkdirSync(reports, { recursive: true });
  writeFileSync(join(reports, "appium-exploratory-report.json"), `${JSON.stringify(payload, null, 2)}\n`);
}

function runGate(cwd, args = []) {
  return spawnSync(process.execPath, [gate, "apps/demo-iphone", ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("appium gate accepts telemetry-backed report", () => {
  withTempDir((dir) => {
    writeReport(dir, {
      ok: true,
      telemetry_available: true,
      telemetry_source: "appium-session",
      buttons_tapped: 8,
      crashes: 0,
      failures: 0,
    });
    const result = runGate(dir);
    assert.equal(result.status, 0, result.stderr);
  });
});

test("appium gate rejects hardcoded xcodebuild-log fallback without raw artifact", () => {
  withTempDir((dir) => {
    writeReport(dir, {
      ok: true,
      telemetry_available: false,
      telemetry_source: "xcodebuild-log",
      buttons_tapped: 15,
      crashes: 0,
      failures: 0,
    });
    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /validated raw fallback evidence/);
  });
});

test("appium gate accepts validated fallback with raw log artifact", () => {
  withTempDir((dir) => {
    writeReport(dir, {
      ok: true,
      telemetry_available: false,
      telemetry_source: "xcodebuild-log",
      raw_log_artifact: "reports/ios/xcodebuild-ui.log",
      buttons_tapped: 15,
      crashes: 0,
      failures: 0,
    });
    const result = runGate(dir);
    assert.equal(result.status, 0, result.stderr);
  });
});
