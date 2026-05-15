#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const appDir = process.argv[2] || "apps/generated-iphone-app";
const root = ".workflow/iphone-app-factory";

function maybe(path) {
  return existsSync(path) ? path : null;
}

const handoff = {
  ok: true,
  app_dir: appDir,
  spec: maybe(`${root}/spec.md`),
  definition_of_done: maybe(`${root}/definition-of-done.md`),
  architecture: maybe(`${root}/architecture.md`),
  adr: maybe(`${root}/adr.md`),
  research_synthesis: maybe(`${root}/research-synthesis.md`),
  quality_reports: [
    maybe(`${root}/quality-contract-gate.json`),
    maybe(`${root}/ios-ci-gate.json`),
    maybe(`${root}/appium-gate.json`),
    maybe(`${root}/app-store-hardening-gate.json`),
    maybe(`${root}/prompt-context-budget.json`),
    maybe(`${root}/artifact-metadata-gate.json`),
    maybe(join(appDir, "reports/ios/ios-quality-report.json")),
    maybe(join(appDir, "reports/ios/appium-exploratory-report.json"))
  ].filter(Boolean),
  final_review: maybe(`${root}/final-consensus.md`),
  next: [
    "Review the final consensus and release handoff.",
    "Open the generated app in Xcode if any macOS/device validation was deferred.",
    "Do not submit to App Store until TestFlight/internal QA and App Store Connect metadata are complete."
  ],
  updated_at: new Date().toISOString()
};

writeFileSync(`${root}/handoff.json`, `${JSON.stringify(handoff, null, 2)}\n`);
console.log(JSON.stringify(handoff));
