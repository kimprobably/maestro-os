#!/usr/bin/env bun

import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { resolveMx } from "node:dns/promises";

type Persona = {
  display: string;
  iconEmoji: string;
};

type JsonObject = Record<string, unknown>;

class CliError extends Error {
  exitCode: number;
  code: string;
  retryable: boolean;

  constructor(message: string, options: { exitCode?: number; code?: string; retryable?: boolean } = {}) {
    super(message);
    this.exitCode = options.exitCode ?? 1;
    this.code = options.code ?? "validation_failed";
    this.retryable = options.retryable ?? false;
  }
}

const REPO_ROOT = resolve(import.meta.dir, "../..");
const LOCAL_STATE_DIR = join(REPO_ROOT, ".maestro");
const KNOWLEDGE_DIR = join(REPO_ROOT, "knowledge");
const GRAPHVIZ_DOT = "/opt/homebrew/opt/graphviz/bin/dot";

const PERSONAS: Record<string, Persona> = {
  maestro: { display: "Maestro", iconEmoji: ":musical_score:" },
  quill: { display: "Quill", iconEmoji: ":pen:" },
  scout: { display: "Scout", iconEmoji: ":mag:" },
  smith: { display: "Smith", iconEmoji: ":hammer_and_wrench:" },
  "test-bot": { display: "Test Bot", iconEmoji: ":test_tube:" }
};

function usage(exitCode = 0): never {
  const out = exitCode === 0 ? console.log : console.error;
  out(`Usage:
  maestro slack post --persona <name> --text <text> [--channel <id>] [--thread <ts>]
  maestro slack ack-gate <run-id>/<gate-id> --decision approve|reject|edit [--payload <json>]
  maestro memory get <namespace>
  maestro memory append <namespace> < event.json
  maestro memory load-brief <namespace> [--limit <n>]
  maestro db query --read "SELECT ..."
  maestro knowledge get <key>[,<key>] [--format json|text]
  maestro linear smoke
  maestro verify dot-syntax <path>
  maestro verify workflow-quality <path>
  maestro verify spec-quality <path>
  maestro verify text-gate <path> --pass <regex> [--fail <regex>]
  maestro verify email-deliverable <email-or-json-path> [--skip-mx]
  maestro verify outreach-voice-match <draft-path> [--threshold <0-1>]
  maestro verify outreach-banned-phrases <draft-path> [--mode all|any] [--output <path>]
  maestro verify outreach-length <draft-path> [--max-words <n>] [--max-lines <n>] [--mode all|any]
  maestro verify dedup-lead <email-or-json-path> [--days <n>]
  maestro validate required-fields <json-path> <field[,field]>
  maestro workflow register <path>
  maestro doctor quality-stack

Environment:
  FABRO_SLACK_BOT_TOKEN or SLACK_BOT_TOKEN
  FABRO_SLACK_CHANNEL_ID or SLACK_CHANNEL_ID
  FABRO_SERVER for gate acknowledgements
  DATABASE_URL for db query`);
  process.exit(exitCode);
}

function loadDotEnv() {
  const envPath = join(REPO_ROOT, ".env.local");
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    const value = line.slice(equalIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = stripQuotes(value);
    }
  }
}

function stripQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new CliError(`Missing value for ${name}`);
  }
  return value;
}

function hasFlag(args: string[], name: string) {
  return args.includes(name);
}

function positional(args: string[]) {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("--")) {
      index += 1;
      continue;
    }
    values.push(arg);
  }
  return values;
}

function output(payload: JsonObject, args: string[] = []) {
  if (readFlag(args, "--format") === "text") {
    console.log(payloadToText(payload));
    return;
  }
  console.log(JSON.stringify(payload, null, 2));
}

function outputAndExit(payload: JsonObject, exitCode: number, args: string[] = []): never {
  output(payload, args);
  process.exit(exitCode);
}

function payloadToText(payload: JsonObject) {
  if (typeof payload.text === "string") return payload.text;
  return JSON.stringify(payload, null, 2);
}

function ok(data: JsonObject = {}, extras: JsonObject = {}) {
  return { ok: true, data, warnings: [], next: [], ...extras };
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function safeNamespace(namespace: string) {
  return Buffer.from(namespace).toString("base64url");
}

function memoryPaths(namespace: string) {
  const safe = safeNamespace(namespace);
  return {
    events: join(LOCAL_STATE_DIR, "memory", "events", `${safe}.jsonl`),
    snapshot: join(LOCAL_STATE_DIR, "memory", "snapshots", `${safe}.md`)
  };
}

function readJsonLines(path: string, limit?: number) {
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const selected = typeof limit === "number" ? lines.slice(-limit) : lines;
  return selected.map((line) => JSON.parse(line) as JsonObject);
}

async function slackPost(args: string[]) {
  const personaName = readFlag(args, "--persona");
  const text = readFlag(args, "--text");
  const channel =
    readFlag(args, "--channel") ??
    process.env.FABRO_SLACK_CHANNEL_ID ??
    process.env.SLACK_CHANNEL_ID;
  const thread = readFlag(args, "--thread");
  const token = process.env.FABRO_SLACK_BOT_TOKEN ?? process.env.SLACK_BOT_TOKEN;

  if (!personaName) throw new CliError("Missing --persona");
  if (!text) throw new CliError("Missing --text");
  if (!channel) throw new CliError("Missing --channel or FABRO_SLACK_CHANNEL_ID");
  if (!token) {
    throw new CliError("Missing FABRO_SLACK_BOT_TOKEN", {
      exitCode: 2,
      code: "missing_secret",
      retryable: false
    });
  }

  const persona = PERSONAS[personaName];
  if (!persona) throw new CliError(`Unknown persona: ${personaName}`);

  const body: JsonObject = {
    channel,
    text,
    username: persona.display,
    icon_emoji: persona.iconEmoji
  };
  if (thread && thread.trim().length > 0) body.thread_ts = thread;

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    error?: string;
    channel?: string;
    ts?: string;
  };

  if (!response.ok || payload.ok !== true) {
    throw new CliError(`Slack post failed: ${payload.error ?? response.statusText}`, {
      exitCode: 2,
      code: "slack_post_failed",
      retryable: true
    });
  }

  output(ok({ channel: payload.channel, ts: payload.ts }, { channel: payload.channel, ts: payload.ts }), args);
}

