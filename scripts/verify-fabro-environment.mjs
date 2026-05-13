#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireFile(path) {
  if (!existsSync(path)) fail(`missing required file: ${path}`);
  return readFileSync(path, "utf8");
}

function requireIncludes(source, needle, label) {
  if (!source.includes(needle)) fail(`missing ${label}: ${needle}`);
}

function requireMatches(source, pattern, label) {
  if (!pattern.test(source)) fail(`missing ${label}: ${pattern}`);
}

const project = requireFile(".fabro/project.toml");
const qltyGate = requireFile("scripts/consumer-radar/qlty-gate.mjs");
const consumerToml = requireFile(
  "workflows/consumer-radar/build-consumer-app-radar.toml",
);
const phasedToml = requireFile(
  "workflows/code/phased-application-build.daytona.toml",
);

for (const secretPattern of [
  /sk-or-v1-/,
  /apify_api_/,
  /dtn_[a-f0-9]/,
  /xoxb-/,
  /xapp-/,
  /lin_api_/,
]) {
  if (secretPattern.test(project + consumerToml + phasedToml)) {
    fail(`raw secret leaked into workflow configuration: ${secretPattern}`);
  }
}

requireIncludes(project, '[project]\nname = "maestro-os"', "project identity");
requireIncludes(
  project,
  '[run.agent]\npermissions = "full"',
  "agent permissions",
);
requireMatches(
  project,
  /\[run\.sandbox\.daytona\][\s\S]*network = "allow_all"/,
  "Daytona allow-all network",
);
requireIncludes(
  project,
  'name = "maestro-code-factory-v5"',
  "Daytona code factory snapshot",
);
requireIncludes(
  project,
  'MAESTRO_AGENT_STATE_DIR = "/home/daytona/agent-state"',
  "Daytona agent state env",
);
requireMatches(
  project,
  /\[\[run\.sandbox\.daytona\.volumes\]\][\s\S]*mount_path = "\/home\/daytona\/agent-state"/,
  "Daytona agent auth volume",
);
requireIncludes(project, "spec-kitty-cli==3.1.8", "Spec Kitty install");
requireIncludes(project, "fabro --version", "Fabro CLI install");
requireIncludes(
  project,
  "@anthropic-ai/claude-code @openai/codex promptfoo",
  "agent CLI installs",
);
requireIncludes(project, "https://qlty.sh", "Qlty install");
requireIncludes(project, "https://bun.sh/install", "Bun install");
requireIncludes(
  project,
  'OPENROUTER_API_KEY = "${{ secrets.OPENROUTER_API_KEY }}"',
  "OpenRouter sandbox secret",
);
requireIncludes(
  project,
  'APIFY_TOKEN = "${{ secrets.APIFY_TOKEN }}"',
  "Apify sandbox secret",
);
requireIncludes(
  project,
  'DAYTONA_API_URL = "${{ secrets.DAYTONA_API_URL }}"',
  "Daytona API URL secret",
);
requireIncludes(
  project,
  'LINEAR_API_KEY = "${{ secrets.LINEAR_API_KEY }}"',
  "Linear sandbox secret",
);
requireIncludes(
  project,
  'FABRO_SLACK_BOT_TOKEN = "${{ secrets.FABRO_SLACK_BOT_TOKEN }}"',
  "Slack bot sandbox secret",
);
requireIncludes(project, "include = [", "artifact include policy");
requireIncludes(project, '".workflow/**"', "workflow artifact include");
requireIncludes(project, '"reports/**"', "report artifact include");

requireMatches(
  project,
  /\[run\.integrations\.github\.permissions\][\s\S]*contents = "write"/,
  "GitHub contents write permission",
);
requireMatches(
  project,
  /\[run\.integrations\.github\.permissions\][\s\S]*pull_requests = "write"/,
  "GitHub pull request write permission",
);
requireMatches(
  project,
  /\[run\.integrations\.github\.permissions\][\s\S]*issues = "write"/,
  "GitHub issue write permission",
);
requireMatches(
  project,
  /\[run\.integrations\.github\.permissions\][\s\S]*actions = "read"/,
  "GitHub actions read permission",
);

requireIncludes(
  consumerToml,
  'provider = "daytona"',
  "consumer radar Daytona provider",
);
requireIncludes(
  consumerToml,
  'allow_quality_fallback = "false"',
  "strict qlty default",
);
requireIncludes(
  consumerToml,
  'minimum_active_reviews = "2"',
  "parallel review quorum",
);
if (consumerToml.includes("[run.sandbox.daytona.snapshot]")) {
  fail(
    "consumer radar workflow should inherit the shared Daytona snapshot from .fabro/project.toml",
  );
}
if (phasedToml.includes("[run.sandbox.daytona.snapshot]")) {
  fail(
    "phased app workflow should inherit the shared Daytona snapshot from .fabro/project.toml",
  );
}

requireIncludes(
  qltyGate,
  "qlty fmt --all --no-progress --no-upgrade-check",
  "qlty formatter pass",
);
requireIncludes(qltyGate, "strictMode", "strict qlty branch");
requireIncludes(
  qltyGate,
  "qlty check --all --no-progress --summary --no-upgrade-check",
  "strict qlty check",
);
requireIncludes(
  qltyGate,
  "qlty check --all --no-progress --no-fail --summary --no-upgrade-check",
  "fallback qlty check",
);

console.log(
  JSON.stringify({ ok: true, checked: "fabro-environment" }, null, 2),
);
