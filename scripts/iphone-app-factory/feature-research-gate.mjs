#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const packPath = `${root}/research/research-pack.json`;
const markdownPath = `${root}/research/research-synthesis.md`;
const reportPath = `${root}/research/research-gate.json`;
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
if (!existsSync(packPath)) failures.push(`missing ${packPath}`);

const pack = existsSync(packPath) ? readJson(packPath) : {};
for (const key of ["sources", "feature_opportunities", "ui_patterns", "what_to_adapt", "what_not_to_copy", "artifact_viewer_inputs"]) {
  if (!(key in pack)) failures.push(`research pack missing ${key}`);
}
if (Array.isArray(pack.sources) && pack.sources.length < 3) failures.push("research pack needs at least three sources");
if (Array.isArray(pack.what_not_to_copy) && pack.what_not_to_copy.length === 0) failures.push("research pack needs what_not_to_copy guidance");

const text = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
for (const heading of ["# Feature Research Synthesis", "## Sources", "## Feature Opportunities", "## UI Patterns", "## What To Adapt", "## What Not To Copy", "## Reusable Artifacts", "## No Secrets"]) {
  if (!text.includes(heading)) failures.push(`${markdownPath} missing heading ${heading}`);
}
if (/sk-|xox[baprs]-|xapp-|Bearer\s+[A-Za-z0-9._~+/=-]{12,}|password\s*[:=]|token\s*[:=]/i.test(text)) {
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