async function slackAckGate(args: string[]) {
  const [gateRef] = positional(args);
  const decision = readFlag(args, "--decision");
  const payloadFlag = readFlag(args, "--payload");
  const server = readFlag(args, "--server") ?? process.env.FABRO_SERVER ?? "http://127.0.0.1:32276";
  const runId = readFlag(args, "--run") ?? parseGateRef(gateRef).runId;
  const gateId = parseGateRef(gateRef).gateId;

  if (!gateRef) throw new CliError("Missing gate id");
  if (!runId) throw new CliError("Missing run id; use <run-id>/<gate-id> or --run <run-id>");
  if (!gateId) throw new CliError("Missing gate id");
  if (!decision || !["approve", "reject", "edit"].includes(decision)) {
    throw new CliError("Missing or invalid --decision approve|reject|edit");
  }

  const payload = payloadFlag ? parseJsonObject(payloadFlag, "--payload") : {};
  const url = `${server.replace(/\/$/, "")}/api/v1/runs/${encodeURIComponent(runId)}/gates/${encodeURIComponent(gateId)}/decision`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: requestHeaders(),
      body: JSON.stringify({ decision, payload })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(`Gate acknowledgement failed: ${message}`, {
      exitCode: 2,
      code: "gate_ack_failed",
      retryable: true
    });
  }

  const text = await response.text();
  const parsed = text ? tryParseJson(text) : {};
  if (!response.ok) {
    throw new CliError(`Gate acknowledgement failed: ${response.status} ${text}`, {
      exitCode: 2,
      code: "gate_ack_failed",
      retryable: true
    });
  }

  output(ok({ run_id: runId, gate_id: gateId, decision, response: parsed }), args);
}

function parseGateRef(gateRef?: string) {
  if (!gateRef) return { runId: undefined, gateId: undefined };
  const separator = gateRef.includes("/") ? "/" : gateRef.includes(":") ? ":" : undefined;
  if (!separator) return { runId: undefined, gateId: gateRef };
  const [runId, gateId] = gateRef.split(separator, 2);
  return { runId, gateId };
}

function requestHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8"
  };
  if (process.env.FABRO_DEV_TOKEN) {
    headers.Authorization = `Bearer ${process.env.FABRO_DEV_TOKEN}`;
  }
  return headers;
}

async function memoryGet(args: string[]) {
  const [namespace] = positional(args);
  if (!namespace) throw new CliError("Missing namespace");

  const paths = memoryPaths(namespace);
  const snapshot = existsSync(paths.snapshot) ? readFileSync(paths.snapshot, "utf8") : "";
  const events = readJsonLines(paths.events);

  output(ok({ namespace, snapshot, events }), args);
}

async function memoryAppend(args: string[]) {
  const [namespace] = positional(args);
  if (!namespace) throw new CliError("Missing namespace");

  const stdin = (await Bun.stdin.text()).trim();
  if (!stdin) throw new CliError("Expected event JSON on stdin");

  const event = parseJsonObject(stdin, "stdin");
  const entry = {
    ts: new Date().toISOString(),
    namespace,
    kind: typeof event.kind === "string" ? event.kind : "event",
    payload: event.payload ?? event
  };

  const paths = memoryPaths(namespace);
  ensureDir(join(LOCAL_STATE_DIR, "memory", "events"));
  appendFileSync(paths.events, `${JSON.stringify(entry)}\n`);

  output(ok({ namespace, appended: entry }), args);
}

async function memoryLoadBrief(args: string[]) {
  const [namespace] = positional(args);
  if (!namespace) throw new CliError("Missing namespace");

  const limit = Number(readFlag(args, "--limit") ?? "20");
  if (!Number.isInteger(limit) || limit < 1) throw new CliError("--limit must be a positive integer");

  const paths = memoryPaths(namespace);
  const snapshot = existsSync(paths.snapshot) ? readFileSync(paths.snapshot, "utf8") : "";
  const recent_events = readJsonLines(paths.events, limit);

  output(ok({ namespace, snapshot, recent_events }), args);
}

async function dbQuery(args: string[]) {
  const sql = readFlag(args, "--read");
  if (!sql) throw new CliError("Missing --read SQL");
  assertReadOnlySql(sql);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new CliError("Missing DATABASE_URL", {
      exitCode: 2,
      code: "missing_database_url",
      retryable: false
    });
  }

  const result = spawnSync("psql", [databaseUrl, "-X", "--csv", "-c", sql], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    throw new CliError(`psql failed to start: ${result.error.message}`, {
      exitCode: 2,
      code: "psql_unavailable",
      retryable: false
    });
  }
  if (result.status !== 0) {
    throw new CliError(`Database query failed: ${result.stderr.trim()}`, {
      exitCode: 2,
      code: "db_query_failed",
      retryable: true
    });
  }

  output(ok({ sql, csv: result.stdout.trim() }), args);
}

function assertReadOnlySql(sql: string) {
  const normalized = sql.trim().replace(/\s+/g, " ");
  if (!/^(select|with|explain)\b/i.test(normalized)) {
    throw new CliError("Only SELECT/WITH/EXPLAIN queries are allowed");
  }
  const forbidden = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|merge|copy|call|do|execute)\b/i;
  if (forbidden.test(normalized)) {
    throw new CliError("Read query contains a forbidden write/control keyword");
  }
}

async function knowledgeGet(args: string[]) {
  const keys = positional(args).flatMap((value) => value.split(",")).filter(Boolean);
  if (keys.length === 0) throw new CliError("Missing knowledge key");

  const docs = keys.map((key) => {
    const path = resolveKnowledgePath(key);
    return {
      key,
      path: relative(REPO_ROOT, path),
      content: readFileSync(path, "utf8")
    };
  });

  if (readFlag(args, "--format") === "text") {
    console.log(
      docs
        .map((doc) => `# ${doc.key}\n\n${doc.content.trim()}`)
        .join("\n\n---\n\n")
    );
    return;
  }

  output(ok({ docs }), args);
}

function resolveKnowledgePath(key: string) {
  const candidates = extname(key)
    ? [join(KNOWLEDGE_DIR, key)]
    : [join(KNOWLEDGE_DIR, `${key}.md`), join(KNOWLEDGE_DIR, `${key}.yaml`), join(KNOWLEDGE_DIR, key)];
  const found = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
  if (!found) throw new CliError(`Unknown knowledge key: ${key}`);
  return found;
}

async function verifyDotSyntax(args: string[]) {
  const [pathArg] = positional(args);
  if (!pathArg) throw new CliError("Missing path");

  const result = runWorkflowValidation(pathArg);
  output(ok(result), args);
}

