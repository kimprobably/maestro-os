#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function toml(value) {
  return JSON.stringify(String(value));
}

function required(name) {
  const value = argValue(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const appType = required("--app-type");
const targetAudience = required("--target-audience");
const appName = required("--app-name");
const bundleId = required("--bundle-id");
const appDir = required("--app-dir");
const specKittyFeature = required("--spec-kitty-feature");
const slug = slugify(argValue("--slug", appName));
const topic = argValue("--topic", slug);
const graph = argValue("--graph", "build-iphone-app.cli.fabro");
const boilerplateRepo = argValue("--boilerplate-repo", "SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution");
const maxCompetitors = argValue("--max-competitors", "12");
const useMobbin = argValue("--use-mobbin", "true");
const iosValidationMode = argValue("--ios-validation-mode", "github");
const allowMacosDeferred = argValue("--allow-macos-deferred", "false");
const outPath = resolve(argValue("--out", `workflows/iphone-app-factory/runs/${slug}.railway.toml`));

const genericFailures = [];
if (appName === "Generated iPhone App") genericFailures.push("app_name is generic");
if (bundleId === "com.maestro.generatediphoneapp") genericFailures.push("bundle_id is generic");
if (appDir === "apps/generated-iphone-app") genericFailures.push("app_dir is generic");
if (specKittyFeature === "iphone-app-factory") genericFailures.push("spec_kitty_feature is generic");
if (!/^com\.[a-z0-9][a-z0-9.-]*\.[a-z0-9][a-z0-9-]*$/.test(bundleId)) {
  genericFailures.push("bundle_id should be a lowercase reverse-DNS identifier");
}
if (!/^apps\/[a-z0-9-]+-iphone$/.test(appDir)) {
  genericFailures.push("app_dir should look like apps/<slug>-iphone");
}
if (!slug) genericFailures.push("slug is empty");

if (genericFailures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures: genericFailures }, null, 2));
  process.exit(1);
}

const content = `_version = 1

[workflow]
graph = ${toml(graph)}

[run]
goal = "Build a differentiated iPhone app from a researched app opportunity using SwiftAIBoilerplatePro"

[run.metadata]
factory = "iphone-app"
app = ${toml(slug)}
topic = ${toml(topic)}
control_plane = "railway"

[run.inputs]
app_type = ${toml(appType)}
target_audience = ${toml(targetAudience)}
app_name = ${toml(appName)}
bundle_id = ${toml(bundleId)}
app_dir = ${toml(appDir)}
spec_kitty_feature = ${toml(specKittyFeature)}
boilerplate_repo = ${toml(boilerplateRepo)}
max_competitors = ${toml(maxCompetitors)}
use_mobbin = ${toml(useMobbin)}
ios_validation_mode = ${toml(iosValidationMode)}
allow_macos_deferred = ${toml(allowMacosDeferred)}

[run.sandbox]
provider = "daytona"
preserve = false
stop_on_terminal = true

[run.sandbox.daytona]
auto_stop_interval = 30

[run.sandbox.env]
APIFY_TOKEN = "{{ env.APIFY_TOKEN }}"
GITHUB_TOKEN = "{{ env.GITHUB_TOKEN }}"
GH_TOKEN = "{{ env.GH_TOKEN }}"
OPENROUTER_API_KEY = "{{ env.OPENROUTER_API_KEY }}"
CLAUDE_CODE_OAUTH_TOKEN = "{{ env.CLAUDE_CODE_OAUTH_TOKEN }}"
CLAUDE_CODE_CREDENTIALS_JSON_BASE64 = "{{ env.CLAUDE_CODE_CREDENTIALS_JSON_BASE64 }}"
CODEX_AUTH_JSON_BASE64 = "{{ env.CODEX_AUTH_JSON_BASE64 }}"
MOBBIN_EMAIL = "{{ env.MOBBIN_EMAIL }}"
MOBBIN_PASSWORD = "{{ env.MOBBIN_PASSWORD }}"
FABRO_SERVER = "{{ env.FABRO_SERVER }}"
FABRO_DEV_TOKEN = "{{ env.FABRO_DEV_TOKEN }}"

[run.artifacts]
include = [
  ".workflow/**",
  "apps/*-iphone/**",
  ".github/workflows/**",
  "reports/ios/**",
]
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, content);
console.log(JSON.stringify({ ok: true, path: outPath, slug, app_dir: appDir, bundle_id: bundleId }, null, 2));
