#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function readJson(path, failures) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`${path} is not valid JSON: ${error.message}`);
    return {};
  }
}

function hasSecret(text) {
  return /\bsk[-_][A-Za-z0-9][A-Za-z0-9_-]{10,}|xox[baprs]-|xapp-|Bearer\s+[A-Za-z0-9._~+/=-]{12,}|password\s*[:=]|token\s*[:=]/i.test(text);
}

const root = argValue("--root", process.env.OBJECT_PROOF_ROOT || ".workflow/object-proof-program");
const stage = argValue("--stage", process.env.STAGE_ID || "");
const learningPath = `${root}/learnings/${stage}-learnings.json`;
const cumulativePath = `${root}/learnings/cumulative-learnings.json`;
const markdownPath = `${root}/learnings/${stage}-learnings.md`;
const reportPath = `${root}/learnings/${stage}-learning-gate.json`;
const failures = [];

if (!stage) failures.push("stage is required");
for (const path of [learningPath, cumulativePath, markdownPath]) {
  if (!existsSync(path)) failures.push(`missing ${path}`);
}

const learning = existsSync(learningPath) ? readJson(learningPath, failures) : {};
const cumulative = existsSync(cumulativePath) ? readJson(cumulativePath, failures) : {};

if (learning.stage_id !== stage) failures.push(`learning stage_id must be ${stage}`);
for (const key of ["what_worked", "what_failed", "reusable_patterns", "evals_to_keep", "next_stage_changes", "risks"]) {
  if (!Array.isArray(learning[key])) failures.push(`learning ${key} must be an array`);
}
if (!Array.isArray(cumulative.stages) || !cumulative.stages.includes(stage)) {
  failures.push(`cumulative learnings must include stage ${stage}`);
}
if (!Array.isArray(cumulative.carry_forward) || cumulative.carry_forward.length === 0) {
  failures.push("cumulative learnings must include non-empty carry_forward");
}

const markdown = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
for (const heading of ["# Object Proof Stage Learnings", "## What Worked", "## What Failed", "## Carry Forward", "## Next Stage Changes", "## No Secrets"]) {
  if (!markdown.includes(heading)) failures.push(`${markdownPath} missing heading ${heading}`);
}
if (hasSecret(markdown) || hasSecret(JSON.stringify({ learning, cumulative }))) {
  failures.push("learning artifacts contain secret-looking material");
}

const report = { ok: failures.length === 0, stage, root, learningPath, cumulativePath, markdownPath, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
