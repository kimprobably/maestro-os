#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const repoRoot = resolve(import.meta.dirname, "..");
const defaultModels = [
  "moonshotai/kimi-k2.6",
  "qwen/qwen3.6-plus",
  "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v4-flash"
];

const modelCosts = {
  "moonshotai/kimi-k2.6": { input: 0.74, output: 3.5 },
  "qwen/qwen3.6-plus": { input: 0.325, output: 1.95 },
  "deepseek/deepseek-v4-pro": { input: 0.435, output: 0.87 },
  "deepseek/deepseek-v4-flash": { input: 0.14, output: 0.28 }
};

function loadDotEnv() {
  const path = resolve(repoRoot, ".env.local");
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

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

function readRepoFile(path, maxChars = 12000) {
  const fullPath = resolve(repoRoot, path);
  if (!existsSync(fullPath)) return "";
  return readFileSync(fullPath, "utf8").slice(0, maxChars);
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    try {
      return JSON.parse(fenced.trim());
    } catch {}
  }
  const object = text.match(/\{[\s\S]*\}/)?.[0];
  if (object) {
    try {
      return JSON.parse(object);
    } catch {}
  }
  return null;
}

function buildTasks() {
  const spec = readRepoFile("specs/factory/goal-to-production-spec.md");
  const architecture = readRepoFile(".maestro/factory/architecture.md", 8000);
  return [
    {
      id: "spec_review",
      role: "difficult_review",
      maxTokens: 1400,
      requiredKeys: ["verdict", "score", "findings", "required_fixes"],
      system: "You are a strict software spec reviewer. Return JSON only.",
      user: JSON.stringify({
        instruction:
          "Review this implementation spec for ambiguity, missing acceptance criteria, missing verification, and hidden architecture risk. Return {verdict:'APPROVE'|'REJECT', score:0-1, findings:[{severity, issue, fix}], required_fixes:[]}.",
        spec
      })
    },
    {
      id: "patch_proposal",
      role: "cheap_generation",
      maxTokens: 1200,
      requiredKeys: ["verdict", "summary", "patch", "tests"],
      system: "You propose code patches. Return JSON only; do not include prose outside JSON.",
      user: JSON.stringify({
        instruction:
          "Given the bug, return {verdict:'PATCH'|'NEEDS_INFO', summary, patch, tests}. The patch must be a unified diff and must not invent unrelated files.",
        bug: "normalizeName should trim, collapse whitespace, and lowercase names, but it currently only trims.",
        file: "src/normalize.ts",
        current_code:
          "export function normalizeName(input: string): string {\n  return input.trim();\n}\n",
        expected_behavior: [
          "normalizeName(' Tim   Keen ') === 'tim keen'",
          "normalizeName('\\nMAYA\\tCHEN') === 'maya chen'"
        ]
      })
    },
    {
      id: "architecture_risk",
      role: "scaffolding_review",
      maxTokens: 1400,
      requiredKeys: ["decision", "risks", "routing_recommendation"],
      system: "You are an architecture reviewer. Return JSON only.",
      user: JSON.stringify({
        instruction:
          "Assess whether this app architecture is suitable for a generated internal tool. Return {decision:'KEEP'|'REVISE', risks:[{severity, risk, mitigation}], routing_recommendation:{scaffold_model, generation_model, review_model}}.",
        spec_excerpt: spec.slice(0, 9000),
        architecture_excerpt: architecture
      })
    }
  ];
}

