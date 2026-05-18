#!/usr/bin/env node
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/ci-trigger-gate.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "ci-trigger-gate-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(cwd, appDir, env = {}) {
  return spawnSync(process.execPath, [script, appDir], {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeFakeGh(dir) {
  const binDir = join(dir, "bin");
  const logPath = join(dir, "gh-argv.log");
  mkdirSync(binDir, { recursive: true });
  const ghPath = join(binDir, "gh");
  writeFileSync(ghPath, `#!/usr/bin/env node
const fs = require("fs");
const logPath = ${JSON.stringify(logPath)};
fs.appendFileSync(logPath, process.argv.slice(2).join(" ") + "\\n");
const args = process.argv.slice(2);
if (args[0] === "workflow" && args[1] === "run") {
  process.exit(0);
}
if (args[0] === "run" && args[1] === "list") {
  process.stdout.write(JSON.stringify([
    { databaseId: 123456, headSha: "abcdef123456", status: "completed", conclusion: "success", url: "https://github.com/example/repo/actions/runs/123456" }
  ]));
  process.exit(0);
}
if (args[0] === "api" && args[1] === "repos/example/repo/actions/runs/123456/artifacts") {
  process.stdout.write(JSON.stringify({ artifacts: [{ name: "ios-quality-report" }, { name: "appium-exploratory-report" }] }));
  process.exit(0);
}
console.error("unexpected gh args", args.join(" "));
process.exit(2);
`);
  chmodSync(ghPath, 0o755);
  return { ghPath, logPath };
}

test("ci-trigger-gate triggers GitHub Actions and writes durable evidence when evidence is missing", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    mkdirSync(appDir, { recursive: true });
    const { ghPath, logPath } = writeFakeGh(dir);
    const result = run(dir, appDir, {
      GH_BIN: ghPath,
      UX_REPO_URL: "https://github.com/example/repo.git",
      UX_RUN_BRANCH: "feature/test",
      FEATURE_CI_TIMEOUT_SECONDS: "2",
      FEATURE_CI_POLL_SECONDS: "0",
    });
    assert.equal(result.status, 0, result.stderr);
    const evidence = JSON.parse(readFileSync(join(dir, ".workflow/existing-app-feature/validation/ci-evidence.json"), "utf8"));
    assert.equal(evidence.github_actions.run_id, "123456");
    assert.equal(evidence.github_actions.commit_sha, "abcdef123456");
    assert.equal(evidence.github_actions.conclusion, "success");
    assert.deepEqual(evidence.github_actions.artifacts, ["ios-quality-report", "appium-exploratory-report"]);
    const calls = readFileSync(logPath, "utf8");
    assert.match(calls, /workflow run ios-quality\.yml --repo example\/repo --ref feature\/test/);
    assert.match(calls, /run list --repo example\/repo --workflow ios-quality\.yml --branch feature\/test/);
  });
});
