#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const appDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const outPath = resolve(argValue("--out", ".workflow/app-feedback/handoff.json"));
const handoff = {
  ok: true,
  app_dir: appDir,
  workflow: "workflows/app-feedback/enhance-app-from-feedback.fabro",
  reports: [
    ".workflow/app-feedback/feedback-analysis.json",
    ".workflow/app-feedback/feedback-acceptance.json",
    "reports/consumer-radar/quality/native-checks.json",
    "reports/consumer-radar/quality/qlty-report.json",
    "reports/consumer-radar/quality/promptfoo-report.json",
    "reports/consumer-radar/review-consensus.json",
  ],
  next: [
    "Open the generated app dashboard.",
    "Use Add app to create manual research seeds.",
    "Run live social/review scraping before treating fixture examples as market evidence.",
  ],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(handoff, null, 2)}\n`);
console.log(JSON.stringify(handoff, null, 2));
