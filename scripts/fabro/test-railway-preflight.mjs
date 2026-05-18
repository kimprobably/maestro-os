#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const preflight = join(repoRoot, "scripts/fabro/railway-preflight.mjs");

const completeEnv = {
  FABRO_DEV_TOKEN: "present",
  OPENROUTER_API_KEY: "present",
  APIFY_TOKEN: "present",
  GITHUB_TOKEN: "present",
  CLAUDE_CODE_OAUTH_TOKEN: "present",
  CODEX_AUTH_JSON_BASE64: "present",
  MOBBIN_EMAIL: "present",
  MOBBIN_PASSWORD: "present",
};

function run(command, args, cwd, env = {}) {
  return spawnSync(command, args, {
    cwd,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      ...env,
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function withGitRepo(fn) {
  const dir = mkdtempSync(join(tmpdir(), "railway-preflight-"));
  const remote = join(dir, "remote.git");
  const work = join(dir, "work");
  try {
    mkdirSync(work, { recursive: true });
    assert.equal(run("git", ["init", "--bare", remote], dir).status, 0);
    assert.equal(run("git", ["init", "-b", "test"], work).status, 0);
    assert.equal(run("git", ["config", "user.email", "test@example.com"], work).status, 0);
    assert.equal(run("git", ["config", "user.name", "Test"], work).status, 0);
    writeFileSync(join(work, "README.md"), "# temp\n");
    assert.equal(run("git", ["add", "README.md"], work).status, 0);
    assert.equal(run("git", ["commit", "-m", "init"], work).status, 0);
    assert.equal(run("git", ["remote", "add", "origin", remote], work).status, 0);
    assert.equal(run("git", ["push", "-u", "origin", "test"], work).status, 0);
    return fn(work);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runPreflight(cwd, env, args = []) {
  return run(
    process.execPath,
    [preflight, "--skip-network", ...args],
    cwd,
    {
      ...completeEnv,
      FABRO_SERVER: "https://fabro-maestro-production.up.railway.app/api/v1",
      FABRO_WEB_URL: "https://fabro-maestro-production.up.railway.app",
      ...env,
    },
  );
}

test("railway preflight passes with Railway server, env, upstream, and clean git", () => {
  withGitRepo((work) => {
    const result = runPreflight(work, {});
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ok, true);
    assert.equal(report.server, "https://fabro-maestro-production.up.railway.app/api/v1");
  });
});

test("railway preflight reports missing env key names only", () => {
  withGitRepo((work) => {
    const result = runPreflight(work, { MOBBIN_PASSWORD: "" });
    assert.notEqual(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.deepEqual(report.checks.env.missing, ["MOBBIN_PASSWORD"]);
    assert.doesNotMatch(result.stdout, /OPENROUTER_API_KEY.*present/);
  });
});

test("railway preflight rejects local Fabro unless explicitly allowed", () => {
  withGitRepo((work) => {
    const result = runPreflight(work, { FABRO_SERVER: "http://127.0.0.1:32276" });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /local Fabro/);
  });
});

test("railway preflight catches dirty workflow script paths", () => {
  withGitRepo((work) => {
    mkdirSync(join(work, "scripts/fabro"), { recursive: true });
    writeFileSync(join(work, "scripts/fabro/new-tool.mjs"), "console.log('dirty')\n");
    assert.equal(run("git", ["add", "-N", "scripts/fabro/new-tool.mjs"], work).status, 0);
    const result = runPreflight(work, {});
    assert.notEqual(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.equal(report.checks.git.dirty_paths.length, 1);
    assert.match(report.checks.git.dirty_paths[0], /scripts\/fabro\/new-tool\.mjs/);
  });
});
