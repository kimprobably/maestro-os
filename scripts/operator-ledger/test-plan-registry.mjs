#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const registry = join(repoRoot, "scripts/operator-ledger/plan-registry.mjs");

function withTempDirs(fn) {
  const home = mkdtempSync(join(tmpdir(), "plan-registry-home-"));
  const root = mkdtempSync(join(tmpdir(), "plan-registry-root-"));
  try {
    return fn({ home, root });
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
}

function runRegistry(args) {
  return spawnSync(process.execPath, [registry, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function sqlite(home, sql) {
  const db = join(home, "profiles/maestro-operator/state/operator-ledger.sqlite");
  const result = spawnSync("sqlite3", [db, sql], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test("plan-registry creates standard planning directories", () => {
  withTempDirs(({ root }) => {
    const result = runRegistry(["ensure-dirs", "--root", root]);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ok, true);

    for (const path of [
      "docs/operator/plans/active",
      "docs/operator/plans/parked",
      "docs/operator/plans/archive",
      "docs/operator/specs/active",
      "docs/operator/specs/parked",
      "docs/operator/specs/archive",
      "docs/operator/briefs",
    ]) {
      assert.match(readFileSync(join(root, "docs/operator/README.md"), "utf8"), /Planning Context Registry/);
      assert.equal(spawnSync("test", ["-d", join(root, path)]).status, 0, path);
    }
  });
});

test("plan-registry indexes plan/spec markdown into operator ledger and context output", () => {
  withTempDirs(({ home, root }) => {
    mkdirSync(join(root, "docs/operator/plans/active"), { recursive: true });
    mkdirSync(join(root, "docs/operator/specs/parked"), { recursive: true });
    writeFileSync(join(root, "docs/operator/plans/active/ledger-v0.md"), `---
id: plan:operator-ledger-v0
status: active
domain: hermes
authority: planning-context
summary: Build the small operator ledger and Slack context policy.
links:
  slack_threads:
    - C123:171000.1
---
# Operator Ledger v0

This plan exists so Miles can remember the current implementation direction.
`);
    writeFileSync(join(root, "docs/operator/specs/parked/company-brain-product.md"), `---
id: spec:company-brain-product
status: parked
domain: product
authority: planning-context
summary: Parked broader product memory architecture discussion.
---
# Company Brain Product

Do not implement this until the Hermes operator has real usage patterns.
`);

    const index = runRegistry(["index", "--root", root, "--home", home]);
    assert.equal(index.status, 0, index.stderr);
    const report = JSON.parse(index.stdout);
    assert.equal(report.indexed, 2);

    assert.equal(sqlite(home, "SELECT COUNT(*) FROM ledger_subjects WHERE subject_type IN ('plan','spec');"), "2");
    assert.equal(sqlite(home, "SELECT subject_type || ':' || subject_key FROM ledger_subjects WHERE subject_key='operator-ledger-v0';"), "plan:operator-ledger-v0");

    const metadataJson = sqlite(home, "SELECT metadata_json FROM ledger_subjects WHERE subject_key='operator-ledger-v0';");
    assert.match(metadataJson, /docs\/operator\/plans\/active\/ledger-v0.md/);
    assert.match(metadataJson, /planning-context/);

    const context = runRegistry(["context", "--root", root, "--home", home, "--domain", "hermes"]);
    assert.equal(context.status, 0, context.stderr);
    const payload = JSON.parse(context.stdout);
    assert.equal(payload.domain, "hermes");
    assert.equal(payload.items.length, 1);
    assert.equal(payload.items[0].id, "plan:operator-ledger-v0");
    assert.equal(payload.items[0].authority, "planning-context");
    assert.match(payload.trust_boundary, /not committed decisions/);
  });
});
