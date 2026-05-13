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
const results = [];
for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, { cwd: appDir, encoding: "utf8", timeout: 120000 });
  results.push({ command: [cmd, ...args].join(" "), status: result.status, stdout: result.stdout.slice(-3000), stderr: result.stderr.slice(-3000) });
  if (result.status !== 0) {
    mkdirSync(".workflow/consumer-radar", { recursive: true });
    writeFileSync(".workflow/consumer-radar/native-checks.json", JSON.stringify({ ok: false, results }, null, 2) + "\n");
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}
mkdirSync(".workflow/consumer-radar", { recursive: true });
writeFileSync(".workflow/consumer-radar/native-checks.json", JSON.stringify({ ok: true, app_dir: resolve(appDir), results }, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, checks: results.length }, null, 2));
