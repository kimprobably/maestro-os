#!/usr/bin/env node
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/checkout-existing-app.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "checkout-existing-app-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function createFixtureRepo(dir) {
  const repo = join(dir, "source");
  run("git", ["init", repo], dir);
  run("git", ["config", "user.email", "test@example.com"], repo);
  run("git", ["config", "user.name", "Test User"], repo);
  writeFileSync(join(repo, "README.md"), "# Fixture\n");
  run("git", ["add", "README.md"], repo);
  run("git", ["commit", "-m", "initial"], repo);
  run("git", ["branch", "-M", "main"], repo);
  return repo;
}

function runCheckout(cwd, args, options = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    env: { ...process.env, ...(options.env || {}) },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("checkout-existing-app clones source repo into relative app_dir and creates run branch", () => {
  withTempDir((dir) => {
    const source = createFixtureRepo(dir);
    const result = runCheckout(dir, [
      "--repo-url",
      source,
      "--base-branch",
      "main",
      "--run-branch",
      "ux-studio/test",
      "--app-dir",
      "apps/waketask-ios",
    ]);

    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ok, true);
    assert.equal(report.app_dir, "apps/waketask-ios");
    assert.equal(report.run_branch, "ux-studio/test");
    assert.ok(existsSync(join(dir, "apps/waketask-ios/.git")));
    assert.equal(run("git", ["branch", "--show-current"], join(dir, "apps/waketask-ios")), "ux-studio/test");
  });
});

test("checkout-existing-app rejects current directory app_dir", () => {
  withTempDir((dir) => {
    const result = runCheckout(dir, [
      "--repo-url",
      "https://github.com/example/repo.git",
      "--base-branch",
      "main",
      "--run-branch",
      "ux-studio/test",
      "--app-dir",
      ".",
    ]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /app_dir must be a relative checkout directory/);
  });
});

test("checkout-existing-app rejects credential-bearing repo URLs without printing credentials", () => {
  withTempDir((dir) => {
    const secretUrl = "https://user:secret@example.com/repo.git";
    const result = runCheckout(dir, [
      "--repo-url",
      secretUrl,
      "--base-branch",
      "main",
      "--run-branch",
      "ux-studio/test",
      "--app-dir",
      "apps/waketask-ios",
    ]);

    assert.notEqual(result.status, 0);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /repo_url must not include credentials/);
    assert.doesNotMatch(output, /secret/);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/iphone-app-ux-studio/checkout.json"), "utf8"));
    assert.doesNotMatch(JSON.stringify(report), /secret/);
  });
});

test("checkout-existing-app uses GitHub token as an out-of-band header for GitHub HTTPS remotes", () => {
  withTempDir((dir) => {
    const binDir = join(dir, "bin");
    const argLog = join(dir, "git-args.jsonl");
    mkdirSync(binDir);
    const fakeGit = join(binDir, "git");
    writeFileSync(
      fakeGit,
      `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.GIT_ARG_LOG, JSON.stringify(args) + "\\n");
const command = args.find((arg) => ["clone", "fetch", "checkout", "rev-parse"].includes(arg));
if (command === "clone") {
  fs.mkdirSync(path.join(args.at(-1), ".git"), { recursive: true });
  process.exit(0);
}
if (command === "rev-parse") {
  process.stdout.write("abc123\\n");
  process.exit(0);
}
process.exit(0);
`,
    );
    chmodSync(fakeGit, 0o755);

    const result = runCheckout(
      dir,
      [
        "--repo-url",
        "https://github.com/kimprobably/waketask-ios.git",
        "--base-branch",
        "main",
        "--run-branch",
        "ux-studio/test",
        "--app-dir",
        "apps/waketask-ios",
      ],
      {
        env: {
          GITHUB_TOKEN: "ghp_checkout_secret",
          GIT_ARG_LOG: argLog,
          PATH: `${binDir}:${process.env.PATH}`,
        },
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.doesNotMatch(output, /ghp_checkout_secret/);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ok, true);
    assert.equal(report.repo_url, "https://github.com/kimprobably/waketask-ios.git");

    const invocations = readFileSync(argLog, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const cloneArgs = invocations.find((args) => args.includes("clone"));
    assert.ok(cloneArgs.some((arg) => arg.includes("http.https://github.com/.extraheader=AUTHORIZATION: basic ")));
    assert.doesNotMatch(JSON.stringify(invocations), /ghp_checkout_secret/);
  });
});
