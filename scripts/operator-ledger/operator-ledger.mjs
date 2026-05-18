#!/usr/bin/env node
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

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

export function paths() {
  const hermesHome = argValue("--home", defaultHome());
  const profile = argValue("--profile", "maestro-operator");
  const stateDir = resolve(hermesHome, "profiles", profile, "state");
  return {
    hermesHome,
    profile,
    stateDir,
    dbPath: resolve(argValue("--db", join(stateDir, "operator-ledger.sqlite"))),
    jsonlPath: resolve(argValue("--jsonl", join(stateDir, "operator-ledger.jsonl"))),
    schemaPath: resolve(argValue("--schema", "hermes/operator-ledger/schema.sql")),
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

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      if (/(^|[_-])(TOKEN|SECRET|PASSWORD|CREDENTIAL|COOKIE|SESSION|PRIVATE|OAUTH|API[_-]?KEY|AUTH[_-]?(TOKEN|KEY|SECRET|HEADER)|AUTHORIZATION|BEARER)([_-]|$)/i.test(key)) {
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
      .replace(/xapp-[A-Za-z0-9-]+/g, "[redacted]")
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

export function execSql(dbPath, sql) {
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

export function ensureInitialized(storage = paths()) {
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

function sqliteJson(dbPath, sql) {
  const output = execSql(dbPath, `.mode json\n${sql}`).trim();
  return output ? JSON.parse(output) : [];
}

function upsertSubjectSql(subjectType, subjectKey, title = null, metadata = {}) {
  const metadataJson = JSON.stringify(redact(metadata));
  return `
INSERT INTO ledger_subjects (subject_type, subject_key, title, metadata_json, updated_at)
VALUES (${sqlQuote(subjectType)}, ${sqlQuote(subjectKey)}, ${sqlQuote(title)}, ${sqlQuote(metadataJson)}, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT(subject_type, subject_key) DO UPDATE SET
  title = COALESCE(excluded.title, ledger_subjects.title),
  metadata_json = CASE WHEN excluded.metadata_json != '{}' THEN excluded.metadata_json ELSE ledger_subjects.metadata_json END,
  updated_at = excluded.updated_at;
`;
}

function appendEventSqlite(storage, event) {
  const payloadJson = JSON.stringify(redact(event.payload || {}));
  const metadata = event.subject_metadata || {};
  const sql = `
PRAGMA foreign_keys = ON;
${upsertSubjectSql(event.subject_type, event.subject_key, event.subject_title, metadata)}
INSERT OR IGNORE INTO ledger_events (
  subject_id, subject_type, subject_key, event_type, source, external_id, summary, payload_json, recorded_at
)
SELECT
  id,
  ${sqlQuote(event.subject_type)},
  ${sqlQuote(event.subject_key)},
  ${sqlQuote(event.event_type)},
  ${sqlQuote(event.source)},
  ${sqlQuote(event.external_id)},
  ${sqlQuote(event.summary)},
  ${sqlQuote(payloadJson)},
  ${sqlQuote(event.recorded_at)}
FROM ledger_subjects
WHERE subject_type = ${sqlQuote(event.subject_type)} AND subject_key = ${sqlQuote(event.subject_key)};
`;
  execSql(storage.dbPath, sql);
}

function upsertCheckpointSqlite(storage, checkpoint) {
  const stateJson = JSON.stringify(redact(checkpoint.state || {}));
  const sql = `
PRAGMA foreign_keys = ON;
${upsertSubjectSql(checkpoint.subject_type, checkpoint.subject_key)}
INSERT INTO ledger_checkpoints (
  subject_id, subject_type, subject_key, summary, state_json, updated_at
)
SELECT
  id,
  ${sqlQuote(checkpoint.subject_type)},
  ${sqlQuote(checkpoint.subject_key)},
  ${sqlQuote(redact(checkpoint.summary))},
  ${sqlQuote(stateJson)},
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM ledger_subjects
WHERE subject_type = ${sqlQuote(checkpoint.subject_type)} AND subject_key = ${sqlQuote(checkpoint.subject_key)}
ON CONFLICT(subject_id) DO UPDATE SET
  summary = excluded.summary,
  state_json = excluded.state_json,
  updated_at = excluded.updated_at;
`;
  execSql(storage.dbPath, sql);
}

function linkSubjectsSqlite(storage, link) {
  const metadataJson = JSON.stringify(redact(link.metadata || {}));
  const sql = `
PRAGMA foreign_keys = ON;
${upsertSubjectSql(link.from_type, link.from_key)}
${upsertSubjectSql(link.to_type, link.to_key)}
INSERT OR IGNORE INTO ledger_links (
  from_subject_id, from_type, from_key, to_subject_id, to_type, to_key, relationship, metadata_json
)
SELECT
  from_subject.id,
  ${sqlQuote(link.from_type)},
  ${sqlQuote(link.from_key)},
  to_subject.id,
  ${sqlQuote(link.to_type)},
  ${sqlQuote(link.to_key)},
  ${sqlQuote(link.relationship)},
  ${sqlQuote(metadataJson)}
FROM ledger_subjects AS from_subject
CROSS JOIN ledger_subjects AS to_subject
WHERE from_subject.subject_type = ${sqlQuote(link.from_type)}
  AND from_subject.subject_key = ${sqlQuote(link.from_key)}
  AND to_subject.subject_type = ${sqlQuote(link.to_type)}
  AND to_subject.subject_key = ${sqlQuote(link.to_key)};
`;
  execSql(storage.dbPath, sql);
}

export function summarizeSubjectSqlite(storage, subjectType, subjectKey, limit = 5) {
  const subjectRows = sqliteJson(storage.dbPath, `
SELECT subject_type, subject_key, title, metadata_json, created_at, updated_at
FROM ledger_subjects
WHERE subject_type = ${sqlQuote(subjectType)} AND subject_key = ${sqlQuote(subjectKey)};
`);
  if (!subjectRows.length) return null;
  const checkpointRows = sqliteJson(storage.dbPath, `
SELECT summary, state_json, updated_at
FROM ledger_checkpoints
WHERE subject_type = ${sqlQuote(subjectType)} AND subject_key = ${sqlQuote(subjectKey)}
LIMIT 1;
`);
  const eventRows = sqliteJson(storage.dbPath, `
SELECT event_type, source, external_id, summary, payload_json, recorded_at
FROM ledger_events
WHERE subject_type = ${sqlQuote(subjectType)} AND subject_key = ${sqlQuote(subjectKey)}
ORDER BY recorded_at DESC, id DESC
LIMIT ${Number(limit) || 5};
`);
  const linkRows = sqliteJson(storage.dbPath, `
SELECT from_type, from_key, to_type, to_key, relationship, metadata_json, created_at
FROM ledger_links
WHERE from_type = ${sqlQuote(subjectType)} AND from_key = ${sqlQuote(subjectKey)}
ORDER BY created_at DESC, id DESC;
`);
  return {
    subject: normalizeJsonFields(subjectRows[0], ["metadata_json"]),
    checkpoint: checkpointRows[0] ? normalizeJsonFields(checkpointRows[0], ["state_json"]) : null,
    recent_events: eventRows.reverse().map((row) => normalizeJsonFields(row, ["payload_json"])),
    links: linkRows.map((row) => normalizeJsonFields(row, ["metadata_json"])),
  };
}

function summarizeSubjectJsonl(storage, subjectType, subjectKey) {
  if (!existsSync(storage.jsonlPath)) return null;
  const rows = readFileSync(storage.jsonlPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((event) => event.subject_type === subjectType && event.subject_key === subjectKey);
  if (!rows.length) return null;
  return { subject: { type: subjectType, key: subjectKey }, checkpoint: null, recent_events: rows.slice(-5), links: [] };
}

function normalizeJsonFields(row, fields) {
  const output = { ...row };
  for (const field of fields) {
    const target = field.replace(/_json$/, "");
    try {
      output[target] = output[field] ? JSON.parse(output[field]) : field === "payload_json" ? {} : null;
    } catch {
      output[target] = output[field];
    }
    delete output[field];
  }
  if (Object.hasOwn(output, "subject_type")) {
    output.type = output.subject_type;
    delete output.subject_type;
  }
  if (Object.hasOwn(output, "subject_key")) {
    output.key = output.subject_key;
    delete output.subject_key;
  }
  return output;
}

function buildEvent() {
  return {
    recorded_at: new Date().toISOString(),
    subject_type: required("--subject-type"),
    subject_key: required("--subject-key"),
    subject_title: argValue("--subject-title"),
    subject_metadata: readJsonArg("--subject-metadata-json", {}),
    event_type: required("--event-type"),
    source: argValue("--source", "hermes"),
    external_id: argValue("--external-id"),
    summary: redact(argValue("--summary")),
    payload: readJsonArg("--payload-json", {}),
  };
}

function usage(exitCode = 1) {
  console.log(`Usage:
  node scripts/operator-ledger/operator-ledger.mjs init [--home <HERMES_HOME>] [--force-jsonl]
  node scripts/operator-ledger/operator-ledger.mjs append-event --subject-type <type> --subject-key <key> --event-type <type> [--source <source>] [--external-id <id>] [--payload-json <json|file>]
  node scripts/operator-ledger/operator-ledger.mjs upsert-checkpoint --subject-type <type> --subject-key <key> --summary <text> [--state-json <json|file>]
  node scripts/operator-ledger/operator-ledger.mjs summarize-subject --subject-type <type> --subject-key <key>
  node scripts/operator-ledger/operator-ledger.mjs link-subjects --from-type <type> --from-key <key> --to-type <type> --to-key <key> --relationship <name>
`);
  process.exit(exitCode);
}

function main() {
  const command = process.argv[2];
  if (!command || command === "--help" || command === "-h") usage(command ? 0 : 1);
  const storage = paths();
  const initialized = ensureInitialized(storage);

  if (command === "init") {
    console.log(JSON.stringify({ ok: true, ...initialized }, null, 2));
  } else if (command === "append-event") {
    const event = buildEvent();
    if (initialized.storage === "sqlite") appendEventSqlite(storage, event);
    else appendJsonl(storage, { kind: "event", ...redact(event) });
    console.log(JSON.stringify({ ok: true, storage: initialized.storage, path: initialized.path, subject_type: event.subject_type, subject_key: event.subject_key }, null, 2));
  } else if (command === "upsert-checkpoint") {
    const checkpoint = {
      subject_type: required("--subject-type"),
      subject_key: required("--subject-key"),
      summary: required("--summary"),
      state: readJsonArg("--state-json", {}),
    };
    if (initialized.storage === "sqlite") upsertCheckpointSqlite(storage, checkpoint);
    else appendJsonl(storage, { kind: "checkpoint", recorded_at: new Date().toISOString(), ...redact(checkpoint) });
    console.log(JSON.stringify({ ok: true, storage: initialized.storage, path: initialized.path, subject_type: checkpoint.subject_type, subject_key: checkpoint.subject_key }, null, 2));
  } else if (command === "summarize-subject") {
    const subjectType = required("--subject-type");
    const subjectKey = required("--subject-key");
    const summary = initialized.storage === "sqlite"
      ? summarizeSubjectSqlite(storage, subjectType, subjectKey)
      : summarizeSubjectJsonl(storage, subjectType, subjectKey);
    console.log(JSON.stringify({ ok: Boolean(summary), storage: initialized.storage, path: initialized.path, summary }, null, 2));
    if (!summary) process.exit(1);
  } else if (command === "link-subjects") {
    const link = {
      from_type: required("--from-type"),
      from_key: required("--from-key"),
      to_type: required("--to-type"),
      to_key: required("--to-key"),
      relationship: required("--relationship"),
      metadata: readJsonArg("--metadata-json", {}),
    };
    if (initialized.storage === "sqlite") linkSubjectsSqlite(storage, link);
    else appendJsonl(storage, { kind: "link", recorded_at: new Date().toISOString(), ...redact(link) });
    console.log(JSON.stringify({ ok: true, storage: initialized.storage, path: initialized.path, relationship: link.relationship }, null, 2));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
