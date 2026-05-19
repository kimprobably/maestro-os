#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const root = process.env.OBJECT_PROOF_ROOT || ".workflow/object-proof-program";
const specPath = `${root}/program-spec.json`;
const markdownPath = `${root}/program-spec.md`;
const reportPath = `${root}/program-spec-gate.json`;
const failures = [];

function readJson(path) {
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

if (!existsSync(markdownPath)) failures.push(`missing ${markdownPath}`);
if (!existsSync(specPath)) failures.push(`missing ${specPath}`);

const spec = existsSync(specPath) ? readJson(specPath) : {};
for (const key of ["program_goal", "stage_order", "stages", "learning_contract", "eval_strategy", "validation_strategy", "non_goals"]) {
  if (!(key in spec)) failures.push(`program spec missing ${key}`);
}

const stageOrder = Array.isArray(spec.stage_order) ? spec.stage_order : [];
const expectedOrder = ["barcode", "preset_vision", "same_object"];
if (JSON.stringify(stageOrder) !== JSON.stringify(expectedOrder)) {
  failures.push(`stage_order must be ${expectedOrder.join(",")}`);
}

const stages = Array.isArray(spec.stages) ? spec.stages : [];
for (const stageId of expectedOrder) {
  const stage = stages.find((entry) => entry?.id === stageId);
  if (!stage) {
    failures.push(`missing stage ${stageId}`);
    continue;
  }
  if (!Array.isArray(stage.required_capabilities) || stage.required_capabilities.length < 3) {
    failures.push(`${stageId} must declare at least three required capabilities`);
  }
  if (!Array.isArray(stage.acceptance_criteria) || stage.acceptance_criteria.length < 4) {
    failures.push(`${stageId} must declare at least four acceptance criteria`);
  }
}

const text = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
for (const heading of [
  "# Object Proof Program Spec",
  "## Program Goal",
  "## Stage Order",
  "## Stage Specs",
  "## Learning Contract",
  "## Eval Strategy",
  "## Validation Strategy",
  "## Non-Goals",
  "## No Secrets",
]) {
  if (!text.includes(heading)) failures.push(`${markdownPath} missing heading ${heading}`);
}
if (hasSecret(text) || hasSecret(JSON.stringify(spec))) failures.push("program spec contains secret-looking material");

const report = { ok: failures.length === 0, root, specPath, markdownPath, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
