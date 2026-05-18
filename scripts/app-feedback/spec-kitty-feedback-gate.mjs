#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const analysisPath = resolve(argValue("--analysis", ".workflow/app-feedback/feedback-analysis.json"));
const outPath = resolve(argValue("--out", ".workflow/app-feedback/spec-kitty-feedback-gate.json"));
const target = argValue("--target", "consumer-radar");
const analysis = JSON.parse(readFileSync(analysisPath, "utf8"));

const spec = {
  ok: Boolean(analysis.ok) && Array.isArray(analysis.acceptance_checks) && analysis.acceptance_checks.length > 0,
  source: "Spec Kitty feedback adapter",
  target,
  checks: analysis.acceptance_checks || [],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify(spec, null, 2));
if (!spec.ok) process.exit(1);