function scoreResult(task, parsed, content) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return 0;
  let score = 0.35;
  const keys = new Set(Object.keys(parsed));
  const missing = task.requiredKeys.filter((key) => !keys.has(key));
  score += (task.requiredKeys.length - missing.length) * (0.4 / task.requiredKeys.length);
  if (/```|Here is|I would/i.test(content)) score -= 0.1;
  if (task.id === "patch_proposal" && typeof parsed.patch === "string") {
    if (/^diff --git|^---\s+/m.test(parsed.patch)) score += 0.15;
    if (/toLowerCase|replace\(/.test(parsed.patch)) score += 0.1;
  }
  if (task.id !== "patch_proposal" && Array.isArray(parsed.findings ?? parsed.risks)) score += 0.15;
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

async function callOpenRouter({ model, task, apiKey, endpoint, timeoutMs }) {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const body = {
    model,
    messages: [
      { role: "system", content: task.system },
      { role: "user", content: task.user }
    ],
    temperature: 0,
    max_tokens: task.maxTokens,
    reasoning: {
      effort: "none",
      exclude: true
    }
  };
  let response;
  let payload;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://local.maestro-os",
        "X-Title": "Maestro OS Model Eval"
      },
      body: JSON.stringify(body)
    });
    payload = await response.json().catch(() => ({}));
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - started);
    return {
      model,
      task: task.id,
      role: task.role,
      ok: false,
      status: 0,
      elapsed_ms: elapsedMs,
      timeout_ms: timeoutMs,
      input_tokens: estimateTokens(task.system + task.user),
      output_tokens: 0,
      estimated_cost_usd: 0,
      score: 0,
      parsed: null,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
  const elapsedMs = Math.round(performance.now() - started);
  const choice = payload?.choices?.[0] ?? {};
  const message = choice?.message ?? {};
  const content = message?.content ?? "";
  const parsed = typeof content === "string" ? extractJson(content) : null;
  const inputTokens = payload?.usage?.prompt_tokens ?? estimateTokens(task.system + task.user);
  const outputTokens = payload?.usage?.completion_tokens ?? estimateTokens(String(content));
  const costs = modelCosts[model] ?? { input: 0, output: 0 };
  const estimatedCostUsd = Number(
    (((inputTokens * costs.input) + (outputTokens * costs.output)) / 1_000_000).toFixed(6)
  );

  return {
    model,
    task: task.id,
    role: task.role,
    ok: response.ok && Boolean(parsed),
    status: response.status,
    elapsed_ms: elapsedMs,
    timeout_ms: timeoutMs,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_usd: estimatedCostUsd,
    score: scoreResult(task, parsed, String(content)),
    parsed,
    error: response.ok ? null : payload?.error ?? payload,
    finish_reason: choice?.finish_reason ?? null,
    message_keys: message && typeof message === "object" ? Object.keys(message).sort() : [],
    content_excerpt: typeof content === "string" ? content.slice(0, 500) : ""
  };
}

async function main() {
  loadDotEnv();
  const live = hasFlag("--live");
  const models = argValue("--models", defaultModels.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const outputPath = resolve(repoRoot, argValue("--output", ".workflow/model-evals/openrouter-coding-eval.json"));
  const endpoint = process.env.OPENROUTER_CHAT_URL ?? "https://openrouter.ai/api/v1/chat/completions";
  const timeoutMs = Number(process.env.MAESTRO_MODEL_EVAL_TIMEOUT_MS ?? "45000");
  const tasks = buildTasks();

  if (!live) {
    const plan = {
      ok: true,
      mode: "dry-run",
      models,
      tasks: tasks.map((task) => ({
        id: task.id,
        role: task.role,
        max_tokens: task.maxTokens,
        required_keys: task.requiredKeys
      })),
      timeout_ms: timeoutMs,
      output: outputPath
    };
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`);
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  const results = [];
  for (const model of models) {
    for (const task of tasks) {
      results.push(await callOpenRouter({ model, task, apiKey, endpoint, timeoutMs }));
    }
  }

  const summary = models.map((model) => {
    const rows = results.filter((row) => row.model === model);
    const passed = rows.filter((row) => row.ok && row.score >= 0.75).length;
    const avgScore = rows.reduce((total, row) => total + row.score, 0) / Math.max(1, rows.length);
    const totalCost = rows.reduce((total, row) => total + row.estimated_cost_usd, 0);
    const avgLatency = rows.reduce((total, row) => total + row.elapsed_ms, 0) / Math.max(1, rows.length);
    return {
      model,
      passed,
      total: rows.length,
      avg_score: Number(avgScore.toFixed(2)),
      estimated_cost_usd: Number(totalCost.toFixed(6)),
      avg_latency_ms: Math.round(avgLatency)
    };
  });

  const report = {
    ok: results.every((row) => row.ok),
    mode: "live",
    timeout_ms: timeoutMs,
    generated_at: new Date().toISOString(),
    models,
    tasks: tasks.map((task) => ({ id: task.id, role: task.role })),
    promotion_rule: "Promote only when avg_score >= 0.80, no JSON failures, and patch proposals apply cleanly in sandbox.",
    summary,
    results
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ok: report.ok, output: outputPath, summary }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(1);
});
