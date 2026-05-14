#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const root = ".workflow/iphone-app-factory";
const requiredFiles = [
  `${root}/research/app-store.md`,
  `${root}/research/reddit.md`,
  `${root}/research/competitors.md`,
  `${root}/research/design-patterns.md`,
  `${root}/research-synthesis.md`,
  `${root}/opportunity-matrix.json`
];

const failures = [];

function readRequired(file) {
  if (!existsSync(file)) {
    failures.push(`missing ${file}`);
    return "";
  }
  const content = readFileSync(file, "utf8");
  if (content.trim().length < 300) {
    failures.push(`too little evidence in ${file}`);
  }
  if (/\b(TODO|TBD|placeholder only)\b/i.test(content)) {
    failures.push(`placeholder language remains in ${file}`);
  }
  return content;
}

const contents = new Map(requiredFiles.map((file) => [file, readRequired(file)]));
const synthesis = contents.get(`${root}/research-synthesis.md`) ?? "";

for (const term of [
  "target user",
  "jobs-to-be-done",
  "competitor",
  "App Store",
  "design",
  "MVP",
  "risk"
]) {
  if (!synthesis.toLowerCase().includes(term.toLowerCase())) {
    failures.push(`research synthesis missing required term: ${term}`);
  }
}

const matrixPath = `${root}/opportunity-matrix.json`;
try {
  const matrix = JSON.parse(contents.get(matrixPath) || "{}");
  if (!Array.isArray(matrix.opportunities) || matrix.opportunities.length === 0) {
    failures.push("opportunity matrix must contain at least one opportunity");
  } else {
    matrix.opportunities.forEach((item, index) => {
      for (const key of ["title", "evidence", "user_pain", "mvp_feature", "differentiation", "risk"]) {
        if (!(key in item)) failures.push(`opportunity ${index} missing ${key}`);
      }
      if (!Array.isArray(item.evidence) || item.evidence.length === 0) {
        failures.push(`opportunity ${index} must include evidence`);
      }
      if (!["low", "medium", "high"].includes(item.risk)) {
        failures.push(`opportunity ${index} risk must be low, medium, or high`);
      }
    });
  }
} catch (error) {
  failures.push(`invalid opportunity matrix JSON: ${error.message}`);
}

const report = { ok: failures.length === 0, failures, required_files: requiredFiles };
writeFileSync(`${root}/research-evidence-gate.json`, `${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report));
