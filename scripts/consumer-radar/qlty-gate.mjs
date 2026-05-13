#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

function argBool(name, fallback) {
  const raw = argValue(name, String(fallback));
  return raw === true || raw === "true" || raw === "1" || raw === "yes";
}

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const realMode = argBool("--real-mode", false);
const allowFallback = argBool("--allow-fallback", true);
mkdirSync(".workflow/consumer-radar", { recursive: true });

function run(cmd) {
  return spawnSync("sh", ["-lc", cmd], { cwd: appDir, encoding: "utf8", timeout: 180000 });
}

let available = spawnSync("sh", ["-lc", "command -v qlty >/dev/null 2>&1"], { encoding: "utf8" }).status === 0;
let install = null;
if (!available) {
  install = spawnSync("sh", ["-lc", "curl -fsSL https://qlty.sh | sh >/tmp/qlty-install.log 2>&1"], { encoding: "utf8", timeout: 180000 });
  available = spawnSync("sh", ["-lc", "export PATH=$HOME/.qlty/bin:$PATH; command -v qlty >/dev/null 2>&1"], { encoding: "utf8" }).status === 0;
}

let check = null;
if (available) {
  check = run("export PATH=$HOME/.qlty/bin:$PATH; qlty check --all --no-progress --no-fail --summary --no-upgrade-check");
}

const hardFailures = [];
if (realMode && !allowFallback) {
  if (!available) hardFailures.push("Qlty unavailable in real mode");
  if (check && check.status !== 0) hardFailures.push("Qlty check command failed in real mode");
}
const report = {
  ok: hardFailures.length === 0,
  real_mode: realMode,
  allow_fallback: allowFallback,
  qlty_available: available,
  install_status: install ? install.status : null,
  check_status: check ? check.status : null,
  hard_failures: hardFailures,
  stdout: check ? check.stdout.slice(-5000) : "",
  stderr: check ? check.stderr.slice(-5000) : "qlty unavailable; native checks remain the blocking gate"
};
writeFileSync(".workflow/consumer-radar/qlty-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
