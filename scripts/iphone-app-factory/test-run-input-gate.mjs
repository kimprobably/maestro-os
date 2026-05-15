#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/run-input-gate.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "run-input-gate-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(cwd, args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const validArgs = [
  "--app-type",
  "task alarm clock with accountability missions",
  "--target-audience",
  "US iPhone users who oversleep and need wake accountability",
  "--app-name",
  "WakeTask",
  "--bundle-id",
  "com.keen.waketask",
  "--app-dir",
  "apps/waketask-iphone",
  "--spec-kitty-feature",
  "waketask-iphone-app",
  "--ios-validation-mode",
  "github",
  "--allow-macos-deferred",
  "false",
];

test("run input gate accepts run-specific strict iPhone inputs", () => {
  withTempDir((dir) => {
    const result = run(dir, validArgs);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/iphone-app-factory/run-input-gate.json"), "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.inputs.app_type, "[present]");
  });
});

test("run input gate rejects generic defaults and macOS deferral", () => {
  withTempDir((dir) => {
    const result = run(dir, [
      "--app-type",
      "consumer iPhone app in productivity, health, wellness, fitness, positivity, screen-time, or life-improvement",
      "--target-audience",
      "US consumer iPhone users",
      "--app-name",
      "Generated iPhone App",
      "--bundle-id",
      "com.maestro.generatediphoneapp",
      "--app-dir",
      "apps/generated-iphone-app",
      "--spec-kitty-feature",
      "iphone-app-factory",
      "--ios-validation-mode",
      "local",
      "--allow-macos-deferred",
      "true",
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /app_name must be run-specific/);
    assert.match(result.stderr, /allow_macos_deferred must be false/);
  });
});
