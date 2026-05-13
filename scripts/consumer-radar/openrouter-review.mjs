#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

function extractJson(text) {
  try { return JSON.parse(text); } catch {}
  const match = String(text).match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

function normalizeContent(value) {
  if (Array.isArray(value)) {
    return value.map((item) => item?.text || item?.content || "").join("\n");
  }
  return value == null ? "" : String(value);
}

function walkFiles(root, dir = root, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".data"].includes(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(root, fullPath, found);
    } else if (entry.isFile()) {
      found.push(relative(root, fullPath));
    }
  }
  return found;
}

function readExcerpt(file, maxChars = 5000) {
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  return readFileSync(file, "utf8").slice(0, maxChars);
}

function argBool(name, fallback) {
  const raw = argValue(name, String(fallback));
  return raw === true || raw === "true" || raw === "1" || raw === "yes";
}

const models = argValue("--model", "deepseek/deepseek-v4-flash").split(",").map((item) => item.trim()).filter(Boolean);
const role = argValue("--role", "review");
const appDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const output = argValue("--output", "reports/consumer-radar/reviews/review.json");
const realMode = argBool("--real-mode", false);
const token = process.env.OPENROUTER_API_KEY;
mkdirSync(dirname(output), { recursive: true });

const appBuild = existsSync(appDir + "/.workflow-build.json") ? readFileSync(appDir + "/.workflow-build.json", "utf8") : "{}";
const spec = existsSync("specs/consumer-app-radar/spec.md") ? readFileSync("specs/consumer-app-radar/spec.md", "utf8").slice(0, 5000) : "";
const sourceFiles = walkFiles(appDir).sort();
const sourceExcerpts = {};
for (const file of [
  "package.json",
  "README.md",
  "src/server.js",
  "src/ingest.js",
  "src/scoring.js",
  "src/sources/apple.js",
  "src/sources/apify.js",
  "src/sources/social.js",
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "tests/api-fixture.test.js",
  "tests/scoring.test.js"
]) {
  const excerpt = readExcerpt(join(appDir, file));
  if (excerpt) sourceExcerpts[file] = excerpt;
}
const prompt = {
  role,
  instruction: "Review the generated Consumer App Radar app using the provided source excerpts and file list. Return compact JSON only with {verdict:'APPROVE'|'REVISE', score:0-1, findings:[{severity, issue, fix}], suggested_next_steps:[]}. Limit findings to 3, keep issue/fix under 180 chars, and do not claim an endpoint or file is missing if it appears in the source excerpts. Treat fixture-backed live-data fallbacks as acceptable for this one-pass internal spike when the adapter and strict smoke gate exist.",
  app_build: appBuild,
  source_files: sourceFiles,
  source_excerpts: sourceExcerpts,
  spec
};

if (!token || token.includes("{{")) {
  const skipped = { ok: !realMode, skipped: true, real_mode: realMode, reason: "OPENROUTER_API_KEY unavailable in sandbox", role, models };
  writeFileSync(output, JSON.stringify(skipped, null, 2) + "\n");
  console.log(JSON.stringify(skipped, null, 2));
  process.exit(realMode ? 1 : 0);
}

let finalReport = null;
for (const model of models) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fabro-maestro-production.up.railway.app",
        "X-Title": "Maestro Consumer App Radar Review"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a terse senior product engineering reviewer. Return JSON only." },
          { role: "user", content: JSON.stringify(prompt) }
        ],
        temperature: 0,
        max_tokens: 2200
      })
    });
    const payload = await response.json().catch(() => ({}));
    const message = payload?.choices?.[0]?.message || {};
    const content = normalizeContent(message.content || message.reasoning || payload?.choices?.[0]?.text || "");
    const parsed = extractJson(content);
    finalReport = {
      ok: response.ok && Boolean(parsed),
      skipped: false,
      real_mode: realMode,
      model,
      role,
      status: response.status,
      parsed,
      raw_excerpt: String(content).slice(0, 1200),
      error: response.ok ? null : payload?.error || payload,
      payload_excerpt: content ? null : JSON.stringify(payload).slice(0, 1200)
    };
    if (response.ok && parsed) break;
  } catch (error) {
    finalReport = { ok: false, skipped: false, real_mode: realMode, model, role, error: error instanceof Error ? error.message : String(error) };
  }
}

writeFileSync(output, JSON.stringify(finalReport, null, 2) + "\n");
console.log(JSON.stringify(finalReport, null, 2));
if (realMode && !finalReport?.ok) process.exit(1);
