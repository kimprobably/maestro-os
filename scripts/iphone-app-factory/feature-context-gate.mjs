#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const packPath = `${root}/context/context-pack.json`;
const markdownPath = `${root}/context-intake.md`;
const reportPath = `${root}/context/context-gate.json`;
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
  } catch (error) {
    failures.push(`${path} is not valid JSON`);
    return {};
  }
}

if (!existsSync(markdownPath)) failures.push(`missing ${markdownPath}`);
if (!existsSync(packPath)) failures.push(`missing ${packPath}`);

const pack = existsSync(packPath) ? readJson(packPath) : {};
for (const key of ["app_name", "feature_goal", "target_audience", "required_capabilities", "acceptance_criteria", "non_goals", "research_sources"]) {
  if (!(key in pack)) failures.push(`context pack missing ${key}`);
}

if (Array.isArray(pack.required_capabilities) && pack.required_capabilities.length === 0) {
  failures.push("context pack required_capabilities is empty");
}
if (Array.isArray(pack.acceptance_criteria) && pack.acceptance_criteria.length < 3) {
  failures.push("context pack needs at least three acceptance criteria");
}

const declared = new Set((pack.required_capabilities || []).map((item) => String(item).trim()));
for (const capability of requiredCapabilities()) {
  if (!declared.has(capability)) failures.push(`context pack missing required capability ${capability}`);
}

const text = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
for (const heading of ["# Feature Context Intake", "## Product Goal", "## Required Capabilities", "## Acceptance Criteria", "## Non-Goals", "## Source List", "## No Secrets"]) {
  if (!text.includes(heading)) failures.push(`${markdownPath} missing heading ${heading}`);
}
if (/\bsk[-_][A-Za-z0-9][A-Za-z0-9_-]{10,}|xox[baprs]-|xapp-|Bearer\s+[A-Za-z0-9._~+/=-]{12,}|password\s*[:=]|token\s*[:=]/i.test(text)) {
  failures.push(`${markdownPath} contains secret-looking material`);
}

const report = { ok: failures.length === 0, root, packPath, markdownPath, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
