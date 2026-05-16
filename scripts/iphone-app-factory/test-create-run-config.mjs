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

test("create-run-config writes a Railway UX iteration TOML", () => {
  withTempDir((dir) => {
    const result = runConfig(dir, [
      "--mode",
      "ux-iteration",
      "--repo-url",
      "https://github.com/kimprobably/waketask-ios.git",
      "--base-branch",
      "main",
      "--run-branch",
      "ux-studio/waketask-test",
      "--target-audience",
      "US iPhone users who oversleep",
      "--app-name",
      "WakeTask",
      "--bundle-id",
      "com.keen.waketask",
      "--app-dir",
      "apps/waketask-ios",
      "--app-domain",
      "alarm_clock",
      "--design-goal",
      "Make setup calm and wake mode unmistakable.",
      "--use-mobbin-mcp",
      "true",
      "--use-design-corpus",
      "true",
      "--selected-direction-mode",
      "automatic",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    const toml = readFileSync(report.path, "utf8");
    assert.equal(report.mode, "ux-iteration");
    assert.match(toml, /graph = "iterate-existing-app-ux\.fabro"/);
    assert.match(toml, /control_plane = "railway"/);
    assert.match(toml, /fabro_server = "https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1"/);
    assert.match(toml, /FABRO_SERVER = "https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1"/);
    assert.match(toml, /network = "allow_all"/);
    assert.match(toml, /repo_url = "https:\/\/github\.com\/kimprobably\/waketask-ios\.git"/);
    assert.match(toml, /run_branch = "ux-studio\/waketask-test"/);
    assert.match(toml, /app_dir = "apps\/waketask-ios"/);
    assert.match(toml, /use_mobbin_mcp = "true"/);
    assert.match(toml, /use_design_corpus = "true"/);
    assert.match(toml, /CODEX_MCP_CREDENTIALS_JSON_BASE64 = "{{ env\.CODEX_MCP_CREDENTIALS_JSON_BASE64 }}"/);
    assert.doesNotMatch(toml, /MOBBIN_EMAIL/);
    assert.doesNotMatch(toml, /MOBBIN_PASSWORD/);
  });
});

test("create-run-config rejects unresolved UX run branch templates", () => {
  withTempDir((dir) => {
    const result = runConfig(dir, [
      "--mode",
      "ux-iteration",
      "--repo-url",
      "https://github.com/kimprobably/waketask-ios.git",
      "--base-branch",
      "main",
      "--run-branch",
      "ux-studio/{{ run.id }}",
      "--target-audience",
      "US iPhone users who oversleep",
      "--app-name",
      "WakeTask",
      "--bundle-id",
      "com.keen.waketask",
      "--app-dir",
      "apps/waketask-ios",
      "--app-domain",
      "alarm_clock",
      "--design-goal",
      "Make setup calm and wake mode unmistakable.",
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /run_branch must be concrete/);
  });
});

test("create-run-config rejects current directory for UX iteration app_dir", () => {
  withTempDir((dir) => {
    const result = runConfig(dir, [
      "--mode",
      "ux-iteration",
      "--repo-url",
      "https://github.com/kimprobably/waketask-ios.git",
      "--base-branch",
      "main",
      "--run-branch",
      "ux-studio/waketask-test",
      "--target-audience",
      "US iPhone users who oversleep",
      "--app-name",
      "WakeTask",
      "--bundle-id",
      "com.keen.waketask",
      "--app-dir",
      ".",
      "--app-domain",
      "alarm_clock",
      "--design-goal",
      "Make setup calm and wake mode unmistakable.",
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /app_dir must be a checkout directory/);
  });
});

test("create-run-config rejects credential-bearing UX repository URLs", () => {
  withTempDir((dir) => {
    const result = runConfig(dir, [
      "--mode",
      "ux-iteration",
      "--repo-url",
      "https://token-secret@github.com/kimprobably/waketask-ios.git",
      "--base-branch",
      "main",
      "--run-branch",
      "ux-studio/waketask-test",
      "--target-audience",
      "US iPhone users who oversleep",
      "--app-name",
      "WakeTask",
      "--bundle-id",
      "com.keen.waketask",
      "--app-dir",
      "apps/waketask-ios",
      "--app-domain",
      "alarm_clock",
      "--design-goal",
      "Make setup calm and wake mode unmistakable.",
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /repo_url must not include credentials/);
    assert.doesNotMatch(result.stderr, /token-secret/);
  });
});

test("create-run-config rejects unsafe UX branch names and app domains", () => {
  withTempDir((dir) => {
    const result = runConfig(dir, [
      "--mode",
      "ux-iteration",
      "--repo-url",
      "https://github.com/kimprobably/waketask-ios.git",
      "--base-branch",
      "main",
      "--run-branch",
      "ux-studio/../../main",
      "--target-audience",
      "US iPhone users who oversleep",
      "--app-name",
      "WakeTask",
      "--bundle-id",
      "com.keen.waketask",
      "--app-dir",
      "apps/waketask-ios",
      "--app-domain",
      "alarm clock",
      "--design-goal",
      "Make setup calm and wake mode unmistakable.",
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /run_branch contains unsafe characters/);
    assert.match(result.stderr, /app_domain contains unsafe characters/);
  });
});
