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

function parseList(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
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

const stage = argValue("--stage", process.env.STAGE_ID || "");
const root = argValue("--root", process.env.STAGE_ROOT || `.workflow/object-proof-program/stages/${stage}`);
const requiredCapabilities = parseList(argValue("--required-capabilities", process.env.STAGE_REQUIRED_CAPABILITIES || ""));
const reportPath = `${root}/stage-gate.json`;
const failures = [];

if (!stage) failures.push("stage is required");
if (requiredCapabilities.length === 0) failures.push("required capabilities are required");

const paths = {
  stageSpecMarkdown: `${root}/stage-spec.md`,
  stageSpecJson: `${root}/stage-spec.json`,
  evalPlan: `${root}/eval-plan.json`,
  evidenceMarkdown: `${root}/implementation-evidence.md`,
  evidenceJson: `${root}/implementation-evidence.json`,
  validationMarkdown: `${root}/validation-report.md`,
  validationJson: `${root}/validation-report.json`,
  postmortemMarkdown: `${root}/stage-postmortem.md`,
};

for (const path of Object.values(paths)) {
  if (!existsSync(path)) failures.push(`missing ${path}`);
}

const stageSpec = existsSync(paths.stageSpecJson) ? readJson(paths.stageSpecJson, failures) : {};
const evalPlan = existsSync(paths.evalPlan) ? readJson(paths.evalPlan, failures) : {};
const evidence = existsSync(paths.evidenceJson) ? readJson(paths.evidenceJson, failures) : {};
const validation = existsSync(paths.validationJson) ? readJson(paths.validationJson, failures) : {};

if (stageSpec.stage_id !== stage) failures.push(`stage-spec stage_id must be ${stage}`);
if (!Array.isArray(stageSpec.required_capabilities)) failures.push("stage-spec required_capabilities must be an array");
if (!Array.isArray(stageSpec.acceptance_criteria) || stageSpec.acceptance_criteria.length < 4) {
  failures.push("stage-spec must include at least four acceptance criteria");
}
if (!Array.isArray(evalPlan.evals) || evalPlan.evals.length < 3) failures.push("eval-plan must include at least three evals");

for (const capability of requiredCapabilities) {
  if (!stageSpec.required_capabilities?.includes(capability)) {
    failures.push(`stage spec missing required capability ${capability}`);
  }
}

if (!Array.isArray(evidence.changed_paths) || evidence.changed_paths.length === 0) {
  failures.push("implementation evidence changed_paths must be non-empty");
}
if (!Array.isArray(evidence.capability_coverage)) failures.push("implementation evidence capability_coverage must be an array");
const coverage = new Map((evidence.capability_coverage || []).map((entry) => [String(entry.capability || ""), entry]));
for (const capability of requiredCapabilities) {
  const entry = coverage.get(capability);
  if (!entry) {
    failures.push(`implementation evidence missing capability ${capability}`);
    continue;
  }
  if (entry.code_changed !== true) failures.push(`${capability} must have code_changed=true`);
  if (!entry.test_or_validation) failures.push(`${capability} missing test_or_validation`);
}

for (const key of ["commands_run", "tests_run", "quality_evidence", "residual_risks"]) {
  if (!(key in validation)) failures.push(`validation report missing ${key}`);
}

const markdown = Object.values(paths)
  .filter((path) => path.endsWith(".md") && existsSync(path))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
for (const heading of ["# Object Proof Stage Spec", "# Object Proof Implementation Evidence", "# Object Proof Validation Report", "# Object Proof Stage Postmortem"]) {
  if (!markdown.includes(heading)) failures.push(`stage markdown missing heading ${heading}`);
}
if (!markdown.includes("## No Secrets")) failures.push("stage markdown must include ## No Secrets");
if (hasSecret(markdown) || hasSecret(JSON.stringify({ stageSpec, evalPlan, evidence, validation }))) {
  failures.push("stage artifacts contain secret-looking material");
}

const report = { ok: failures.length === 0, stage, root, requiredCapabilities, paths, failures };
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
