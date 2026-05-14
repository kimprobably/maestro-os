#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const phase = process.argv[2];
const appDir = process.argv[3] || "apps/generated-iphone-app";
const root = ".workflow/iphone-app-factory";
const evidence = `${root}/evidence/${phase}.md`;
const failures = [];

if (!phase) failures.push("missing phase");
if (!existsSync(appDir)) failures.push(`missing app_dir ${appDir}`);
if (!existsSync(evidence)) failures.push(`missing evidence ${evidence}`);

const text = existsSync(evidence) ? readFileSync(evidence, "utf8") : "";
for (const term of ["Files changed", "Commands run", "Acceptance criteria", "Risks"]) {
  if (!text.includes(term)) failures.push(`${evidence} missing ${term}`);
}

if (/VERDICT:\s*REJECTED|\bFAIL(ED|URE)?\b/.test(text) && !/known deferred/i.test(text)) {
  failures.push(`${evidence} contains failing verdict`);
}

const report = { ok: failures.length === 0, phase, appDir, failures };
writeFileSync(`${root}/evidence/${phase}-gate.json`, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
