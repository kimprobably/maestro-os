#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const root = ".workflow/iphone-app-factory";
const required = [
  `${root}/research-synthesis.md`,
  `${root}/spec.md`,
  `${root}/definition-of-done.md`,
  `${root}/spec-consensus.md`,
  `${root}/spec-red-team.md`
];

const failures = [];
for (const file of required) {
  if (!existsSync(file)) failures.push(`missing ${file}`);
}

function read(file) {
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

const spec = read(`${root}/spec.md`);
const dod = read(`${root}/definition-of-done.md`);
const redTeam = read(`${root}/spec-red-team.md`);

for (const term of ["Research Evidence", "Acceptance Criteria", "Definition of Done", "Boilerplate", "Appium", "App Store"]) {
  if (!spec.includes(term) && !dod.includes(term)) failures.push(`spec/dod missing required term: ${term}`);
}

if (!/VERDICT:\s*APPROVED/.test(redTeam)) {
  failures.push("spec red-team did not approve");
}
if (/VERDICT:\s*REJECTED|\bREJECTED\b/.test(redTeam)) {
  failures.push("spec red-team contains rejection");
}

const report = { ok: failures.length === 0, failures };
writeFileSync(`${root}/spec-gate.json`, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
