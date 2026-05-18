#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const commands = [
  ["npm", ["run", "typecheck"]],
  ["npm", ["test"]],
  ["npm", ["run", "build"]]
];
const workflowReport = ".workflow/consumer-radar/native-checks.json";
const trackedReport = "reports/consumer-radar/quality/native-checks.json";

function writeReport(report) {
  for (const file of [workflowReport, trackedReport]) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  }
}

const results = [];
for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, { cwd: appDir, encoding: "utf8", timeout: 120000 });
  results.push({ command: [cmd, ...args].join(" "), status: result.status, stdout: result.stdout.slice(-3000), stderr: result.stderr.slice(-3000) });
  if (result.status !== 0) {
    writeReport({ ok: false, app_dir: appDir, results });
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}
writeReport({ ok: true, app_dir: appDir, results });
console.log(JSON.stringify({ ok: true, checks: results.length }, null, 2));
