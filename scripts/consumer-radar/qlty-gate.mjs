#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
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

const report = {
  ok: true,
  qlty_available: available,
  install_status: install ? install.status : null,
  check_status: check ? check.status : null,
  stdout: check ? check.stdout.slice(-5000) : "",
  stderr: check ? check.stderr.slice(-5000) : "qlty unavailable; native checks remain the blocking gate"
};
writeFileSync(".workflow/consumer-radar/qlty-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, qlty_available: available, check_status: report.check_status }, null, 2));
