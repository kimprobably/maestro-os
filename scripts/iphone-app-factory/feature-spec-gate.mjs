#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const specPath = `${root}/spec/feature-spec.json`;
const markdownPath = `${root}/spec/feature-spec.md`;
const reportPath = `${root}/spec/feature-spec-gate.json`;
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
if (!existsSync(specPath)) failures.push(`missing ${specPath}`);

const spec = existsSync(specPath) ? readJson(specPath) : {};
for (const key of ["feature_goal", "user_flows", "required_capabilities", "acceptance_criteria", "implementation_slices", "validation_plan", "non_goals"]) {
  if (!(key in spec)) failures.push(`feature spec missing ${key}`);
}

const declared = new Set((spec.required_capabilities || []).map((item) => String(item).trim()));
for (const capability of requiredCapabilities()) {
  if (!declared.has(capability)) failures.push(`feature spec missing required capability ${capability}`);
}
if (Array.isArray(spec.acceptance_criteria) && spec.acceptance_criteria.length < 5) failures.push("feature spec needs at least five acceptance criteria");
if (Array.isArray(spec.implementation_slices) && spec.implementation_slices.length < 2) failures.push("feature spec needs at least two implementation slices");

const text = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
for (const heading of ["# Existing App Feature Spec", "## Feature Goal", "## Required Capabilities", "## User Flows", "## Acceptance Criteria", "## Implementation Slices", "## Validation Plan", "## Non-Goals", "## No Secrets"]) {
  if (!text.includes(heading)) failures.push(`${markdownPath} missing heading ${heading}`);
}
if (/literal clone|pixel[- ]?copy/i.test(text) && !/do not|avoid|non-goal/i.test(text)) {
  failures.push(`${markdownPath} appears to allow cloning rather than abstracting references`);
}

const report = { ok: failures.length === 0, root, specPath, markdownPath, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
