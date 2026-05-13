#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const specPath = argValue("--spec", "specs/consumer-app-radar/spec.md");
const appDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const specKitty = process.argv.includes("--spec-kitty");
mkdirSync(".workflow/consumer-radar", { recursive: true });

if (!existsSync(specPath)) throw new Error("Missing spec: " + specPath);
mkdirSync(appDir, { recursive: true });

const report = {
  ok: true,
  spec_path: specPath,
  app_dir: appDir,
  spec_chars: readFileSync(specPath, "utf8").length,
  spec_kitty: { checked: specKitty, available: false, status: "not_requested" },
  generated_at: new Date().toISOString()
};

if (specKitty) {
  const found = spawnSync("sh", ["-lc", "command -v spec-kitty >/dev/null 2>&1"], { encoding: "utf8" });
  report.spec_kitty.available = found.status === 0;
  if (report.spec_kitty.available) {
    const result = spawnSync("sh", ["-lc", "spec-kitty verify-setup --json"], { encoding: "utf8", timeout: 30000 });
    report.spec_kitty.status = result.status === 0 ? "verified" : "warning";
    report.spec_kitty.output_excerpt = (result.stdout || result.stderr || "").slice(0, 1200);
  } else {
    report.spec_kitty.status = "missing_cli_recorded";
  }
}

writeFileSync(".workflow/consumer-radar/bootstrap-spec.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
