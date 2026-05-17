#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const script = join(repoRoot, "scripts/iphone-app-factory/publish-existing-app-branch.mjs");

function sh(cwd, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
}

function runScript(cwd, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `publish script failed\n${result.stdout}\n${result.stderr}`);
  return result;
}

function setupCheckout() {
  const dir = mkdtempSync(join(tmpdir(), "publish-existing-app-branch-"));
  const remote = join(dir, "remote.git");
  const appDir = join(dir, "apps/waketask-ios");

  sh(dir, "git", ["init", "--bare", remote]);
  mkdirSync(appDir, { recursive: true });
  sh(appDir, "git", ["init", "-b", "main"]);
  sh(appDir, "git", ["config", "user.email", "test@example.com"]);
  sh(appDir, "git", ["config", "user.name", "Test User"]);
  writeFileSync(join(appDir, "README.md"), "WakeTask\n");
  sh(appDir, "git", ["add", "README.md"]);
  sh(appDir, "git", ["commit", "-m", "Initial WakeTask"]);
  sh(appDir, "git", ["remote", "add", "origin", remote]);
  sh(appDir, "git", ["push", "-u", "origin", "main"]);

  return { dir, remote, appDir };
}

test("publish existing app branch commits nested app changes and pushes run branch", () => {
  const { dir, remote, appDir } = setupCheckout();
  try {
    const changedFile = join(appDir, "Sources", "AlarmMission.swift");
    mkdirSync(dirname(changedFile), { recursive: true });
    writeFileSync(changedFile, "enum AlarmMission {}\n");

    runScript(dir, ["--app-dir", "apps/waketask-ios", "--run-branch", "ux/test-branch"]);

    const reportPath = join(dir, ".workflow/iphone-app-ux-studio/publish-existing-app-branch.json");
    assert.ok(existsSync(reportPath));
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.action, "committed_and_pushed");
    assert.equal(report.pushed, true);
    assert.equal(report.changed_file_count, 1);
    assert.ok(report.commit_sha);
    assert.equal(report.commit_sha, sh(dir, "git", ["--git-dir", remote, "rev-parse", "refs/heads/ux/test-branch"]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publish existing app branch records no-op when nested app has no changes", () => {
  const { dir, appDir } = setupCheckout();
  try {
    const head = sh(appDir, "git", ["rev-parse", "HEAD"]);
    runScript(dir, ["--app-dir", "apps/waketask-ios", "--run-branch", "ux/noop-branch"]);

    const report = JSON.parse(readFileSync(join(dir, ".workflow/iphone-app-ux-studio/publish-existing-app-branch.json"), "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.action, "no_changes");
    assert.equal(report.commit_sha, head);
    assert.equal(report.pushed, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