async function verifySpecQuality(args: string[]) {
  const [pathArg] = positional(args);
  if (!pathArg) throw new CliError("Missing path");

  const path = resolve(REPO_ROOT, pathArg);
  if (!existsSync(path)) throw new CliError(`File not found: ${pathArg}`);

  const content = readFileSync(path, "utf8");
  const required = [
    ["purpose", /^#{1,4}\s+(purpose|goal|overview)\b/im],
    ["context", /^#{1,4}\s+context\b/im],
    ["non_goals", /^#{1,4}\s+non-?goals?\b/im],
    ["inputs", /^#{1,4}\s+inputs?\b/im],
    ["outputs", /^#{1,4}\s+outputs?\b/im],
    ["requirements", /^#{1,4}\s+(requirements|functional requirements|user stories)\b/im],
    ["acceptance_criteria", /^#{1,4}\s+(acceptance criteria|definition of done)\b/im],
    ["risks", /^#{1,4}\s+(risks|edge cases|failure modes)\b/im],
    ["verification_plan", /^#{1,4}\s+[^\n]*\b(verification|test plan|quality gates)\b/im],
    ["review_plan", /^#{1,4}\s+[^\n]*\b(review|reviewer|reviewers)\b/im]
  ] as const;
  const missing = required
    .filter(([, pattern]) => !pattern.test(content))
    .map(([name]) => name);

  const warnings: string[] = [];
  const irreversible = /\b(send|merge|deploy|delete|migration|migrate|billing|charge|enrich|phone)\b/i.test(content);
  if (irreversible && !/\bSTOP\b/i.test(content)) {
    warnings.push("Spec mentions irreversible work but does not name a STOP gate.");
  }
  if (!/\b(Spec Kitty|spec\.json|work package)\b/i.test(content)) {
    warnings.push("Spec does not identify a Spec Kitty work package or spec.json state file.");
  }
  if (!/\b(Qlty|quality gate|lint|typecheck|test|build)\b/i.test(content)) {
    warnings.push("Spec does not name deterministic quality gates.");
  }
  if (!/\b(ADR|architecture decision)\b/i.test(content)) {
    warnings.push("Spec does not state whether an ADR is required.");
  }

  const score = Math.max(0, 1 - missing.length * 0.08 - warnings.length * 0.03);
  const result = {
    path: relative(REPO_ROOT, path),
    passed: missing.length === 0 && score >= 0.85,
    score: Number(score.toFixed(2)),
    missing,
    warnings
  };

  if (!result.passed) {
    throw new CliError(
      `Spec quality validation failed for ${pathArg}: missing=${missing.join(",") || "none"} warnings=${warnings.length}`,
      { exitCode: 1, code: "spec_quality_failed", retryable: false }
    );
  }

  output(ok(result), args);
}

async function verifyWorkflowQuality(args: string[]) {
  const [pathArg] = positional(args);
  if (!pathArg) throw new CliError("Missing path");

  const validation = runWorkflowValidation(pathArg);
  const path = resolve(REPO_ROOT, pathArg);
  const content = readFileSync(path, "utf8");
  const issues: Array<{ severity: "blocker" | "major" | "minor"; code: string; message: string }> = [];

  const graphBlock = content.match(/\bgraph\s*\[([\s\S]*?)^\s*\]/m)?.[1] ?? "";
  const hasGraphAttr = (name: string) => new RegExp(`\\b${name}\\s*=`, "i").test(graphBlock);
  for (const attr of ["goal", "model_stylesheet", "persona", "inputs", "outputs"]) {
    if (!hasGraphAttr(attr)) {
      issues.push({
        severity: attr === "goal" || attr === "model_stylesheet" ? "blocker" : "major",
        code: `missing_graph_${attr}`,
        message: `Graph metadata is missing ${attr}=...`
      });
    }
  }

  const modelStylesheet = graphBlock.match(/\bmodel_stylesheet\s*=\s*"([\s\S]*?)"/i)?.[1] ?? "";
  for (const className of ["coding", "review"]) {
    if (!new RegExp(`\\.${className}\\b`, "i").test(modelStylesheet)) {
      issues.push({
        severity: "major",
        code: `missing_model_class_${className}`,
        message: `model_stylesheet does not define .${className}`
      });
    }
  }

  if (/\bslack\s+post\b/i.test(content) && !/\bgate_type\s*=\s*"?STOP"?/i.test(content)) {
    issues.push({
      severity: "blocker",
      code: "missing_stop_gate",
      message: "Slack post workflow has an irreversible action without an explicit STOP gate."
    });
  }

  if (/\bemit_summary\b/i.test(content) && !/\bvalidate_summary\b/i.test(content)) {
    issues.push({
      severity: "major",
      code: "missing_summary_validator",
      message: "Workflow emits a summary without a validate_summary gate."
    });
  }

  if (/\$\{CONTEXT:/i.test(content)) {
    issues.push({
      severity: "blocker",
      code: "unsupported_context_template",
      message: "Workflow uses ${CONTEXT:...} interpolation, which is not supported by Fabro templates."
    });
  }

  if (/\$\{[^}]+\?[^}]*\}/.test(content) || /\$\{[^}]+\|\|[^}]*\}/.test(content)) {
    issues.push({
      severity: "blocker",
      code: "unsupported_js_template",
      message: "Workflow uses JavaScript-style template expressions inside ${...}."
    });
  }

  if (/\$\{[A-Za-z_][A-Za-z0-9_]*\.[^}]+\}/.test(content)) {
    issues.push({
      severity: "blocker",
      code: "unsupported_dotted_template",
      message: "Workflow uses dotted ${stage.field} interpolation; pass data through files or documented context keys instead."
    });
  }

  if (/\$\{[a-z][A-Za-z0-9_]*\}/.test(content)) {
    issues.push({
      severity: "blocker",
      code: "unsupported_lowercase_template",
      message: "Workflow uses lowercase ${name} interpolation; Fabro does not define these as runtime variables."
    });
  }

  const unsupportedAttrs = [
    "stage_type",
    "validator_type",
    "checks",
    "on_fail",
    "output_key",
    "capture_stdout",
    "output_file",
    "input_files"
  ];
  for (const attr of unsupportedAttrs) {
    if (new RegExp(`\\b${attr}\\s*=`, "i").test(content)) {
      issues.push({
        severity: "blocker",
        code: `unsupported_attr_${attr}`,
        message: `Workflow uses unsupported Fabro attribute ${attr}=...`
      });
    }
  }

  if (/\bcommand\s*=/i.test(content) && !/\bscript\s*=/i.test(content)) {
    issues.push({
      severity: "blocker",
      code: "command_without_script",
      message: "Fabro command stages use script=..., not command=..."
    });
  }

  const referencedFiles = Array.from(content.matchAll(/(?:cat|jq\s+[^;]*?)\s+((?:\.maestro|\.workflow|workflows|specs|prompts|apps)\/[A-Za-z0-9_./-]+)/g))
    .map((match) => match[1])
    .filter((file) => !file.includes("*"));
  for (const file of new Set(referencedFiles)) {
    const writesFile = new RegExp(`(?:>|tee\\s+)\\s*["']?${escapeRegExp(file)}["']?`, "i").test(content);
    const existsNow = existsSync(resolve(REPO_ROOT, file));
    if (!writesFile && !existsNow) {
      issues.push({
        severity: "major",
        code: "unwritten_runtime_file",
        message: `Workflow reads ${file} but no earlier command writes it and it is not a checked-in file.`
      });
    }
  }

  if (/\bjson_valid\b/i.test(content)) {
    issues.push({
      severity: "major",
      code: "unknown_json_valid_validator",
      message: "Workflow references json_valid, which is not in the Maestro validator library."
    });
  }

  const edgeGroups = new Map<string, Array<{ target: string; attrs: string }>>();
  for (const match of content.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*->\s*([A-Za-z_][A-Za-z0-9_]*)(?:\s*\[([^\]]*)\])?\s*$/gm)) {
    const [, source, target, attrs = ""] = match;
    const edges = edgeGroups.get(source) ?? [];
    edges.push({ target, attrs });
    edgeGroups.set(source, edges);
  }

  for (const [source, edges] of edgeGroups) {
    const hasFailureFallback = edges.some((edge) =>
      /\blabel\s*=\s*"?(Failed|Fix|Retry|Revise)"?/i.test(edge.attrs) ||
      /\bloop_restart\s*=\s*true\b/i.test(edge.attrs)
    );
    if (!hasFailureFallback) continue;

    for (const edge of edges) {
      const isFailureFallback =
        /\blabel\s*=\s*"?(Failed|Fix|Retry|Revise)"?/i.test(edge.attrs) ||
        /\bloop_restart\s*=\s*true\b/i.test(edge.attrs);
      if (isFailureFallback) continue;
      if (/\bcondition\s*=\s*"outcome=succeeded"/i.test(edge.attrs)) continue;

      issues.push({
        severity: "blocker",
        code: "ambiguous_failure_routing",
        message: `Node ${source} has failure/retry fallback edges, but edge ${source} -> ${edge.target} is not guarded with condition="outcome=succeeded".`
      });
    }
  }

  if (/\bprompt\s*=/i.test(content) && !/\b(validate|verify|approval|approve|gate)\b/i.test(content)) {
    issues.push({
      severity: "major",
      code: "missing_llm_output_gate",
      message: "Workflow has prompt stages but no visible validation or approval gate."
    });
  }

  if (/\bmemory\s+append\b/i.test(content) && !/\b(memory_curator|memory_summary|curator)\b/i.test(content)) {
    issues.push({
      severity: "blocker",
      code: "uncontrolled_memory_write",
      message: "Workflow writes long-term memory outside a named curator or summary stage."
    });
  }

  if (/[^\x09\x0A\x0D\x20-\x7E]/.test(content)) {
    issues.push({
      severity: "minor",
      code: "non_ascii",
      message: "Workflow contains non-ASCII characters; keep generated workflow DOT ASCII-only."
    });
  }

  for (const match of content.matchAll(/\bprompt\s*=\s*"@([^"]+)"/gi)) {
    const promptPath = resolve(dirname(path), match[1]);
    if (!existsSync(promptPath)) {
      issues.push({
        severity: "major",
        code: "missing_prompt_file",
        message: `Prompt file does not exist: ${relative(REPO_ROOT, promptPath)}`
      });
    }
  }

  const penalty = issues.reduce((total, issue) => {
    if (issue.severity === "blocker") return total + 0.25;
    if (issue.severity === "major") return total + 0.1;
    return total + 0.03;
  }, 0);
  const score = Math.max(0, 1 - penalty);
  const passed = issues.every((issue) => issue.severity !== "blocker") && score >= 0.85;
  const result = {
    path: relative(REPO_ROOT, path),
    passed,
    score: Number(score.toFixed(2)),
    issues,
    validation
  };

  if (!passed) {
    throw new CliError(
      `Workflow quality validation failed for ${pathArg}: score=${result.score} issues=${issues.map((issue) => issue.code).join(",") || "none"}`,
      { exitCode: 1, code: "workflow_quality_failed", retryable: false }
    );
  }

  output(ok(result), args);
}

async function verifyTextGate(args: string[]) {
  const [pathArg] = positional(args);
  if (!pathArg) throw new CliError("Missing path");

  const passPattern = readFlag(args, "--pass");
  const failPattern = readFlag(args, "--fail");
  if (!passPattern) throw new CliError("Missing --pass regex");

  const path = resolve(REPO_ROOT, pathArg);
  if (!existsSync(path)) throw new CliError(`File not found: ${pathArg}`);

  const content = readFileSync(path, "utf8");
  const passRegex = new RegExp(passPattern, "im");
  const failRegex = failPattern ? new RegExp(failPattern, "im") : undefined;
  const failed = Boolean(failRegex?.test(content));
  const passed = !failed && passRegex.test(content);
  const result = {
    path: relative(REPO_ROOT, path),
    passed,
    pass_pattern: passPattern,
    fail_pattern: failPattern ?? null
  };

  if (!passed) {
    throw new CliError(`Text gate failed for ${pathArg}`, {
      exitCode: 1,
      code: "text_gate_failed",
      retryable: false
    });
  }

  output(ok(result), args);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_OUTREACH_BANNED_PHRASES = ["leverage", "synergy", "I noticed", "AI-powered", "circle back"];

type DraftEntry = {
  id: string;
  text: string;
};

function readPositiveIntegerFlag(args: string[], name: string, fallback: number) {
  const raw = readFlag(args, name);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new CliError(`${name} must be a positive integer`);
  }
  return value;
}

function readNumberFlag(args: string[], name: string, fallback: number) {
  const raw = readFlag(args, name);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value)) throw new CliError(`${name} must be a number`);
  return value;
}

function readValidationMode(args: string[]) {
  const mode = readFlag(args, "--mode") ?? "all";
  if (mode !== "all" && mode !== "any") {
    throw new CliError("--mode must be all or any");
  }
  return mode;
}

function resolveInputPath(pathArg: string) {
  if (existsSync(pathArg)) return resolve(pathArg);

  const cwdPath = resolve(process.cwd(), pathArg);
  if (existsSync(cwdPath)) return cwdPath;

  const repoPath = resolve(REPO_ROOT, pathArg);
  if (existsSync(repoPath)) return repoPath;

  return repoPath;
}

function maybeReadInputFile(value: string) {
  const path = resolveInputPath(value);
  if (!existsSync(path)) return undefined;
  return { path, content: readFileSync(path, "utf8") };
}

function extractEmail(input: string) {
  const file = maybeReadInputFile(input);
  if (!file) return input.trim();

  const parsed = tryParseJson(file.content);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const object = parsed as JsonObject;
    const lead = object.lead as JsonObject | undefined;
    for (const candidate of [object.email, lead?.email]) {
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
  }

  return file.content.trim();
}

function validateEmailFormat(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new CliError(`Invalid email format: ${email}`, {
      exitCode: 1,
      code: "invalid_email_format",
      retryable: false
    });
  }
  return normalized;
}

