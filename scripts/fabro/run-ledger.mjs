#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const operatorLedgerScript = join(repoRoot, "scripts/operator-ledger/operator-ledger.mjs");

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function required(name) {
  const value = argValue(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function defaultHome() {
  return process.env.HERMES_HOME || join(homedir(), ".hermes");
}

function paths() {
  const hermesHome = argValue("--home", defaultHome());
  const profile = argValue("--profile", "maestro-operator");
  const stateDir = resolve(hermesHome, "profiles", profile, "state");
  return {
    hermesHome,
    profile,
    stateDir,
    dbPath: resolve(argValue("--db", join(stateDir, "fabro-run-ledger.sqlite"))),
    jsonlPath: resolve(argValue("--jsonl", join(stateDir, "fabro-run-ledger.jsonl"))),
    schemaPath: resolve(argValue("--schema", "hermes/run-ledger/schema.sql")),
  };
}

function sqliteAvailable() {
  if (hasFlag("--force-jsonl")) return false;
  return spawnSync("sqlite3", ["--version"], { encoding: "utf8" }).status === 0;
}

function sqlQuote(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      if (/(TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|SESSION|PRIVATE|OAUTH)/i.test(key)) {
        output[key] = "[redacted]";
      } else {
        output[key] = redact(child);
      }
    }
    return output;
  }
  if (typeof value === "string") {
    return value
      .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, "[redacted]")
      .replace(/xox[baprs]-[A-Za-z0-9-]+/g, "[redacted]")
      .replace(/lin_api_[A-Za-z0-9_-]+/g, "[redacted]")
      .replace(/apify_api_[A-Za-z0-9_-]+/g, "[redacted]");
  }
  return value;
}

function readJsonArg(name, fallback = {}) {
  const raw = argValue(name);
  if (!raw) return fallback;
  if (existsSync(raw)) return JSON.parse(readFileSync(raw, "utf8"));
  return JSON.parse(raw);
}

function execSql(dbPath, sql) {
  const result = spawnSync("sqlite3", [dbPath], {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "sqlite3 failed");
  }
  return result.stdout;
}

function ensureInitialized(storage) {
  mkdirSync(storage.stateDir, { recursive: true });
  if (sqliteAvailable() && existsSync(storage.schemaPath)) {
    execSql(storage.dbPath, readFileSync(storage.schemaPath, "utf8"));
    return { storage: "sqlite", path: storage.dbPath };
  }
  if (!existsSync(storage.jsonlPath)) writeFileSync(storage.jsonlPath, "");
  return { storage: "jsonl", path: storage.jsonlPath };
}

function appendJsonl(storage, event) {
  mkdirSync(dirname(storage.jsonlPath), { recursive: true });
  appendFileSync(storage.jsonlPath, `${JSON.stringify(event)}\n`);
}

function appendSqlite(storage, event) {
  const payload = JSON.stringify(event.payload || {});
  const appInputs = JSON.stringify(event.app_inputs || {});
  const knownFailures = JSON.stringify(event.known_failures || []);
  const openRisks = JSON.stringify(event.open_quality_risks || []);
  const decisions = JSON.stringify(event.decisions_taken || []);
  const sql = `
PRAGMA foreign_keys = ON;
INSERT INTO fabro_runs (
  run_id, workflow_file, app_inputs_json, current_status, current_node,
  next_node_id, failure_class, latest_git_sha, run_branch, sandbox_name,
  sandbox_id, last_event_cursor, last_event_id, known_failures_json,
  decisions_taken_json, open_quality_risks_json, next_action, updated_at
) VALUES (
  ${sqlQuote(event.run_id)}, ${sqlQuote(event.workflow_file)}, ${sqlQuote(appInputs)},
  ${sqlQuote(event.current_status)}, ${sqlQuote(event.current_node)},
  ${sqlQuote(event.next_node_id)}, ${sqlQuote(event.failure_class)},
  ${sqlQuote(event.latest_git_sha)}, ${sqlQuote(event.run_branch)},
  ${sqlQuote(event.sandbox_name)}, ${sqlQuote(event.sandbox_id)},
  ${event.fabro_event_cursor ?? 0}, ${sqlQuote(event.fabro_event_id)},
  ${sqlQuote(knownFailures)}, ${sqlQuote(decisions)}, ${sqlQuote(openRisks)},
  ${sqlQuote(event.next_action)}, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(run_id) DO UPDATE SET
  workflow_file = excluded.workflow_file,
  app_inputs_json = excluded.app_inputs_json,
  current_status = excluded.current_status,
  current_node = excluded.current_node,
  next_node_id = excluded.next_node_id,
  failure_class = excluded.failure_class,
  latest_git_sha = excluded.latest_git_sha,
  run_branch = excluded.run_branch,
  sandbox_name = excluded.sandbox_name,
  sandbox_id = excluded.sandbox_id,
  last_event_cursor = MAX(fabro_runs.last_event_cursor, excluded.last_event_cursor),
  last_event_id = excluded.last_event_id,
  known_failures_json = excluded.known_failures_json,
  decisions_taken_json = excluded.decisions_taken_json,
  open_quality_risks_json = excluded.open_quality_risks_json,
  next_action = excluded.next_action,
  updated_at = excluded.updated_at;

INSERT OR IGNORE INTO fabro_run_events (
  run_id, cursor, event_id, event_type, event_created_at, node_id, stage_id, summary, payload_json
) VALUES (
  ${sqlQuote(event.run_id)}, ${event.fabro_event_cursor ?? "NULL"}, ${sqlQuote(event.fabro_event_id)},
  ${sqlQuote(event.event_kind)}, ${sqlQuote(event.recorded_at)}, ${sqlQuote(event.current_node)},
  ${sqlQuote(event.stage_id)}, ${sqlQuote(event.summary)}, ${sqlQuote(payload)}
);
`;
  execSql(storage.dbPath, sql);
}

