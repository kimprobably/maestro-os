#!/usr/bin/env node
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/promptfoo-prompt-quality.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "promptfoo-quality-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("promptfoo prompt quality fallback requires structured JSON config and WakeTask golden cases", () => {
  withTempDir((dir) => {
    const out = join(dir, "prompt-quality.json");
    const normalizedOut = join(dir, "normalized-prompt-quality.json");
    const result = spawnSync(process.execPath, [
      script,
      "--skip-promptfoo",
      "true",
      "--accepted-risk-promptfoo-failure",
      "true",
      "--out",
      out,
      "--normalized-out",
      normalizedOut,
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(readFileSync(out, "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.skip_promptfoo, true);
    assert.equal(report.accepted_risk_promptfoo_failure, true);

    const yaml = readFileSync(join(repoRoot, "evals/iphone-app-factory/prompt-quality.yaml"), "utf8");
    assert.match(yaml, /JSON\.parse\(output\)/);
    assert.match(yaml, /accepted_risk must be false/);

    const dataset = readFileSync(join(repoRoot, "evals/iphone-app-factory/datasets/prompt-quality-golden.jsonl"), "utf8");
    assert.match(dataset, /waketask-control-plane/);
    assert.match(dataset, /waketask-hosted-ios-evidence/);
    assert.match(dataset, /waketask-artifacts-metadata/);
  });
});

test("promptfoo prompt quality fails closed when promptfoo is skipped without accepted risk", () => {
  withTempDir((dir) => {
    const out = join(dir, "prompt-quality.json");
    const normalizedOut = join(dir, "normalized-prompt-quality.json");
    const result = spawnSync(process.execPath, [
      script,
      "--skip-promptfoo",
      "true",
      "--out",
      out,
      "--normalized-out",
      normalizedOut,
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert.notEqual(result.status, 0);
    const report = JSON.parse(readFileSync(out, "utf8"));
    assert.equal(report.fallback_ok, true);
    assert.equal(report.promptfoo_attempted, false);
    assert.equal(report.promptfoo_unavailable_reason, "skipped by --skip-promptfoo");
    assert.equal(report.accepted_risk_promptfoo_failure, false);
    assert.equal(report.ok, false);
  });
});

test("promptfoo prompt quality accepts deterministic fallback when promptfoo runner fails after attempting", () => {
  withTempDir((dir) => {
    const out = join(dir, "prompt-quality.json");
    const normalizedOut = join(dir, "normalized-prompt-quality.json");
    const fakeBin = join(dir, "bin");
    const fakePromptfoo = join(fakeBin, "promptfoo");
    mkdirSync(fakeBin, { recursive: true });
    writeFileSync(fakePromptfoo, `#!/usr/bin/env bash
if [[ "$1" == "--version" ]]; then
  echo "promptfoo fake"
  exit 0
fi
echo "simulated promptfoo model grading failure"
exit 1
`);
    chmodSync(fakePromptfoo, 0o755);

    const result = spawnSync(process.execPath, [
      script,
      "--allow-fallback",
      "true",
      "--accepted-risk-promptfoo-failure",
      "false",
      "--out",
      out,
      "--normalized-out",
      normalizedOut,
    ], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fakeBin}:${process.env.PATH || ""}`,
        OPENROUTER_API_KEY: "test-openrouter-key",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(readFileSync(out, "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.promptfoo_attempted, true);
    assert.equal(report.promptfoo_ok, false);
    assert.equal(report.fallback_ok, true);
    assert.equal(report.attempted_fallback_accepted, true);
    assert.equal(report.accepted_risk_promptfoo_failure, false);

    const stdoutReport = JSON.parse(result.stdout);
    assert.equal(stdoutReport.ok, true);
    assert.equal(stdoutReport.report_path, out);
    assert.equal(stdoutReport.promptfoo_failure_count, 0);
    assert.ok(result.stdout.length < 1200, result.stdout);
    assert.doesNotMatch(result.stdout, /simulated promptfoo model grading failure/);
  });
});

test("research prompts forbid subagent delegation and credential environment inspection", () => {
  for (const name of [
    "research-app-store.md",
    "research-reddit.md",
    "research-competitors.md",
    "research-design-patterns.md",
  ]) {
    const prompt = readFileSync(join(repoRoot, "prompts/iphone-app-factory", name), "utf8");
    assert.match(prompt, /Do not spawn subagents/);
    assert.match(prompt, /inspect `\.env` files/);
    assert.match(prompt, /search the environment for credentials/);
    assert.match(prompt, /environment dump commands/);
  }
});