function emailDomain(email: string) {
  return email.split("@").at(-1) ?? "";
}

function isReservedFixtureDomain(domain: string) {
  return /\.(example|invalid|test|localhost)$/i.test(domain) || domain === "localhost";
}

async function verifyEmailDeliverable(args: string[]) {
  const [input] = positional(args);
  if (!input) throw new CliError("Missing email or JSON path");

  const email = validateEmailFormat(extractEmail(input));
  const domain = emailDomain(email);
  const skipMx = hasFlag(args, "--skip-mx");
  const allowReserved = hasFlag(args, "--allow-reserved-domains");

  if (skipMx || (allowReserved && isReservedFixtureDomain(domain))) {
    output(
      ok({
        email,
        domain,
        deliverable: true,
        checked_mx: false,
        reason: skipMx ? "mx_skipped" : "reserved_domain_allowed"
      }),
      args
    );
    return;
  }

  let records: Awaited<ReturnType<typeof resolveMx>>;
  try {
    records = await resolveMx(domain);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(`Email not deliverable: no MX records for ${domain} (${message})`, {
      exitCode: 1,
      code: "email_not_deliverable",
      retryable: true
    });
  }

  if (records.length === 0) {
    throw new CliError(`Email not deliverable: no MX records for ${domain}`, {
      exitCode: 1,
      code: "email_not_deliverable",
      retryable: true
    });
  }

  output(
    ok({
      email,
      domain,
      deliverable: true,
      checked_mx: true,
      reason: "mx_found",
      mx_records: records.map((record) => ({ exchange: record.exchange, priority: record.priority }))
    }),
    args
  );
}

