#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const appDir = process.argv[2] || "apps/generated-iphone-app";
const root = ".workflow/iphone-app-factory";
const failures = [];

function has(path) {
  return existsSync(join(appDir, path));
}

if (!existsSync(appDir)) failures.push(`missing app_dir ${appDir}`);
if (!has("Config/App.xcconfig")) failures.push("missing Config/App.xcconfig");
if (!has("Packages")) failures.push("missing Packages directory");
if (!has("SwiftAIBoilerplatePro.xcodeproj")) {
  const projects = existsSync(appDir) ? readdirSync(appDir).filter((name) => name.endsWith(".xcodeproj")) : [];
  if (projects.length === 0) failures.push("missing .xcodeproj");
}

for (const pkg of ["Core", "Networking", "Storage", "DesignSystem", "Localization"]) {
  if (!has(`Packages/${pkg}`)) failures.push(`missing required boilerplate package Packages/${pkg}`);
}

const architecture = existsSync(`${root}/architecture.md`) ? readFileSync(`${root}/architecture.md`, "utf8") : "";
for (const marker of ["CompositionRoot", "DesignSystem", "SwiftAIBoilerplatePro"]) {
  if (!architecture.includes(marker)) failures.push(`architecture missing boilerplate marker ${marker}`);
}

const report = { ok: failures.length === 0, appDir, failures };
writeFileSync(`${root}/boilerplate-contract.json`, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