function mirrorOperatorLedger(storage, event, initializedStorage) {
  if (hasFlag("--skip-operator-ledger")) return;
  if (!existsSync(operatorLedgerScript)) return;

  const externalId = event.fabro_event_id
    || (event.fabro_event_cursor !== null && event.fabro_event_cursor !== undefined
      ? `cursor:${event.fabro_event_cursor}`
      : `${event.event_kind}:${event.recorded_at}`);
  const payload = {
    run_id: event.run_id,
    workflow_file: event.workflow_file,
    event_kind: event.event_kind,
    fabro_event_cursor: event.fabro_event_cursor,
    fabro_event_id: event.fabro_event_id,
    current_status: event.current_status,
    current_node: event.current_node,
    next_node_id: event.next_node_id,
    failure_class: event.failure_class,
    latest_git_sha: event.latest_git_sha,
    run_branch: event.run_branch,
    sandbox_name: event.sandbox_name,
    sandbox_id: event.sandbox_id,
    next_action: event.next_action,
    summary: event.summary,
    payload: event.payload || {},
  };
  const args = [
    operatorLedgerScript,
    "append-event",
    "--home",
    storage.hermesHome,
    "--profile",
    storage.profile,
    "--subject-type",
    "fabro_run",
    "--subject-key",
    event.run_id,
    "--event-type",
    `fabro.${event.event_kind}`,
    "--source",
    "fabro",
    "--external-id",
    externalId,
    "--summary",
    event.summary || event.next_action || event.current_status || event.event_kind,
    "--payload-json",
    JSON.stringify(payload),
  ];
  if (initializedStorage === "jsonl") args.push("--force-jsonl");

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    process.stderr.write(`operator ledger mirror failed: ${result.stderr || result.stdout || "unknown error"}\n`);
  }
}

function buildEvent() {
  const payload = redact(readJsonArg("--payload-json", {}));
  return {
    recorded_at: new Date().toISOString(),
    run_id: required("--run-id"),
    workflow_file: argValue("--workflow-file"),
    event_kind: argValue("--event-kind", "observed"),
    fabro_event_cursor: argValue("--cursor") ? Number(argValue("--cursor")) : null,
    fabro_event_id: argValue("--event-id"),
    current_status: argValue("--current-status", "unknown"),
    current_node: argValue("--current-node"),
    next_node_id: argValue("--next-node-id"),
    failure_class: argValue("--failure-class"),
    latest_git_sha: argValue("--latest-git-sha"),
    run_branch: argValue("--run-branch"),
    sandbox_name: argValue("--sandbox-name"),
    sandbox_id: argValue("--sandbox-id"),
    evidence: payload,
    payload,
    decision: argValue("--decision"),
    known_failures: readJsonArg("--known-failures-json", []),
    decisions_taken: readJsonArg("--decisions-taken-json", []),
    open_quality_risks: readJsonArg("--open-quality-risks-json", []),
    next_action: redact(argValue("--next-action", "inspect")),
    summary: redact(argValue("--summary")),
  };
}

function summarizeJsonl(storage, runId) {
  if (!existsSync(storage.jsonlPath)) return null;
  const events = readFileSync(storage.jsonlPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((event) => event.run_id === runId);
  return events.at(-1) || null;
}

function summarizeSqlite(storage, runId) {
  const sql = `SELECT json_object(
    'run_id', run_id,
    'current_status', current_status,
    'current_node', current_node,
    'failure_class', failure_class,
    'latest_git_sha', latest_git_sha,
    'run_branch', run_branch,
    'last_event_cursor', last_event_cursor,
    'next_action', next_action,
    'updated_at', updated_at
  ) FROM fabro_runs WHERE run_id = ${sqlQuote(runId)};`;
  const output = execSql(storage.dbPath, sql).trim();
  return output ? JSON.parse(output) : null;
}

const command = process.argv[2];
if (!command || command === "--help" || command === "-h") {
  console.log(`Usage:
  node scripts/fabro/run-ledger.mjs init [--home <HERMES_HOME>] [--force-jsonl]
  node scripts/fabro/run-ledger.mjs append-event --run-id <id> --current-status <status> --next-action <action> [--payload-json <json|file>]
  node scripts/fabro/run-ledger.mjs summarize-run --run-id <id>

Uses Hermes ledger storage by default:
  $HERMES_HOME/profiles/maestro-operator/state/fabro-run-ledger.sqlite
`);
  process.exit(command ? 0 : 1);
}

const storage = paths();
const initialized = ensureInitialized(storage);

if (command === "init") {
  console.log(JSON.stringify({ ok: true, ...initialized }, null, 2));
} else if (command === "append-event") {
  const event = buildEvent();
  if (initialized.storage === "sqlite") appendSqlite(storage, event);
  else appendJsonl(storage, event);
  mirrorOperatorLedger(storage, event, initialized.storage);
  console.log(JSON.stringify({ ok: true, storage: initialized.storage, path: initialized.path, run_id: event.run_id }, null, 2));
} else if (command === "summarize-run") {
  const runId = required("--run-id");
  const summary = initialized.storage === "sqlite" ? summarizeSqlite(storage, runId) : summarizeJsonl(storage, runId);
  console.log(JSON.stringify({ ok: Boolean(summary), storage: initialized.storage, path: initialized.path, summary }, null, 2));
  if (!summary) process.exit(1);
} else {
  throw new Error(`Unknown command: ${command}`);
}
