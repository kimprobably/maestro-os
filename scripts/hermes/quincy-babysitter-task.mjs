#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function usage(code = 2) {
  console.error(
    "usage: quincy-babysitter-task.mjs --run-id RUN --source-channel C --source-thread TS [--report-channel CHANNEL] [--dry-run]",
  );
  process.exit(code);
}

function defaultReportChannel() {
  return (
    process.env.SLACK_FABRO_RUNS_CHANNEL ||
    process.env.FABRO_SLACK_CHANNEL_ID ||
    process.env.SLACK_HOME_CHANNEL ||
    "C0AHCRH4EP4"
  );
}

function requireSafeRunId(runId) {
  if (!/^[A-Za-z0-9_-]+$/.test(runId)) {
    console.error("run id must contain only letters, numbers, underscore, or dash");
    process.exit(2);
  }
  return runId;
}

let rawRunId = "";
let sourceChannel = "unknown";
let sourceThread = "unknown";
let reportChannel = defaultReportChannel();
try {
  rawRunId = argValue("--run-id");
  sourceChannel = argValue("--source-channel", "unknown");
  sourceThread = argValue("--source-thread", "unknown");
  reportChannel = argValue("--report-channel", reportChannel);
} catch {
  usage();
}
if (!rawRunId) usage();
const runId = requireSafeRunId(rawRunId);
const title = `Babysit Fabro run ${runId}`;
const idempotencyKey = `fabro-run:${runId}`;
const body = [
  "Assigned owner: Quincy",
  `Fabro run id: ${runId}`,
  `Original Slack thread: ${sourceChannel}:${sourceThread}`,
  `Report channel: ${reportChannel}`,
  "",
  "Objective: babysit this Fabro run until terminal state or blocked decision.",
  "Allowed actions: inspect Fabro MCP/events, inspect run branch/SHA, inspect preserved sandbox metadata, update Fabro run ledger, emit Kanban heartbeat, post compact heartbeat to the report channel on status changes or every 30 minutes.",
  "Forbidden actions: print secrets, dump raw logs, mutate production deploys, post as Quincy in the original Slack thread, mark generated code done without test or review evidence.",
  "Exit criteria: completed run with evidence summary, blocked approval request, credential blocker, deterministic failure with next patch target, or terminal failure with preserved artifacts and next action.",
  "Reporting: write Fabro run ledger updates after meaningful events; add Kanban comments for status changes; report blockers/final state to Miles for the original Slack thread.",
  "Write Fabro run ledger updates before making retry, fork, or recovery claims.",
  "Do not post as Quincy in the original Slack thread.",
].join("\n");

const command = [
  "hermes",
  "kanban",
  "create",
  title,
  "--assignee",
  "quincy",
  "--skill",
  "fabro-babysitter",
  "--idempotency-key",
  idempotencyKey,
  "--max-runtime",
  "2h",
  "--created-by",
  "miles",
  "--body",
  body,
  "--json",
];

if (hasFlag("--dry-run")) {
  console.log(
    JSON.stringify({ ok: true, run_id: runId, idempotency_key: idempotencyKey, command, body }, null, 2),
  );
  process.exit(0);
}

const result = spawnSync(command[0], command.slice(1), {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
if (result.status !== 0) {
  process.stderr.write(
    result.stderr || result.stdout || `hermes kanban create failed with status ${result.status}\n`,
  );
  process.exit(result.status || 1);
}
process.stdout.write(result.stdout);
