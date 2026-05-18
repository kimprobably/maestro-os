#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const target = argValue("--target", "consumer-radar");
const appDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const feedback = argValue("--feedback", "feedback/consumer-radar-product-feedback.md");

const adapters = {
  "consumer-radar": "scripts/app-feedback/apply-consumer-radar-feedback.mjs",
};

const adapter = adapters[target];
if (!adapter) {
  throw new Error(`Unsupported feedback enhancement target: ${target}`);
}

const result = spawnSync(
  process.execPath,
  [adapter, "--app-dir", appDir, "--feedback", feedback],
  { cwd: resolve("."), encoding: "utf8", stdio: "inherit" },
);

process.exit(result.status ?? 1);
