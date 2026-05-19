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
const reportPath = `${root}/final-gate.json`;
const postmortemPath = `${root}/final-postmortem.md`;
const publishPath = `${root}/publish-existing-app-branch.json`;
const stages = ["barcode", "preset_vision", "same_object"];
const failures = [];

if (!existsSync(postmortemPath)) failures.push(`missing ${postmortemPath}`);
if (!existsSync(publishPath)) failures.push(`missing ${publishPath}`);
for (const stage of stages) {
  for (const path of [
    `${root}/stages/${stage}/stage-gate.json`,
    `${root}/learnings/${stage}-learning-gate.json`,
    `${root}/learnings/${stage}-learnings.json`,
  ]) {
    if (!existsSync(path)) failures.push(`missing ${path}`);
  }
}

const publish = existsSync(publishPath) ? readJson(publishPath, failures) : {};
if (publish.ok !== true) failures.push("publish report must have ok=true");
if (!["committed_and_pushed", "no_changes"].includes(publish.action)) {
  failures.push("publish action must be committed_and_pushed or no_changes");
}

for (const stage of stages) {
  const gatePath = `${root}/stages/${stage}/stage-gate.json`;
  const learningGatePath = `${root}/learnings/${stage}-learning-gate.json`;
  const gate = existsSync(gatePath) ? readJson(gatePath, failures) : {};
  const learningGate = existsSync(learningGatePath) ? readJson(learningGatePath, failures) : {};
  if (gate.ok !== true) failures.push(`${stage} stage gate must be ok=true`);
  if (learningGate.ok !== true) failures.push(`${stage} learning gate must be ok=true`);
}

const postmortem = existsSync(postmortemPath) ? readFileSync(postmortemPath, "utf8") : "";
for (const heading of [
  "# Object Proof Program Postmortem",
  "## What Worked",
  "## What Failed",
  "## Manual Versus Fabro Executed",
  "## Stage Learnings",
  "## Workflow Changes Needed",
  "## Product Backlog",
  "## Next Operator Action",
  "## No Secrets",
]) {
  if (!postmortem.includes(heading)) failures.push(`${postmortemPath} missing heading ${heading}`);
}
if (hasSecret(postmortem) || hasSecret(JSON.stringify(publish))) failures.push("final artifacts contain secret-looking material");

const report = { ok: failures.length === 0, root, postmortemPath, publishPath, stages, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
