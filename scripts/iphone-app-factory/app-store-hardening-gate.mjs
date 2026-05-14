#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const appDir = process.argv[2] || "apps/generated-iphone-app";
const root = ".workflow/iphone-app-factory";
const reportPath = `${root}/app-store-hardening.md`;
const failures = [];

if (!existsSync(reportPath)) {
  failures.push(`missing ${reportPath}`);
}

const report = existsSync(reportPath) ? readFileSync(reportPath, "utf8") : "";
if (!/VERDICT:\s*APPROVED/.test(report)) failures.push("hardening report did not approve");
if (/VERDICT:\s*REJECTED|\bREJECTED\b/.test(report)) failures.push("hardening report rejected");
for (const token of ["SwiftAI", "Boilerplate", "EchoLLM", "MockAuth", "TODO", "Review Notes", "Privacy"]) {
  if (!report.includes(token)) failures.push(`hardening report missing ${token} audit`);
}
if (!/release strings audit:\s*PASS/i.test(report)) failures.push("hardening report missing release strings audit: PASS");

const out = { ok: failures.length === 0, appDir, failures };
writeFileSync(`${root}/app-store-hardening-gate.json`, `${JSON.stringify(out, null, 2)}\n`);
if (!out.ok) {
  console.error(JSON.stringify(out, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(out));
