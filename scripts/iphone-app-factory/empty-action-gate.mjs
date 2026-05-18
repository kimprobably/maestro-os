#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const appDir = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : process.env.APP_DIR || process.env.UX_APP_DIR || "apps/generated-iphone-app";
const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const reportPath = `${root}/validation/empty-action-gate.json`;
const failures = [];
const findings = [];
const ignored = [];
const scannedFiles = [];

const defaultIgnoredPathParts = [
  "/docs/examples/",
  "/Packages/DesignSystem/",
  "/SwiftAIBoilerplatePro/AppShell/ProfileView.swift",
];

function normalize(path) {
  return path.replaceAll("\\", "/");
}

function ignoredPathParts() {
  return [
    ...defaultIgnoredPathParts,
    ...String(process.env.EMPTY_ACTION_GATE_IGNORE_PATHS || "")
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => normalize(item)),
  ];
}

function shouldIgnore(path) {
  const normalized = `/${normalize(path)}`;
  return ignoredPathParts().some((part) => normalized.includes(part.startsWith("/") ? part : `/${part}`));
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if ([".git", "DerivedData", ".build", "Pods"].includes(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    if (stat.isFile() && path.endsWith(".swift") && !/Tests?\//.test(normalize(path))) {
      if (shouldIgnore(path)) {
        ignored.push(path);
      } else {
        scan(path);
      }
    }
  }
}

function lineFor(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function scan(path) {
  scannedFiles.push(path);
  const text = readFileSync(path, "utf8");
  const patterns = [
    { name: "empty Button action", regex: /Button\s*\([^)]*\)\s*\{\s*\}/g },
    { name: "empty trailingAction", regex: /trailingAction\s*:\s*\{\s*\}/g },
    { name: "empty primary action closure", regex: /(primaryAction|secondaryAction|leadingAction)\s*:\s*\{\s*\}/g },
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.regex)) {
      findings.push({ path, line: lineFor(text, match.index || 0), kind: pattern.name });
    }
  }
}

if (!existsSync(appDir)) failures.push(`missing app_dir ${appDir}`);
if (existsSync(appDir)) walk(appDir);
if (findings.length) failures.push(`found ${findings.length} empty action closure(s)`);

const report = { ok: failures.length === 0, appDir, scannedFiles, ignored, findings, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
