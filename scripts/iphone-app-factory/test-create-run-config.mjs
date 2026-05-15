#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/create-run-config.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "iphone-run-config-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runConfig(cwd, args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("create-run-config writes a Railway run-specific TOML", () => {
  withTempDir((dir) => {
    const result = runConfig(dir, [
      "--app-type",
      "task alarm clock",
      "--target-audience",
      "US iPhone users who oversleep",
      "--app-name",
      "WakeTask",
      "--bundle-id",
      "com.keen.waketask",
      "--app-dir",
      "apps/waketask-iphone",
      "--spec-kitty-feature",
      "waketask-iphone-app",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    const toml = readFileSync(report.path, "utf8");
    assert.match(toml, /control_plane = "railway"/);
    assert.match(toml, /app_name = "WakeTask"/);
    assert.match(toml, /ios_validation_mode = "github"/);
    assert.match(toml, /allow_macos_deferred = "false"/);
    assert.match(toml, /"apps\/\*-iphone\/\*\*"/);
    assert.match(toml, /"reports\/ios\/\*\*"/);
    assert.doesNotMatch(toml, /Generated iPhone App/);
  });
});

test("create-run-config rejects generic defaults", () => {
  withTempDir((dir) => {
    const result = runConfig(dir, [
      "--app-type",
      "consumer app",
      "--target-audience",
      "users",
      "--app-name",
      "Generated iPhone App",
      "--bundle-id",
      "com.maestro.generatediphoneapp",
      "--app-dir",
      "apps/generated-iphone-app",
      "--spec-kitty-feature",
      "iphone-app-factory",
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /app_name is generic/);
  });
});
