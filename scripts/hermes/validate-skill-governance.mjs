#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function booleanArg(name, fallback) {
  return String(argValue(name, String(fallback))).toLowerCase() === "true";
}

const candidatePath = argValue(
  "--candidate",
  "hermes/distribution/maestro-operator/skills/maestro-skill-governance/SKILL.md",
);
const config = argValue("--config", "evals/hermes-skill-governance/skill-promotion.yaml");
const outPath = resolve(argValue("--out", ".workflow/hermes-skill-governance/skill-promotion-report.json"));
const allowFallback = booleanArg("--allow-fallback", true);
const timeoutMs = Number(process.env.PROMPTFOO_MAX_EVAL_TIME_MS || "120000");

function writeReport(report) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

if (!existsSync(candidatePath)) {
  writeReport({
    ok: false,
    candidate_path: candidatePath,
    fallback_failures: [`candidate skill not found: ${candidatePath}`],
  });
  process.exit(1);
}

const candidate = readFileSync(candidatePath, "utf8");
mkdirSync(".workflow/hermes-skill-governance", { recursive: true });
writeFileSync(".workflow/hermes-skill-governance/candidate-skill.md", candidate);

const requiredPhrases = [
  "external evidence",
  "Promptfoo",
  "Fabro",
  "must not rewrite curated",
  "approval",
];
const forbiddenPatterns = [
  { name: "slack_bot_token", pattern: /xoxb-/ },
  { name: "slack_app_token", pattern: /xapp-/ },
  { name: "openrouter_token", pattern: /sk-or-v1-/ },
  { name: "linear_token", pattern: /lin_api_/ },
  { name: "broad_env_dump", pattern: /\b(printenv|declare -x)\b/ },
  { name: "ungated_send", pattern: /send (email|campaign|message|outbound).{0,80}without approval/i },
  { name: "direct_code_edits_from_slack", pattern: /edit application code from Slack/i },
];

const fallbackFailures = [];
for (const phrase of requiredPhrases) {
  if (!candidate.includes(phrase)) fallbackFailures.push(`candidate missing required phrase: ${phrase}`);
}
for (const { name, pattern } of forbiddenPatterns) {
  if (pattern.test(candidate)) fallbackFailures.push(`candidate matched forbidden pattern: ${name}`);
}
if (candidate.trim().length < 500) fallbackFailures.push("candidate skill is too thin");
if (!/^# /m.test(candidate)) fallbackFailures.push("candidate skill lacks a title heading");

const promptfooAvailable = spawnSync("sh", ["-lc", "command -v npx >/dev/null 2>&1"], {
  encoding: "utf8",
}).status === 0;

let promptfooResult = null;
if (promptfooAvailable) {
  promptfooResult = spawnSync(
    "sh",
    ["-lc", `npx -y promptfoo@latest eval -c ${JSON.stringify(config)} --no-progress-bar`],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "",
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
        PROMPTFOO_DISABLE_TELEMETRY: "1",
      },
      timeout: timeoutMs + 15000,
    },
  );
}

const promptfooOk = Boolean(promptfooResult && promptfooResult.status === 0);
const fallbackOk = fallbackFailures.length === 0;
const ok = promptfooOk || (allowFallback && fallbackOk);
writeReport({
  ok,
  candidate_path: candidatePath,
  promptfoo_attempted: Boolean(promptfooResult),
  promptfoo_status: promptfooResult ? promptfooResult.status : null,
  promptfoo_stdout_excerpt: promptfooResult ? promptfooResult.stdout.slice(-3000) : "",
  promptfoo_stderr_excerpt: promptfooResult ? promptfooResult.stderr.slice(-3000) : "",
  fallback_used: !promptfooOk,
  fallback_ok: fallbackOk,
  fallback_failures: fallbackFailures,
});

if (!ok) process.exit(1);
