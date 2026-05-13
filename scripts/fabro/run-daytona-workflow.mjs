#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function splitArgs(args) {
  const cleanupArgs = [];
  const fabroArgs = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--no-cleanup") continue;
    if (arg === "--cleanup-dry-run") {
      cleanupArgs.push("--dry-run");
      continue;
    }
    if (arg === "--cleanup-max-stopped") {
      cleanupArgs.push("--max-stopped", args[index + 1]);
      index += 1;
      continue;
    }
    fabroArgs.push(arg);
  }
  return { cleanupArgs, fabroArgs };
}

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0 || rawArgs.includes("--help")) {
  console.log(`Usage: node scripts/fabro/run-daytona-workflow.mjs <workflow.toml|workflow.fabro> [fabro run args]

Runs Daytona sandbox cleanup before launching a Daytona-backed Fabro workflow.

Wrapper options:
  --no-cleanup             Skip cleanup preflight
  --cleanup-dry-run        Report cleanup targets without archiving
  --cleanup-max-stopped N  Keep N stopped maestro-os/code-factory sandboxes (default 1)
`);
  process.exit(rawArgs.includes("--help") ? 0 : 1);
}

const noCleanup = rawArgs.includes("--no-cleanup");
const { cleanupArgs, fabroArgs } = splitArgs(rawArgs);

if (!noCleanup) {
  const cleanup = spawnSync(
    process.execPath,
    [
      "scripts/fabro/cleanup-daytona-sandboxes.mjs",
      "--out",
      ".workflow/fabro/daytona-cleanup-preflight.json",
      ...cleanupArgs,
    ],
    { stdio: "inherit" },
  );
  if (cleanup.status !== 0) process.exit(cleanup.status ?? 1);
}

const run = spawnSync("fabro", ["run", ...fabroArgs, "--sandbox", "daytona"], {
  stdio: "inherit",
});
process.exit(run.status ?? 1);
