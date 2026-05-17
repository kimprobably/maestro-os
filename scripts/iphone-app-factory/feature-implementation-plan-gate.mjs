#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const planPath = `${root}/implementation/implementation-plan.json`;
const markdownPath = `${root}/implementation/implementation-plan.md`;
const reportPath = `${root}/implementation/implementation-plan-gate.json`;
const failures = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    failures.push(`${path} is not valid JSON`);
    return {};
  }
}

if (!existsSync(markdownPath)) failures.push(`missing ${markdownPath}`);
if (!existsSync(planPath)) failures.push(`missing ${planPath}`);

const plan = existsSync(planPath) ? readJson(planPath) : {};
for (const key of ["slices", "file_changes", "tests", "screenshot_states", "ci", "rollback_plan"]) {
  if (!(key in plan)) failures.push(`implementation plan missing ${key}`);
}
if (Array.isArray(plan.slices) && plan.slices.length < 2) failures.push("implementation plan needs at least two slices");
if (Array.isArray(plan.tests) && plan.tests.length === 0) failures.push("implementation plan needs tests");

const text = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
for (const heading of ["# Feature Implementation Plan", "## File Map", "## Slice Plan", "## Tests", "## Screenshots", "## CI", "## Rollback Plan", "## No Secrets"]) {
  if (!text.includes(heading)) failures.push(`${markdownPath} missing heading ${heading}`);
}

const report = { ok: failures.length === 0, root, planPath, markdownPath, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
