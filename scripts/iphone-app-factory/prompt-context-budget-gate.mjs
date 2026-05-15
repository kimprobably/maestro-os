#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function numberArg(name, fallback) {
  return Number(argValue(name, String(fallback)));
}

const root = argValue("--root", ".workflow/iphone-app-factory");
const outPath = argValue("--out", ".workflow/iphone-app-factory/prompt-context-budget.json");
const maxTotalBytes = numberArg("--max-total-bytes", 1_200_000);
const maxFileBytes = numberArg("--max-file-bytes", 300_000);
const maxFiles = numberArg("--max-files", 400);
const failures = [];

function walk(rootPath) {
  if (!existsSync(rootPath)) return [];
  const ignored = new Set(["node_modules", ".git", "DerivedData", ".build"]);
  const files = [];
  function visit(path) {
    for (const name of readdirSync(path)) {
      if (ignored.has(name)) continue;
      const child = join(path, name);
      const stats = statSync(child);
      if (stats.isDirectory()) {
        visit(child);
      } else if (stats.isFile()) {
        files.push({
          path: relative(process.cwd(), child),
          name: basename(child),
          bytes: stats.size,
        });
      }
    }
  }
  visit(rootPath);
  return files;
}

function write(report) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
}

const files = walk(root);
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const largeFiles = files.filter((file) => file.bytes > maxFileBytes);
const promptRiskFiles = files.filter((file) => {
  return /\.(log|stdout|stderr|txt|md|json)$/i.test(file.name) && file.bytes > Math.floor(maxFileBytes / 2);
});

if (!existsSync(root)) failures.push(`missing context root ${root}`);
if (files.length > maxFiles) failures.push(`context file count ${files.length} exceeds ${maxFiles}`);
if (totalBytes > maxTotalBytes) failures.push(`context bytes ${totalBytes} exceeds ${maxTotalBytes}`);
for (const file of largeFiles) {
  failures.push(`context file exceeds max size: ${file.path} (${file.bytes} bytes)`);
}

const report = {
  ok: failures.length === 0,
  root,
  total_bytes: totalBytes,
  file_count: files.length,
  max_total_bytes: maxTotalBytes,
  max_file_bytes: maxFileBytes,
  max_files: maxFiles,
  largest_files: files.sort((a, b) => b.bytes - a.bytes).slice(0, 20),
  prompt_risk_files: promptRiskFiles,
  failures,
  next_action: failures.length === 0
    ? "continue"
    : "compact completed-stage stdout/log artifacts into short summaries before running the next large prompt stage",
};

write(report);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
