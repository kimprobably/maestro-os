#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const evidencePath = `${root}/implementation/implementation-evidence.json`;
const markdownPath = `${root}/implementation/implementation-evidence.md`;
const reportPath = `${root}/implementation/implementation-coverage-gate.json`;
const failures = [];

function requiredCapabilities() {
  return String(process.env.FEATURE_REQUIRED_CAPABILITIES || process.env.UX_REQUIRED_CAPABILITIES || "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    failures.push(`${path} is not valid JSON`);
    return {};
  }
}

if (!existsSync(markdownPath)) failures.push(`missing ${markdownPath}`);
if (!existsSync(evidencePath)) failures.push(`missing ${evidencePath}`);

const evidence = existsSync(evidencePath) ? readJson(evidencePath) : {};
for (const key of ["changed_paths", "capability_coverage", "commands_run", "tests_run", "residual_risks"]) {
  if (!(key in evidence)) failures.push(`implementation evidence missing ${key}`);
}

const coverage = new Map((evidence.capability_coverage || []).map((item) => [String(item.capability || "").trim(), item]));
for (const capability of requiredCapabilities()) {
  const item = coverage.get(capability);
  if (!item) {
    failures.push(`implementation evidence missing capability ${capability}`);
    continue;
  }
  if (item.code_changed !== true) failures.push(`${capability} has no code_changed=true evidence`);
  if (!item.test_or_validation) failures.push(`${capability} missing test_or_validation evidence`);
}
if (Array.isArray(evidence.changed_paths) && evidence.changed_paths.length === 0) failures.push("implementation evidence changed_paths is empty");

const text = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
for (const heading of ["# Feature Implementation Evidence", "## Changed Paths", "## Capability Coverage", "## Commands Run", "## Tests Run", "## Residual Risks", "## No Secrets"]) {
  if (!text.includes(heading)) failures.push(`${markdownPath} missing heading ${heading}`);
}

const report = { ok: failures.length === 0, root, evidencePath, markdownPath, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