function extractDraftEntries(input: string): DraftEntry[] {
  const file = maybeReadInputFile(input);
  const source = file?.content ?? input;
  const parsed = tryParseJson(source);

  if (!parsed) {
    return [{ id: file ? basename(file.path) : "inline", text: source.trim() }];
  }

  const fromObject = (object: JsonObject, fallbackId: string): DraftEntry | undefined => {
    const textCandidate =
      object.body ??
      object.text ??
      object.copy ??
      object.email_body ??
      object.draft ??
      ((object.chosen_variant as JsonObject | undefined)?.body);
    if (typeof textCandidate !== "string") return undefined;
    return {
      id: typeof object.id === "string" ? object.id : fallbackId,
      text: textCandidate
    };
  };

  if (Array.isArray(parsed)) {
    return parsed
      .map((item, index) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? fromObject(item as JsonObject, String(index + 1))
          : undefined
      )
      .filter((entry): entry is DraftEntry => Boolean(entry));
  }

  if (typeof parsed === "object") {
    const object = parsed as JsonObject;
    const variants = object.variants;
    if (Array.isArray(variants)) {
      return variants
        .map((item, index) =>
          item && typeof item === "object" && !Array.isArray(item)
            ? fromObject(item as JsonObject, String(index + 1))
            : undefined
        )
        .filter((entry): entry is DraftEntry => Boolean(entry));
    }

    const single = fromObject(object, "draft");
    if (single) return [single];
  }

  throw new CliError("Could not extract draft text from input", {
    exitCode: 1,
    code: "draft_text_missing",
    retryable: false
  });
}

function writeOptionalJson(args: string[], payload: JsonObject) {
  const outputPath = readFlag(args, "--output");
  if (!outputPath) return;
  const path = resolveInputPath(outputPath);
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function modePassed(mode: "all" | "any", entries: Array<{ passed: boolean }>) {
  if (entries.length === 0) return false;
  return mode === "all" ? entries.every((entry) => entry.passed) : entries.some((entry) => entry.passed);
}

async function verifyOutreachBannedPhrases(args: string[]) {
  const [input] = positional(args);
  if (!input) throw new CliError("Missing draft path");

  const mode = readValidationMode(args);
  const phrases = (readFlag(args, "--phrases") ?? DEFAULT_OUTREACH_BANNED_PHRASES.join(","))
    .split(",")
    .map((phrase) => phrase.trim())
    .filter(Boolean);
  const entries = extractDraftEntries(input).map((entry) => {
    const normalized = entry.text.toLowerCase();
    const matches = phrases.filter((phrase) => normalized.includes(phrase.toLowerCase()));
    return {
      id: entry.id,
      passed: matches.length === 0,
      matches
    };
  });
  const passed = modePassed(mode, entries);
  const result = { path: input, mode, phrases, passed, entries };
  writeOptionalJson(args, result);

  if (!passed) {
    throw new CliError(`Outreach banned phrase validation failed for ${input}`, {
      exitCode: 1,
      code: "outreach_banned_phrases_failed",
      retryable: false
    });
  }

  output(ok(result), args);
}

async function verifyOutreachLength(args: string[]) {
  const [input] = positional(args);
  if (!input) throw new CliError("Missing draft path");

  const mode = readValidationMode(args);
  const maxWords = readPositiveIntegerFlag(args, "--max-words", 80);
  const maxLines = readPositiveIntegerFlag(args, "--max-lines", 8);
  const entries = extractDraftEntries(input).map((entry) => {
    const trimmed = entry.text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const lines = trimmed ? trimmed.split(/\r?\n/).filter((line) => line.trim()).length : 0;
    return {
      id: entry.id,
      passed: words <= maxWords && lines <= maxLines,
      words,
      lines,
      max_words: maxWords,
      max_lines: maxLines
    };
  });
  const passed = modePassed(mode, entries);
  const result = { path: input, mode, passed, entries };
  writeOptionalJson(args, result);

  if (!passed) {
    throw new CliError(`Outreach length validation failed for ${input}`, {
      exitCode: 1,
      code: "outreach_length_failed",
      retryable: false
    });
  }

  output(ok(result), args);
}

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function verifyDedupLead(args: string[]) {
  const [input] = positional(args);
  if (!input) throw new CliError("Missing email or JSON path");

  const email = validateEmailFormat(extractEmail(input));
  const days = readPositiveIntegerFlag(args, "--days", 30);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new CliError("Missing DATABASE_URL", {
      exitCode: 2,
      code: "missing_database_url",
      retryable: false
    });
  }

  const sql = `
    SELECT COALESCE(
      to_char(max(d.created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      ''
    ) AS last_contacted_at
    FROM drafts d
    JOIN leads l ON l.lead_id = d.lead_id
    WHERE lower(l.email) = lower(${sqlLiteral(email)})
      AND d.created_at >= now() - interval '${days} days';
  `;
  const result = spawnSync("psql", [databaseUrl, "-X", "--csv", "-t", "-c", sql], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    throw new CliError(`psql failed to start: ${result.error.message}`, {
      exitCode: 2,
      code: "psql_unavailable",
      retryable: false
    });
  }
  if (result.status !== 0) {
    throw new CliError(`Dedup query failed: ${result.stderr.trim()}`, {
      exitCode: 2,
      code: "dedup_query_failed",
      retryable: true
    });
  }

  const lastContactedAt = result.stdout.trim() || null;
  const data = {
    email,
    window_days: days,
    is_duplicate: Boolean(lastContactedAt),
    last_contacted_at: lastContactedAt
  };

  if (data.is_duplicate) {
    outputAndExit(
      {
        ok: false,
        data,
        error: {
          code: "duplicate_lead",
          message: `Lead has a draft in the last ${days} days`,
          retryable: false
        },
        warnings: [],
        next: []
      },
      1,
      args
    );
  }

  output(ok(data), args);
}

