#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const appDir = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : process.env.APP_DIR || process.env.UX_APP_DIR || "apps/generated-iphone-app";
const auditPath = `${root}/audit/existing-app-audit.json`;
const markdownPath = `${root}/audit/existing-app-audit.md`;
const reportPath = `${root}/audit/existing-app-audit-gate.json`;
const failures = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    failures.push(`${path} is not valid JSON`);
    return {};
  }
}

if (!existsSync(appDir)) failures.push(`missing app_dir ${appDir}`);
if (!existsSync(markdownPath)) failures.push(`missing ${markdownPath}`);
if (!existsSync(auditPath)) failures.push(`missing ${auditPath}`);

const audit = existsSync(auditPath) ? readJson(auditPath) : {};
for (const key of ["files_inspected", "current_behavior", "extension_points", "build_baseline", "risk_register"]) {
  if (!(key in audit)) failures.push(`audit missing ${key}`);
}
if (Array.isArray(audit.files_inspected) && audit.files_inspected.length < 5) failures.push("audit needs at least five inspected files");

const text = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
for (const heading of ["# Existing App Audit", "## Files Inspected", "## Current Behavior", "## Extension Points", "## Build Baseline", "## Risks", "## No Secrets"]) {
  if (!text.includes(heading)) failures.push(`${markdownPath} missing heading ${heading}`);
}

const report = { ok: failures.length === 0, root, appDir, auditPath, markdownPath, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
