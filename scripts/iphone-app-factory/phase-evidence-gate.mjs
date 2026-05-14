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

const hasKnownDeferred = /known deferred/i.test(text);

if (!hasKnownDeferred && /VERDICT:\s*REJECTED|\bFAIL(ED|URE)?\b/i.test(text)) {
  failures.push(`${evidence} contains failing verdict`);
}

if (!hasKnownDeferred && !/Verifier notes/i.test(text)) {
  failures.push(`${evidence} missing Verifier notes`);
}

if (!hasKnownDeferred && /(^|\n)\s*-\s*\[\s\]/.test(text)) {
  failures.push(`${evidence} has unchecked acceptance criteria`);
}

if (
  !hasKnownDeferred &&
  /status:\s*blocked|blocked by|blocking:|permission denied|not writable|cannot .*implement|could not .*implement|not implemented|retry target|verification failed/i.test(
    text
  )
) {
  failures.push(`${evidence} contains blocked or incomplete phase evidence`);
}

const verifierIndex = text.search(/Verifier notes/i);
if (
  !hasKnownDeferred &&
  verifierIndex >= 0 &&
  /rejected|failed|not acceptable|do not advance|retry/i.test(text.slice(verifierIndex))
) {
  failures.push(`${evidence} verifier notes reject phase`);
}

const report = { ok: failures.length === 0, phase, appDir, failures };
writeFileSync(`${root}/evidence/${phase}-gate.json`, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
