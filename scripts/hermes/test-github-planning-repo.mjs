#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = resolve(repoRoot, "scripts/hermes/github-planning-repo.mjs");

function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("github planning helper reports offline env status without secrets", () => {
  const result = run(["status", "--offline"], {
    GITHUB_PLANNING_REPO: "owner/repo",
    GITHUB_TOKEN: "github_pat_fake_secret",
    GITHUB_PLANNING_REPO_SSH_KEY_B64: Buffer.from("fake-key").toString("base64"),
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.repo, "owner/repo");
  assert.equal(payload.read_token_present, true);
  assert.equal(payload.deploy_key_present, true);
  assert.equal(payload.write_auth_mode, "ssh");
  assert.doesNotMatch(result.stdout, /github_pat_fake_secret/);
});

test("github planning helper supports explicit HTTPS token auth without printing token", () => {
  const result = run(["status", "--offline"], {
    GITHUB_PLANNING_REPO: "owner/repo",
    GITHUB_PLANNING_REPO_AUTH: "https",
    GITHUB_TOKEN: "github_pat_fake_secret",
    GITHUB_PLANNING_REPO_SSH_KEY_B64: Buffer.from("fake-key").toString("base64"),
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.write_auth_mode, "https");
  assert.equal(payload.deploy_key_present, true);
  assert.doesNotMatch(result.stdout, /github_pat_fake_secret/);
});

test("github planning helper rejects unsafe publish paths before touching git", () => {
  const result = run(["publish-file", "--source", "package.json", "--path", "../bad.md"], {
    GITHUB_PLANNING_REPO: "owner/repo",
    GITHUB_PLANNING_REPO_SSH_KEY_B64: Buffer.from("fake-key").toString("base64"),
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsafe repo path/);
});
