#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { classifyFailure } from "./classify-run-failure.mjs";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const ledgerScript = join(repoRoot, "scripts/fabro/run-ledger.mjs");
const railwayApiUrl = "https://fabro-maestro-production.up.railway.app/api/v1";

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

function normalizeApiUrl(value) {
  const trimmed = String(value || railwayApiUrl).replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
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

function stableString(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseJson(text, source) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Could not parse ${source} as JSON: ${error.message}`);
  }
}

function eventArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result?.events)) return payload.result.events;
  if (Array.isArray(payload?.events?.nodes)) return payload.events.nodes;
  if (Array.isArray(payload?.events?.edges)) return payload.events.edges.map((edge) => edge.node || edge);
  if (payload && typeof payload === "object" && (payload.id || payload.type || payload.event_type || payload.status)) {
    return [payload];
  }
  return [];
}

function firstString(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function firstNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function normalizeStatus(value) {
  const text = firstString(value);
  if (!text) return null;
  const lowered = text.toLowerCase();
  if (["success", "succeeded", "complete", "completed", "done"].includes(lowered)) return "completed";
  if (["failure", "failed", "error", "errored"].includes(lowered)) return "failed";
  if (["cancelled", "canceled"].includes(lowered)) return "cancelled";
  return lowered;
}

function isTerminal(status) {
  return ["completed", "failed", "cancelled", "canceled", "errored"].includes(normalizeStatus(status));
}

function isFailureStatus(status) {
  return ["failed", "cancelled", "canceled", "errored"].includes(normalizeStatus(status));
}

function normalizeProjection(payload = {}) {
  const run = payload.run || payload.data || payload.result || payload;
  return {
    workflow_file: firstString(run.workflow_file, run.workflow, run.graph, run.workflowPath),
    current_status: normalizeStatus(run.status || run.state || run.current_status) || "unknown",
    current_node: firstString(run.current_node, run.currentNode, run.node_id, run.nodeId, run.stage, run.current_stage),
    next_node_id: firstString(run.next_node_id, run.nextNodeId, run.next_node, run.nextNode),
    latest_git_sha: firstString(run.git_commit_sha, run.commit_sha, run.latest_git_sha, run.head_sha),
    run_branch: firstString(run.git_branch, run.branch, run.run_branch, run.head_branch),
    sandbox_name: firstString(run.sandbox_name, run.sandbox?.name),
    sandbox_id: firstString(run.sandbox_id, run.sandbox?.id),
  };
}

function normalizeEvent(raw, index, projection, lastCursor) {
  const payload = raw.payload || raw.data || raw.details || raw;
  const cursor = firstNumber(raw.cursor, raw.sequence, raw.seq, raw.offset, raw.index, raw.order);
  const eventId = firstString(raw.event_id, raw.eventId, raw.id, raw.uuid);
  const type = firstString(raw.event_type, raw.eventType, raw.type, raw.kind, raw.name, "observed");
  const node = firstString(raw.node_id, raw.nodeId, raw.node, raw.current_node, payload.node_id, projection.current_node);
  const stage = firstString(raw.stage_id, raw.stageId, raw.stage, payload.stage_id, payload.stage);
  const status = normalizeStatus(raw.status || raw.state || raw.outcome || payload.status || payload.state) || projection.current_status;
  const summary = firstString(raw.summary, raw.message, raw.title, raw.text, payload.summary, payload.message, type);
  const eventCursor = cursor ?? (lastCursor || 0) + index + 1;
  return {
    raw,
    payload,
    cursor: eventCursor,
    event_id: eventId || `${type}-${eventCursor}`,
    type,
    status,
    node,
    stage,
    created_at: firstString(raw.created_at, raw.createdAt, raw.ts, raw.timestamp, payload.created_at, new Date().toISOString()),
    summary,
  };
}

async function fetchJson(url, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body: text ? parseJson(text, url) : null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function readHttp(runId, afterCursor) {
  const apiUrl = normalizeApiUrl(argValue("--server", process.env.FABRO_SERVER || railwayApiUrl));
  const token = process.env.FABRO_DEV_TOKEN || "";
  const encoded = encodeURIComponent(runId);
  const projectionCandidates = [
    `${apiUrl}/runs/${encoded}`,
    `${apiUrl}/runs/${encoded}/state`,
  ];
  const eventCandidates = [
    `${apiUrl}/runs/${encoded}/events?after=${encodeURIComponent(afterCursor || 0)}&limit=200`,
    `${apiUrl}/runs/${encoded}/events?after=${encodeURIComponent(afterCursor || 0)}`,
    `${apiUrl}/runs/${encoded}/events`,
  ];

  let projection = {};
  for (const url of projectionCandidates) {
    try {
      const result = await fetchJson(url, token);
      if (result.ok) {
        projection = result.body || {};
        break;
      }
    } catch {
      // Try the next known route shape.
    }
  }

  let eventsPayload = [];
  let lastError = null;
  for (const url of eventCandidates) {
    try {
      const result = await fetchJson(url, token);
      if (result.ok) {
        eventsPayload = eventArray(result.body);
        break;
      }
      lastError = `HTTP ${result.status} from ${url}`;
    } catch (error) {
      lastError = error.message;
    }
  }
  if (eventsPayload.length === 0 && lastError && !Object.keys(projection).length) {
    throw new Error(`Could not read Fabro run or events: ${lastError}`);
  }
  return { projection, events: eventsPayload };
}

function readCommand(runId, afterCursor) {
  const template = required("--event-command");
  const command = template
    .replaceAll("{run_id}", runId)
    .replaceAll("{after}", String(afterCursor || 0));
  const result = spawnSync("sh", ["-lc", command], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `event command failed with status ${result.status}`);
  }
  const payload = parseJson(result.stdout, "--event-command stdout");
  return {
    projection: payload.projection || payload.run || {},
    events: eventArray(payload),
  };
}

function readFileSource() {
  const path = required("--events-file");
  const payload = parseJson(readFileSync(path, "utf8"), path);
  return {
    projection: payload.projection || payload.run || {},
    events: eventArray(payload),
  };
}

function ledgerArgsBase() {
  const args = [];
  for (const name of ["--home", "--profile", "--db", "--jsonl", "--schema"]) {
    const value = argValue(name);
    if (value) args.push(name, value);
  }
  if (hasFlag("--force-jsonl")) args.push("--force-jsonl");
  return args;
}

function ledgerSummary(runId) {
  const result = spawnSync(process.execPath, [
    ledgerScript,
    "summarize-run",
    ...ledgerArgsBase(),
    "--run-id",
    runId,
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) return null;
  return JSON.parse(result.stdout).summary || null;
}

function appendLedger(runId, projection, event, classification, nextAction, eventKind) {
  const args = [
    ledgerScript,
    "append-event",
    ...ledgerArgsBase(),
    "--run-id",
    runId,
    "--event-kind",
    eventKind,
    "--current-status",
    event.status || projection.current_status || "unknown",
    "--cursor",
    String(event.cursor),
    "--event-id",
    event.event_id,
    "--next-action",
    nextAction,
    "--payload-json",
    JSON.stringify(redact(event.raw)),
  ];

  const optional = {
    "--workflow-file": projection.workflow_file,
    "--current-node": event.node || projection.current_node,
    "--next-node-id": projection.next_node_id,
    "--failure-class": classification?.failure_class,
    "--latest-git-sha": projection.latest_git_sha,
    "--run-branch": projection.run_branch,
    "--sandbox-name": projection.sandbox_name,
    "--sandbox-id": projection.sandbox_id,
    "--summary": redact(event.summary),
  };
  for (const [name, value] of Object.entries(optional)) {
    if (value !== null && value !== undefined && String(value).trim()) args.push(name, String(value));
  }
  if (classification?.signatures?.length) {
    args.push("--known-failures-json", JSON.stringify(classification.signatures));
  }

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "run-ledger append failed");
  }
}

function nextActionFor(status, classification) {
  const normalized = normalizeStatus(status);
  if (normalized === "completed") return "write postmortem, verify artifacts, and close run";
  if (normalized === "submitted") return "start run via Fabro MCP action=start";
  if (normalized === "queued" || normalized === "running" || normalized === "unknown") return "continue polling Fabro events";
  if (classification?.failure_class === "transient_infra") return "check Railway/Fabro/server health, then retry or fork from latest pushed branch";
  if (classification?.failure_class === "control_plane") return "preserve artifacts, compact context, and restart from latest pushed commit";
  if (classification?.failure_class === "quality_gate") return "inspect failing gate artifact, patch smallest responsible surface, rerun gate";
  if (classification?.failure_class === "approval_blocked") return "request explicit approval with evidence";
  return "inspect Fabro projection, git branch, sandbox state, and CI artifacts";
}

function classifyEvent(event, projection) {
  const text = `${event.type}\n${event.summary || ""}\n${stableString(event.raw)}\n${stableString(projection)}`;
  if (isFailureStatus(event.status) || /fail|error|exception|rejected|missing|dns|metadata|prompt file/i.test(text)) {
    return classifyFailure(text);
  }
  return null;
}

function usage() {
  console.log(`Usage:
  node scripts/fabro/babysit-run.mjs --run-id <id> [--server <api-url>] [--once]
  node scripts/fabro/babysit-run.mjs --run-id <id> --events-file events.json --once
  node scripts/fabro/babysit-run.mjs --run-id <id> --event-command 'fabro ... {run_id} {after}' --once

Writes to the Hermes Fabro run ledger through scripts/fabro/run-ledger.mjs.
Use --force-jsonl for environments without sqlite3.
`);
}

if (hasFlag("--help") || hasFlag("-h")) {
  usage();
  process.exit(0);
}

const runId = required("--run-id");
const once = hasFlag("--once");
const failOnTerminalFailure = !hasFlag("--no-fail-on-terminal-failure");
const intervalMs = Number(argValue("--interval-ms", "30000"));
const maxPolls = Number(argValue("--max-polls", once ? "1" : "2880"));
const source = argValue("--events-file") ? "file" : argValue("--event-command") ? "command" : "http";
let lastCursor = Number(argValue("--after", ledgerSummary(runId)?.last_event_cursor || "0"));
let finalSummary = null;

for (let poll = 0; poll < maxPolls; poll += 1) {
  const input = source === "file"
    ? readFileSource()
    : source === "command"
      ? readCommand(runId, lastCursor)
      : await readHttp(runId, lastCursor);
  const projection = normalizeProjection(input.projection);
  const events = input.events
    .map((event, index) => normalizeEvent(event, index, projection, lastCursor))
    .filter((event) => event.cursor > lastCursor);
  if (events.length === 0) {
    const synthetic = normalizeEvent({
      event_type: "observed",
      status: projection.current_status,
      summary: `poll ${poll + 1}: no new Fabro events`,
    }, 0, projection, lastCursor);
    const nextAction = nextActionFor(synthetic.status, null);
    appendLedger(runId, projection, synthetic, null, nextAction, "observed");
    finalSummary = { event: synthetic, projection, classification: null, next_action: nextAction };
  }

  for (const event of events) {
    const classification = classifyEvent(event, projection);
    const nextAction = nextActionFor(event.status, classification);
    const eventKind = classification
      ? "failure_classified"
      : isTerminal(event.status)
        ? event.status === "completed" ? "completed" : "failed"
        : "observed";
    appendLedger(runId, projection, event, classification, nextAction, eventKind);
    lastCursor = Math.max(lastCursor, event.cursor || lastCursor);
    finalSummary = { event, projection, classification, next_action: nextAction };
  }

  if (finalSummary && isTerminal(finalSummary.event.status)) break;
  if (once) break;
  await new Promise((resolveTimer) => setTimeout(resolveTimer, intervalMs));
}

const summary = {
  ok: Boolean(finalSummary),
  run_id: runId,
  source,
  last_event_cursor: lastCursor,
  current_status: finalSummary?.event?.status || finalSummary?.projection?.current_status || "unknown",
  current_node: finalSummary?.event?.node || finalSummary?.projection?.current_node || null,
  failure_class: finalSummary?.classification?.failure_class || null,
  signatures: finalSummary?.classification?.signatures || [],
  next_action: finalSummary?.next_action || "inspect",
};
console.log(JSON.stringify(redact(summary), null, 2));
if (failOnTerminalFailure && isFailureStatus(summary.current_status)) process.exit(2);
