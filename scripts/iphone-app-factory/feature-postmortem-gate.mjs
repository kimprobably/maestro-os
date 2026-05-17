#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const postmortemPath = `${root}/postmortem.md`;
const reportPath = `${root}/postmortem-gate.json`;
const failures = [];

if (!existsSync(postmortemPath)) failures.push(`missing ${postmortemPath}`);
const text = existsSync(postmortemPath) ? readFileSync(postmortemPath, "utf8") : "";
for (const heading of [
  "# Feature Iteration Postmortem",
  "## What Worked",
  "## What Failed",
  "## Manual Versus Fabro Executed",
  "## Workflow Changes Needed",
  "## Product Backlog",
  "## Reusable Learnings",
  "## Next Operator Action",
  "## No Secrets",
]) {
  if (!text.includes(heading)) failures.push(`${postmortemPath} missing heading ${heading}`);
}
if (/\bsk[-_][A-Za-z0-9][A-Za-z0-9_-]{10,}|xox[baprs]-|xapp-|Bearer\s+[A-Za-z0-9._~+/=-]{12,}|password\s*[:=]|token\s*[:=]/i.test(text)) {
  failures.push(`${postmortemPath} contains secret-looking material`);
}

const report = { ok: failures.length === 0, root, postmortemPath, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