function extractJsonObjectFromText(content: string) {
  const direct = tryParseJson(content);
  if (direct && typeof direct === "object" && !Array.isArray(direct)) return direct as JsonObject;

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const fencedParsed = fenced ? tryParseJson(fenced.trim()) : undefined;
  if (fencedParsed && typeof fencedParsed === "object" && !Array.isArray(fencedParsed)) {
    return fencedParsed as JsonObject;
  }

  const objectText = content.match(/\{[\s\S]*\}/)?.[0];
  const objectParsed = objectText ? tryParseJson(objectText) : undefined;
  if (objectParsed && typeof objectParsed === "object" && !Array.isArray(objectParsed)) {
    return objectParsed as JsonObject;
  }

  return undefined;
}

async function verifyOutreachVoiceMatch(args: string[]) {
  const [input] = positional(args);
  if (!input) throw new CliError("Missing draft path");

  const threshold = readNumberFlag(args, "--threshold", 0.75);
  if (threshold < 0 || threshold > 1) throw new CliError("--threshold must be between 0 and 1");

  const token = process.env.OPENROUTER_API_KEY;
  if (!token) {
    throw new CliError("Missing OPENROUTER_API_KEY", {
      exitCode: 2,
      code: "missing_openrouter_api_key",
      retryable: false
    });
  }

  const voicePath = resolveInputPath(readFlag(args, "--voice") ?? "knowledge/voice.md");
  if (!existsSync(voicePath)) throw new CliError(`Voice guide not found: ${relative(REPO_ROOT, voicePath)}`);

  const entries = extractDraftEntries(input);
  const voice = readFileSync(voicePath, "utf8");
  const model = readFlag(args, "--model") ?? "anthropic/claude-haiku-4-5";
  const endpoint = process.env.OPENROUTER_CHAT_URL ?? "https://openrouter.ai/api/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://local.maestro-os",
      "X-Title": "Maestro OS"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a strict outreach voice judge. Return only JSON: {\"score\":0-1,\"passed\":boolean,\"reasoning\":\"short\",\"best_entry_id\":\"id or null\"}."
        },
        {
          role: "user",
          content: JSON.stringify({
            voice_guide: voice,
            threshold,
            drafts: entries
          })
        }
      ],
      temperature: 0
    })
  });

  const payload = (await response.json().catch(() => ({}))) as JsonObject;
  if (!response.ok) {
    throw new CliError(`OpenRouter voice judge failed: ${redactSecrets(JSON.stringify(payload))}`, {
      exitCode: 2,
      code: "voice_judge_failed",
      retryable: true
    });
  }

  const choices = payload.choices as JsonObject[] | undefined;
  const message = choices?.[0]?.message as JsonObject | undefined;
  const content = typeof message?.content === "string" ? message.content : "";
  const parsed = extractJsonObjectFromText(content);
  const score = typeof parsed?.score === "number" ? parsed.score : Number(parsed?.score);
  if (!Number.isFinite(score)) {
    throw new CliError("OpenRouter voice judge did not return a numeric score", {
      exitCode: 2,
      code: "voice_judge_bad_output",
      retryable: true
    });
  }

  const data = {
    path: input,
    model,
    threshold,
    score,
    passed: score >= threshold,
    reasoning: typeof parsed?.reasoning === "string" ? parsed.reasoning : "",
    best_entry_id: typeof parsed?.best_entry_id === "string" ? parsed.best_entry_id : null
  };
  writeOptionalJson(args, data);

  if (!data.passed) {
    throw new CliError(`Outreach voice match failed for ${input}: score=${score}`, {
      exitCode: 1,
      code: "outreach_voice_match_failed",
      retryable: false
    });
  }

  output(ok(data), args);
}

async function validateRequiredFields(args: string[]) {
  const [pathArg, fieldsArg] = positional(args);
  if (!pathArg) throw new CliError("Missing JSON path");
  if (!fieldsArg) throw new CliError("Missing required fields");

  const path = resolve(process.cwd(), pathArg);
  if (!existsSync(path)) throw new CliError(`File not found: ${pathArg}`);

  const parsed = parseJsonObject(readFileSync(path, "utf8"), pathArg);
  const missing = fieldsArg
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean)
    .filter((field) => parsed[field] === undefined || parsed[field] === null || parsed[field] === "");

  if (missing.length > 0) {
    throw new CliError(`Missing required fields in ${pathArg}: ${missing.join(",")}`, {
      exitCode: 1,
      code: "required_fields_missing",
      retryable: false
    });
  }

  output(ok({ path: relative(REPO_ROOT, path), fields: fieldsArg.split(",").map((field) => field.trim()) }), args);
}

function runWorkflowValidation(pathArg: string) {
  const path = resolve(REPO_ROOT, pathArg);
  if (!existsSync(path)) throw new CliError(`File not found: ${pathArg}`);

  const isFabro = path.endsWith(".fabro");
  const command = isFabro ? "fabro" : existsSync(GRAPHVIZ_DOT) ? GRAPHVIZ_DOT : "dot";
  const commandArgs = isFabro ? ["validate", path] : ["-Tdot", path];
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });

  if (result.error) {
    throw new CliError(`${basename(command)} failed to start: ${result.error.message}`, {
      exitCode: 2,
      code: "validator_unavailable",
      retryable: false
    });
  }
  if (result.status !== 0) {
    throw new CliError(`${basename(command)} validation failed: ${result.stderr || result.stdout}`, {
      exitCode: 1,
      code: "dot_validation_failed",
      retryable: false
    });
  }

  return { path: relative(REPO_ROOT, path), validator: basename(command), stdout: result.stdout.trim() };
}

