#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const requiredArtifacts = [
  "existing-app-intake.md",
  "reference-gap-analysis.json",
  "design-opportunity-synthesis.md",
  "reference-pack.json",
];

const supplementalArtifacts = [
  "competitor-flows.md",
  "app-store-review-mining.md",
  "mobbin-mcp-research.md",
  "pageflows-research.md",
  "apple-hig-research.md",
  "behavioral-ux-research.md",
];

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function boolArg(name, fallback) {
  const envName = name.replace(/^--/, "").replace(/-/g, "_").toUpperCase();
  const value = argValue(name, process.env[`UX_${envName}`] || process.env[envName] || String(fallback));
  return !/^(false|0|no)$/i.test(value);
}

const root = argValue("--root", ".workflow/iphone-app-ux-studio/research");
const useMobbinMcp = boolArg("--use-mobbin-mcp", true);
const reportPath = join(root, "reference-pack-gate.json");
const failures = [];

function writeReport(report) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`invalid ${label}: ${error.message}`);
    return {};
  }
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizedText(value) {
  return asArray(value)
    .filter((item) => item !== null && item !== undefined)
    .map((item) => String(item).toLowerCase().replace(/[_-]+/g, " "))
    .join(" ");
}

function hasRequiredGuidance(item) {
  return typeof item?.what_to_adapt === "string"
    && item.what_to_adapt.trim().length > 0
    && typeof item?.what_not_to_copy === "string"
    && item.what_not_to_copy.trim().length > 0;
}

function isCompetitorFlow(reference) {
  const text = normalizedText([
    reference?.type,
    reference?.category,
    reference?.source,
    reference?.source_type,
    reference?.provider,
    reference?.tags,
  ]);
  return text.includes("competitor flow") || (text.includes("competitor") && text.includes("flow"));
}

function isMobbinOrPageflows(reference) {
  const text = normalizedText([
    reference?.type,
    reference?.category,
    reference?.source,
    reference?.source_type,
    reference?.provider,
    reference?.url,
    reference?.tags,
  ]);
  return /\bmobbin\b/.test(text) || /\bpage\s*flows?\b/.test(text) || /\bpageflows\b/.test(text);
}

function screenTypesFromReference(reference) {
  return [
    ...asArray(reference?.screen_type),
    ...asArray(reference?.screen_types),
    ...asArray(reference?.screenTypes),
    ...asArray(reference?.screens).map((screen) => typeof screen === "string" ? screen : screen?.type),
  ].filter(Boolean);
}

function collectScreenTypes(pack, references) {
  const values = [
    ...asArray(pack.screen_types),
    ...asArray(pack.screenTypes),
    ...asArray(pack.top_screens).map((screen) => typeof screen === "string" ? screen : screen?.type),
  ];
  for (const reference of references) values.push(...screenTypesFromReference(reference));
  return new Set(values.map((value) => String(value).trim()).filter(Boolean));
}

function allReportPaths(dir) {
  if (!existsSync(dir)) return [];
  const paths = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (entry === "reference-pack-gate.json") continue;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      paths.push(...allReportPaths(path));
    } else if (/\.(md|json)$/i.test(entry)) {
      paths.push(path);
    }
  }
  return paths;
}

function credentialFindings(text) {
  const patterns = [
    /\b(?:api[_-]?key|secret|password|passwd|token|access[_-]?token|refresh[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=:@-]{8,}/gi,
    /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
    /\b(?:sk|pk|rk|xox[baprs]|gh[pousr])-[A-Za-z0-9_-]{10,}/gi,
  ];
  return patterns.flatMap((pattern) => Array.from(text.matchAll(pattern), (match) => match[0]));
}

for (const artifact of requiredArtifacts) {
  if (!existsSync(join(root, artifact))) failures.push(`missing ${artifact}`);
}

const missingSupplementalArtifacts = supplementalArtifacts.filter((artifact) => !existsSync(join(root, artifact)));

let pack = {};
const packPath = join(root, "reference-pack.json");
if (existsSync(packPath)) pack = readJson(packPath, "reference-pack.json");

const references = Array.isArray(pack.references)
  ? pack.references
  : Array.isArray(pack.reference_pack?.references)
    ? pack.reference_pack.references
    : [];
const observations = Array.isArray(pack.observations)
  ? pack.observations
  : Array.isArray(pack.reference_pack?.observations)
    ? pack.reference_pack.observations
    : [];
const rawAssets = Array.isArray(pack.raw_assets)
  ? pack.raw_assets
  : Array.isArray(pack.rawAssets)
    ? pack.rawAssets
    : [];

const competitorFlowReferences = references.filter(isCompetitorFlow);
const mobbinOrPageflowsReferences = references.filter(isMobbinOrPageflows);
const screenTypes = collectScreenTypes(pack, references);

if (references.length < 12) failures.push(`reference-pack.json must include at least 12 total references; found ${references.length}`);
if (competitorFlowReferences.length < 4) {
  failures.push(`reference-pack.json must include at least 4 competitor flow references; found ${competitorFlowReferences.length}`);
}
if (useMobbinMcp && mobbinOrPageflowsReferences.length < 4) {
  failures.push(`reference-pack.json must include at least 4 Mobbin or Page Flows references when use_mobbin_mcp=true; found ${mobbinOrPageflowsReferences.length}`);
}
if (screenTypes.size < 5) failures.push(`reference-pack.json must include at least 5 screen types; found ${screenTypes.size}`);

references.forEach((reference, index) => {
  if (!hasRequiredGuidance(reference)) {
    if (!reference?.what_to_adapt) failures.push(`references[${index}] missing what_to_adapt`);
    if (!reference?.what_not_to_copy) failures.push(`references[${index}] missing what_not_to_copy`);
  }
});

observations.forEach((observation, index) => {
  if (!hasRequiredGuidance(observation)) {
    if (!observation?.what_to_adapt) failures.push(`observations[${index}] missing what_to_adapt`);
    if (!observation?.what_not_to_copy) failures.push(`observations[${index}] missing what_not_to_copy`);
  }
});

rawAssets.forEach((asset, index) => {
  if (asset?.private_only !== true) failures.push(`raw_assets[${index}] private_only must be true`);
});

for (const path of allReportPaths(root)) {
  const text = readFileSync(path, "utf8");
  const findings = credentialFindings(text);
  if (findings.length > 0) {
    failures.push(`credential-looking value found in ${path.replace(`${root}/`, "")}`);
  }
}

const report = {
  ok: failures.length === 0,
  root,
  use_mobbin_mcp: useMobbinMcp,
  counts: {
    total_references: references.length,
    competitor_flow_references: competitorFlowReferences.length,
    mobbin_or_pageflows_references: mobbinOrPageflowsReferences.length,
    screen_types: screenTypes.size,
    observations: observations.length,
    raw_assets: rawAssets.length,
  },
  required_artifacts: requiredArtifacts,
  supplemental_artifacts: supplementalArtifacts,
  missing_supplemental_artifacts: missingSupplementalArtifacts,
  artifact_policy: "reference-pack.json is the deterministic gate contract; branch sidecar Markdown is supplemental because Fabro parallel fan-in may preserve only one branch head.",
  failures,
};

writeReport(report);

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report));
