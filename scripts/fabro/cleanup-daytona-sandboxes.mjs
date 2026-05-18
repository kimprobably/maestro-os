#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

const project = argValue("--project", "maestro-os");
const purpose = argValue("--purpose", "code-factory");
const maxStopped = Number(argValue("--max-stopped", "1"));
const dryRun = hasFlag("--dry-run");
const outPath = resolve(argValue("--out", ".workflow/fabro/daytona-cleanup.json"));

function run(args) {
  const result = spawnSync("daytona", args, { encoding: "utf8", timeout: 120000 });
  return {
    args,
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function parseJson(stdout) {
  const start = stdout.indexOf("{");
  if (start < 0) throw new Error("Daytona JSON output missing object");
  return JSON.parse(stdout.slice(start));
}

const list = run(["list", "-f", "json"]);
if (list.status !== 0) {
  throw new Error(`daytona list failed: ${list.stderr || list.stdout}`);
}

const payload = parseJson(list.stdout);
const items = Array.isArray(payload.items) ? payload.items : [];
const candidates = items
  .filter((sandbox) => sandbox?.labels?.project === project)
  .filter((sandbox) => sandbox?.labels?.purpose === purpose)
  .filter((sandbox) => sandbox.state === "stopped" && sandbox.desiredState === "stopped")
  .filter((sandbox) => sandbox.backupState !== "InProgress")
  .sort((a, b) => String(a.lastActivityAt || a.createdAt).localeCompare(String(b.lastActivityAt || b.createdAt)));

const keep = Math.max(0, maxStopped);
const archiveTargets = candidates.slice(0, Math.max(0, candidates.length - keep));
const archiveResults = [];
for (const sandbox of archiveTargets) {
  archiveResults.push({
    id: sandbox.id,
    name: sandbox.name,
    disk: sandbox.disk,
    command: dryRun ? null : run(["archive", sandbox.id]),
  });
}

const report = {
  ok: archiveResults.every((item) => dryRun || item.command?.status === 0),
  dry_run: dryRun,
  project,
  purpose,
  max_stopped: maxStopped,
  total_seen: items.length,
  eligible_stopped: candidates.length,
  archived: archiveResults.map((item) => ({
    id: item.id,
    name: item.name,
    disk: item.disk,
    status: dryRun ? "dry-run" : item.command?.status,
  })),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