async function workflowRegister(args: string[]) {
  const [pathArg] = positional(args);
  if (!pathArg) throw new CliError("Missing workflow path");

  const validation = runWorkflowValidation(pathArg);

  const path = resolve(REPO_ROOT, pathArg);
  const content = readFileSync(path);
  const hash = createHash("sha256").update(content).digest("hex");
  const registryPath = join(LOCAL_STATE_DIR, "workflows", "registry.json");
  ensureDir(join(LOCAL_STATE_DIR, "workflows"));

  const registry = existsSync(registryPath)
    ? (JSON.parse(readFileSync(registryPath, "utf8")) as JsonObject[])
    : [];
  const entry = {
    path: relative(REPO_ROOT, path),
    sha256: hash,
    registered_at: new Date().toISOString()
  };
  const nextRegistry = registry.filter((item) => item.path !== entry.path);
  nextRegistry.push(entry);
  writeFileSync(registryPath, `${JSON.stringify(nextRegistry, null, 2)}\n`);

  output(ok({ registered: entry, registry_path: relative(REPO_ROOT, registryPath), validation }), args);
}

function parseJsonObject(value: string, label: string): JsonObject {
  const parsed = tryParseJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new CliError(`${label} must be a JSON object`);
  }
  return parsed as JsonObject;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type DoctorCheck = {
  id: string;
  status: "pass" | "fail" | "warn";
  detail?: string;
};

const OPENROUTER_TEST_MODELS = [
  "moonshotai/kimi-k2.6",
  "google/gemini-3.1-flash-lite",
  "google/gemini-3.1-pro-preview",
  "qwen/qwen3.6-plus",
  "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v4-flash"
];

function redactSecrets(value: string) {
  return value
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, "sk-or-v1-<redacted>")
    .replace(/lin_api_[A-Za-z0-9_-]+/g, "lin_api_<redacted>")
    .replace(/xox[baprs]-[A-Za-z0-9-]+/g, "xox-<redacted>")
    .replace(/xapp-[A-Za-z0-9-]+/g, "xapp-<redacted>")
    .replace(/dtn_[A-Za-z0-9]+/g, "dtn_<redacted>")
    .replace(/fabro_dev_[0-9a-f]+/g, "fabro_dev_<redacted>")
    .replace(/gh[oOpPuUsSrR]_[A-Za-z0-9_]+/g, "gh_<redacted>");
}

function firstUsefulLine(value: string) {
  return redactSecrets(
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

function versionLine(value: string) {
  return (
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /\bversion\b/i.test(line) || /^v?\d+\.\d+\.\d+\b/.test(line)) ??
    firstUsefulLine(value)
  );
}

function runCheck(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    detail: result.error ? result.error.message : firstUsefulLine(combined)
  };
}

function commandCheck(id: string, command: string, args: string[]): DoctorCheck {
  const result = runCheck(command, args);
  return result.ok
    ? { id, status: "pass", detail: result.detail }
    : { id, status: "fail", detail: result.detail || `${command} failed` };
}

function envCheck(id: string, names: string[]): DoctorCheck {
  const missing = names.filter((name) => !process.env[name]);
  return missing.length === 0
    ? { id, status: "pass", detail: `${names.length} secret(s) present` }
    : { id, status: "fail", detail: `missing ${missing.join(", ")}` };
}

async function linearApiProbe() {
  const token = process.env.LINEAR_API_KEY;
  if (!token) {
    return {
      ok: false,
      missing: true,
      detail: "missing LINEAR_API_KEY"
    };
  }

  if (process.env.MAESTRO_LINEAR_SKIP_NETWORK === "1") {
    return {
      ok: true,
      missing: false,
      detail: "network skipped",
      data: { organization: null, teams: [] }
    };
  }

  const endpoint = process.env.LINEAR_API_URL ?? "https://api.linear.app/graphql";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `query MaestroLinearSmoke {
        viewer { id name email }
        organization { id name urlKey }
        teams(first: 20) { nodes { id key name } }
      }`
    })
  });

  const payload = (await response.json().catch(() => ({}))) as JsonObject;
  if (!response.ok || Array.isArray(payload.errors)) {
    return {
      ok: false,
      missing: false,
      detail: redactSecrets(JSON.stringify(payload.errors ?? payload))
    };
  }

  const data = payload.data as JsonObject | undefined;
  const viewer = data?.viewer as JsonObject | undefined;
  const organization = data?.organization as JsonObject | undefined;
  const teams = ((data?.teams as JsonObject | undefined)?.nodes as JsonObject[] | undefined) ?? [];
  return {
    ok: true,
    missing: false,
    detail: `${teams.length} team(s)`,
    data: {
      viewer: viewer
        ? {
            id: viewer.id,
            name: viewer.name
          }
        : null,
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            urlKey: organization.urlKey
          }
        : null,
      teams: teams.map((team) => ({
        id: team.id,
        key: team.key,
        name: team.name
      }))
    }
  };
}

async function linearSmoke(args: string[]) {
  const probe = await linearApiProbe();
  if (!probe.ok) {
    throw new CliError(`Linear API smoke failed: ${probe.detail}`, {
      exitCode: probe.missing ? 1 : 2,
      code: probe.missing ? "missing_linear_api_key" : "linear_api_failed",
      retryable: false
    });
  }
  output(ok({ provider: "linear", ...probe.data }), args);
}

async function linearApiCheck(): Promise<DoctorCheck> {
  const probe = await linearApiProbe();
  if (probe.ok) return { id: "linear_api", status: "pass", detail: probe.detail };
  if (probe.missing) return { id: "linear_api", status: "warn", detail: probe.detail };
  return { id: "linear_api", status: "fail", detail: probe.detail };
}

function fabroServerCheck(): DoctorCheck {
  const result = runCheck("fabro", ["server", "status", "--json"]);
  if (!result.ok) return { id: "fabro_server", status: "fail", detail: result.detail };

  const parsed = tryParseJson(result.stdout) as JsonObject | undefined;
  if (!parsed || parsed.status !== "running") {
    return { id: "fabro_server", status: "fail", detail: `status=${String(parsed?.status ?? "unknown")}` };
  }
  return { id: "fabro_server", status: "pass", detail: "running" };
}

function fabroGithubCheck(): DoctorCheck {
  const result = runCheck("fabro", ["settings", "--json"]);
  if (!result.ok) return { id: "fabro_github", status: "fail", detail: result.detail };

  const parsed = tryParseJson(result.stdout) as JsonObject | undefined;
  const server = parsed?.server as JsonObject | undefined;
  const nestedServer = server?.server as JsonObject | undefined;
  const integrations = nestedServer?.integrations as JsonObject | undefined;
  const github = integrations?.github as JsonObject | undefined;
  if (github?.enabled !== true) {
    return { id: "fabro_github", status: "fail", detail: "GitHub integration is not enabled" };
  }
  return { id: "fabro_github", status: "pass", detail: `strategy=${String(github.strategy ?? "unknown")}` };
}

