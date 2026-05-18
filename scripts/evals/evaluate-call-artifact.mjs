#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { writeNormalizedResult } from "./eval-lib.mjs";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fail(failures, failure) {
  failures.push(failure);
}

let evalId = null;
let callReportPath = null;
let lastMessagePath = null;
let outPath = null;
let workflow = null;
let fabroNode = null;

try {
  evalId = argValue("--eval-id");
  callReportPath = resolve(argValue("--call-report"));
  lastMessagePath = resolve(argValue("--last-message"));
  outPath = resolve(argValue("--out"));
  workflow = argValue("--workflow", null);
  fabroNode = argValue("--fabro-node", null);
} catch (error) {
  console.error(JSON.stringify({ ok: false, failures: [error.message] }, null, 2));
  process.exit(2);
}

const failures = [];
let callReport = null;
let lastMessage = "";

if (!existsSync(callReportPath)) {
  fail(failures, `missing call report: ${callReportPath}`);
} else {
  try {
    callReport = readJson(callReportPath);
    if (!callReport || typeof callReport !== "object" || Array.isArray(callReport)) {
      fail(failures, "call report must be a JSON object");
      callReport = null;
    }
  } catch (error) {
    fail(failures, `malformed call report JSON: ${error.message}`);
  }
}

if (callReport) {
  if (callReport.ok !== true) fail(failures, "call report ok must be true");
  if (callReport.status !== 0) fail(failures, `call report status must be 0, got ${callReport.status}`);
}

if (!existsSync(lastMessagePath)) {
  fail(failures, `missing last message: ${lastMessagePath}`);
} else {
  lastMessage = readFileSync(lastMessagePath, "utf8");
  if (lastMessage.trim().length < 40) {
    fail(failures, `last message must be at least 40 characters, got ${lastMessage.trim().length}`);
  }
}

const passed = failures.length === 0;
const result = writeNormalizedResult(outPath, {
  eval_id: evalId,
  level: "call",
  runner: "deterministic",
  workflow,
  fabro_node: fabroNode,
  model: callReport?.model ?? null,
  runner_status: passed ? "passed" : "failed",
  failure_class: passed ? null : "call_artifact_invalid",
  artifact_uris: [callReportPath, lastMessagePath],
  metadata: {
    call_report_ok: callReport?.ok ?? null,
    call_report_status: callReport?.status ?? null,
    last_message_length: lastMessage.trim().length,
    failures,
  },
});

const output = { ok: passed, result_path: outPath, gate_status: result.gate_status, failures };
if (!passed) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output));
