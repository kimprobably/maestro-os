#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const gate = join(repoRoot, "scripts/iphone-app-factory/ux-postmortem-gate.mjs");
const defaultPostmortemPath = ".workflow/iphone-app-ux-studio/postmortem.md";
const defaultGatePath = ".workflow/iphone-app-ux-studio/postmortem-gate.json";

const requiredSections = [
  "Run Summary",
  "What Worked",
  "What Failed",
  "Where Agents Needed Steering",
  "Gate Effectiveness",
  "Prompt Improvements",
  "Workflow Improvements",
  "Design Corpus Additions",
  "Next-Run Recommendations",
];

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "ux-postmortem-gate-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writePostmortem(cwd, body) {
  const path = join(cwd, defaultPostmortemPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function validPostmortem(extra = "") {
  return `# UX Studio Postmortem

${requiredSections
  .map(
    (section) => `## ${section}

- Concrete ${section.toLowerCase()} evidence from the run.
`,
  )
  .join("\n")}${extra}
`;
}

function runGate(cwd, args = []) {
  return spawnSync(process.execPath, [gate, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function readReport(cwd, path = defaultGatePath) {
  return JSON.parse(readFileSync(join(cwd, path), "utf8"));
}

test("UX postmortem gate accepts a postmortem with every required learning section", () => {
  withTempDir((dir) => {
    writePostmortem(dir, validPostmortem());

    const result = runGate(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok":true/);

    const report = readReport(dir);
    assert.equal(report.ok, true);
    assert.equal(report.postmortem_present, true);
    assert.deepEqual(
      report.required_sections.map((section) => section.label),
      requiredSections,
    );
    assert.deepEqual(report.missing_sections, []);
  });
});

test("UX postmortem gate rejects missing learning sections and writes a structured report", () => {
  withTempDir((dir) => {
    writePostmortem(
      dir,
      `# UX Studio Postmortem

## Run Summary

- The run finished with manual steering.

## What Worked

- Research artifacts were usable.
`,
    );

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /What Failed/);
    assert.match(result.stderr, /Next-Run Recommendations/);

    const reportPath = join(dir, defaultGatePath);
    assert.ok(existsSync(reportPath), "gate should write a report even when validation fails");
    const report = readReport(dir);
    assert.equal(report.ok, false);
    assert.equal(report.postmortem_present, true);
    assert.deepEqual(report.missing_sections, requiredSections.slice(2));
    assert.ok(report.failures.every((failure) => failure.includes("missing required postmortem section")));
  });
});

test("UX postmortem gate creates parent directories for a custom report path", () => {
  withTempDir((dir) => {
    writePostmortem(dir, validPostmortem());

    const outPath = ".workflow/custom/reports/postmortem-gate.json";
    const result = runGate(dir, ["--out", outPath]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(dir, outPath)));
    assert.equal(readReport(dir, outPath).ok, true);
  });
});

test("UX postmortem gate failure output does not echo secret-like body content", () => {
  withTempDir((dir) => {
    const secret = "sk-or-v1-postmortem-secret-value";
    writePostmortem(
      dir,
      `# UX Studio Postmortem

## Run Summary

- ${secret}
`,
    );

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.doesNotMatch(output, new RegExp(secret));

    const report = readReport(dir);
    assert.doesNotMatch(JSON.stringify(report), new RegExp(secret));
  });
});

test("UX postmortem gate rejects complete postmortems that contain secret-looking values", () => {
  withTempDir((dir) => {
    const secret = "token = sk-or-v1-postmortem-secret-value";
    writePostmortem(dir, validPostmortem(`\n## Extra\n\n- ${secret}\n`));

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /secret-looking value/);
    assert.doesNotMatch(output, /sk-or-v1-postmortem-secret-value/);

    const report = readReport(dir);
    assert.equal(report.ok, false);
    assert.ok(report.secret_finding_count >= 1);
    assert.deepEqual(report.missing_sections, []);
    assert.doesNotMatch(JSON.stringify(report), /sk-or-v1-postmortem-secret-value/);
  });
});