function openRouterModelsCheck(): DoctorCheck {
  const result = runCheck("fabro", ["model", "list", "--provider", "openrouter", "--json"]);
  if (!result.ok) return { id: "openrouter_models", status: "fail", detail: result.detail };

  const parsed = tryParseJson(result.stdout);
  if (!Array.isArray(parsed)) {
    return { id: "openrouter_models", status: "fail", detail: "model list did not return an array" };
  }

  const models = new Map(
    parsed
      .filter((item): item is JsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item))
      .map((item) => [String(item.id), item])
  );
  const missing = OPENROUTER_TEST_MODELS.filter((id) => !models.has(id));
  const unconfigured = OPENROUTER_TEST_MODELS.filter((id) => models.get(id)?.configured !== true);
  if (missing.length > 0) {
    return { id: "openrouter_models", status: "fail", detail: `missing ${missing.join(", ")}` };
  }
  if (unconfigured.length > 0) {
    return { id: "openrouter_models", status: "fail", detail: `unconfigured ${unconfigured.join(", ")}` };
  }

  return { id: "openrouter_models", status: "pass", detail: `${OPENROUTER_TEST_MODELS.length} configured` };
}

function specKittyCheck(): DoctorCheck {
  const version = runCheck("spec-kitty", ["--version"]);
  if (!version.ok) return { id: "spec_kitty", status: "fail", detail: version.detail };

  const verify = runCheck("spec-kitty", ["verify-setup", "--json"]);
  if (!verify.ok) return { id: "spec_kitty", status: "fail", detail: verify.detail };

  const parsed = tryParseJson(verify.stdout) as JsonObject | undefined;
  const skills = parsed?.managed_skills as JsonObject | undefined;
  if (skills?.status && skills.status !== "ok") {
    return { id: "spec_kitty", status: "fail", detail: `managed_skills=${String(skills.status)}` };
  }
  return { id: "spec_kitty", status: "pass", detail: versionLine(version.stdout) || "installed" };
}

function qltyCheck(): DoctorCheck {
  const version = runCheck("qlty", ["--version"]);
  if (!version.ok) return { id: "qlty", status: "fail", detail: version.detail };

  const validate = runCheck("qlty", ["config", "validate", "--no-upgrade-check"]);
  if (!validate.ok) return { id: "qlty", status: "fail", detail: validate.detail };

  const installOnly = runCheck("qlty", [
    "check",
    "--all",
    "--install-only",
    "--no-progress",
    "--no-upgrade-check"
  ]);
  if (!installOnly.ok) return { id: "qlty", status: "fail", detail: installOnly.detail };

  return { id: "qlty", status: "pass", detail: firstUsefulLine(version.stdout) || "installed" };
}

async function doctorQualityStack(args: string[]) {
  const checks: DoctorCheck[] = [
    commandCheck("fabro_cli", "fabro", ["--help"]),
    fabroServerCheck(),
    fabroGithubCheck(),
    openRouterModelsCheck(),
    qltyCheck(),
    specKittyCheck(),
    commandCheck("daytona_cli", "daytona", ["--version"]),
    commandCheck("github_cli_auth", "gh", ["auth", "status"]),
    await linearApiCheck(),
    commandCheck("claude_cli", "claude", ["--version"]),
    commandCheck("codex_cli", "codex", ["--version"]),
    envCheck("slack_env", ["FABRO_SLACK_BOT_TOKEN", "FABRO_SLACK_APP_TOKEN", "FABRO_SLACK_CHANNEL_ID"]),
    envCheck("openrouter_env", ["OPENROUTER_API_KEY"]),
    envCheck("daytona_env", ["DAYTONA_API_KEY"])
  ];

  const failed = checks.filter((check) => check.status === "fail").length;
  const warnings = checks.filter((check) => check.status === "warn").map((check) => check.id);
  outputAndExit(
    {
      ok: failed === 0,
      data: {
        passed: checks.filter((check) => check.status === "pass").length,
        failed,
        warnings: warnings.length,
        checks
      },
      warnings,
      next: failed === 0 ? [] : ["Install or configure failed checks, then rerun maestro doctor quality-stack."]
    },
    failed === 0 ? 0 : 1,
    args
  );
}

async function dispatch(args: string[]) {
  if (args.length === 0 || hasFlag(args, "--help") || hasFlag(args, "-h")) usage(0);

  const [namespace, command, subcommand, ...rest] = args;

  if (namespace === "slack" && command === "post") return slackPost([subcommand, ...rest].filter(Boolean));
  if (namespace === "slack" && command === "ack-gate") return slackAckGate([subcommand, ...rest].filter(Boolean));

  if (namespace === "memory" && command === "get") return memoryGet([subcommand, ...rest].filter(Boolean));
  if (namespace === "memory" && command === "append") return memoryAppend([subcommand, ...rest].filter(Boolean));
  if (namespace === "memory" && command === "load-brief") {
    return memoryLoadBrief([subcommand, ...rest].filter(Boolean));
  }

  if (namespace === "db" && command === "query") return dbQuery([subcommand, ...rest].filter(Boolean));
  if (namespace === "knowledge" && command === "get") return knowledgeGet([subcommand, ...rest].filter(Boolean));
  if (namespace === "linear" && command === "smoke") return linearSmoke([subcommand, ...rest].filter(Boolean));
  if (namespace === "verify" && command === "dot-syntax") {
    return verifyDotSyntax([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "verify" && command === "workflow-quality") {
    return verifyWorkflowQuality([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "verify" && command === "spec-quality") {
    return verifySpecQuality([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "verify" && command === "text-gate") {
    return verifyTextGate([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "verify" && command === "email-deliverable") {
    return verifyEmailDeliverable([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "verify" && command === "outreach-voice-match") {
    return verifyOutreachVoiceMatch([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "verify" && command === "outreach-banned-phrases") {
    return verifyOutreachBannedPhrases([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "verify" && command === "outreach-length") {
    return verifyOutreachLength([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "verify" && command === "dedup-lead") {
    return verifyDedupLead([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "validate" && command === "required-fields") {
    return validateRequiredFields([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "workflow" && command === "register") {
    return workflowRegister([subcommand, ...rest].filter(Boolean));
  }
  if (namespace === "doctor" && command === "quality-stack") {
    return doctorQualityStack([subcommand, ...rest].filter(Boolean));
  }

  usage(1);
}

if (process.env.MAESTRO_SKIP_DOTENV !== "1") {
  loadDotEnv();
}
dispatch(process.argv.slice(2)).catch((error: unknown) => {
  const cliError =
    error instanceof CliError
      ? error
      : new CliError(error instanceof Error ? error.message : String(error), {
          exitCode: 2,
          code: "internal_error",
          retryable: false
        });

  console.error(
    JSON.stringify(
      {
        ok: false,
        error: {
          code: cliError.code,
          message: cliError.message,
          retryable: cliError.retryable
        },
        next: []
      },
      null,
      2
    )
  );
  process.exit(cliError.exitCode);
});
