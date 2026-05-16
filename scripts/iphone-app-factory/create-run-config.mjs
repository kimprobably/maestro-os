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

function hasUrlCredentials(value) {
  try {
    const url = new URL(value);
    return Boolean(url.username || url.password);
  } catch {
    return false;
  }
}

function safeRelativeDir(value) {
  const normalized = String(value || "").replace(/\\/g, "/");
  return Boolean(normalized)
    && normalized !== "."
    && !normalized.startsWith("/")
    && !/^[a-z]:\//i.test(normalized)
    && !normalized.split("/").includes("..");
}

function safeGitRef(value) {
  const raw = String(value || "");
  return /^[A-Za-z0-9._/-]+$/.test(raw)
    && !raw.startsWith("-")
    && !raw.includes("..")
    && !raw.includes("//")
    && !raw.endsWith(".lock");
}

function safeIdentifier(value) {
  return /^[a-z0-9][a-z0-9_-]*$/.test(String(value || ""));
}

function required(name) {
  const value = argValue(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const mode = argValue("--mode", "build");
const targetAudience = required("--target-audience");
const appName = required("--app-name");
const bundleId = required("--bundle-id");
const appDir = required("--app-dir");
const slug = slugify(argValue("--slug", appName));
const topic = argValue("--topic", slug);
const graph = argValue("--graph", mode === "ux-iteration" ? "iterate-existing-app-ux.fabro" : "build-iphone-app.cli.fabro");
const appType = mode === "ux-iteration" ? argValue("--app-type", argValue("--app-domain", "existing iPhone app UX iteration")) : required("--app-type");
const specKittyFeature = mode === "ux-iteration" ? argValue("--spec-kitty-feature", `${slug}-ux-studio`) : required("--spec-kitty-feature");
const boilerplateRepo = argValue("--boilerplate-repo", "SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution");
const maxCompetitors = argValue("--max-competitors", "12");
const useMobbin = argValue("--use-mobbin", "true");
const useMobbinMcp = argValue("--use-mobbin-mcp", useMobbin);
const useDesignCorpus = argValue("--use-design-corpus", "true");
const selectedDirectionMode = argValue("--selected-direction-mode", "automatic");
const iosValidationMode = argValue("--ios-validation-mode", "github");
const allowMacosDeferred = argValue("--allow-macos-deferred", "false");
const repoUrl = argValue("--repo-url", "https://github.com/kimprobably/waketask-ios.git");
const baseBranch = argValue("--base-branch", "main");
const runBranch = argValue("--run-branch", "ux-studio/manual");
const appDomain = argValue("--app-domain", slug);
const designGoal = argValue("--design-goal", "");
const outPath = resolve(argValue("--out", `workflows/iphone-app-factory/runs/${slug}.railway.toml`));

const genericFailures = [];
if (appName === "Generated iPhone App") genericFailures.push("app_name is generic");
if (bundleId === "com.maestro.generatediphoneapp") genericFailures.push("bundle_id is generic");
if (appDir === "apps/generated-iphone-app") genericFailures.push("app_dir is generic");
if (specKittyFeature === "iphone-app-factory") genericFailures.push("spec_kitty_feature is generic");
if (!/^com\.[a-z0-9][a-z0-9.-]*\.[a-z0-9][a-z0-9-]*$/.test(bundleId)) {
  genericFailures.push("bundle_id should be a lowercase reverse-DNS identifier");
}
if (mode !== "ux-iteration" && !/^apps\/[a-z0-9-]+-iphone$/.test(appDir)) {
  genericFailures.push("app_dir should look like apps/<slug>-iphone");
}
if (mode === "ux-iteration" && !repoUrl) genericFailures.push("repo_url is required for ux-iteration mode");
if (mode === "ux-iteration" && hasUrlCredentials(repoUrl)) genericFailures.push("repo_url must not include credentials");
if (mode === "ux-iteration" && !baseBranch) genericFailures.push("base_branch is required for ux-iteration mode");
if (mode === "ux-iteration" && !safeGitRef(baseBranch)) genericFailures.push("base_branch contains unsafe characters");
if (mode === "ux-iteration" && !runBranch) genericFailures.push("run_branch is required for ux-iteration mode");
if (mode === "ux-iteration" && /{{|}}/.test(runBranch)) genericFailures.push("run_branch must be concrete before Fabro preflight");
if (mode === "ux-iteration" && !safeGitRef(runBranch)) genericFailures.push("run_branch contains unsafe characters");
if (mode === "ux-iteration" && !appDomain) genericFailures.push("app_domain is required for ux-iteration mode");
if (mode === "ux-iteration" && !safeIdentifier(appDomain)) genericFailures.push("app_domain contains unsafe characters");
if (mode === "ux-iteration" && !designGoal) genericFailures.push("design_goal is required for ux-iteration mode");
if (mode === "ux-iteration" && !safeRelativeDir(appDir)) genericFailures.push("app_dir must be a checkout directory for ux-iteration mode");
if (!slug) genericFailures.push("slug is empty");

if (genericFailures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures: genericFailures }, null, 2));
  process.exit(1);
}

const buildContent = `_version = 1

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
CODEX_MCP_CREDENTIALS_JSON_BASE64 = "{{ env.CODEX_MCP_CREDENTIALS_JSON_BASE64 }}"
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

const uxContent = `_version = 1

[workflow]
graph = ${toml(graph)}

[run]
goal = "Iterate on an existing iPhone app UX with private design research, adversarial design options, hosted iOS validation, and postmortem learning capture"

[run.metadata]
factory = "iphone-app-ux-studio"
app = ${toml(slug)}
topic = ${toml(topic)}
control_plane = "railway"

[run.inputs]
repo_url = ${toml(repoUrl)}
base_branch = ${toml(baseBranch)}
run_branch = ${toml(runBranch)}
app_name = ${toml(appName)}
bundle_id = ${toml(bundleId)}
app_dir = ${toml(appDir)}
app_domain = ${toml(appDomain)}
target_audience = ${toml(targetAudience)}
design_goal = ${toml(designGoal)}
max_competitors = ${toml(maxCompetitors)}
use_mobbin_mcp = ${toml(useMobbinMcp)}
use_design_corpus = ${toml(useDesignCorpus)}
design_corpus_write_mode = "private"
selected_direction_mode = ${toml(selectedDirectionMode)}
ios_validation_mode = ${toml(iosValidationMode)}
allow_macos_deferred = ${toml(allowMacosDeferred)}
fabro_server = "https://fabro-maestro-production.up.railway.app/api/v1"

[run.sandbox]
provider = "daytona"
preserve = false
stop_on_terminal = true

[run.sandbox.daytona]
auto_stop_interval = 30
network = "allow_all"

[run.sandbox.env]
FABRO_SERVER = "https://fabro-maestro-production.up.railway.app/api/v1"
FABRO_DEV_TOKEN = "{{ env.FABRO_DEV_TOKEN }}"
UX_REPO_URL = ${toml(repoUrl)}
UX_BASE_BRANCH = ${toml(baseBranch)}
UX_RUN_BRANCH = ${toml(runBranch)}
UX_RUN_ID = ${toml(runBranch)}
UX_APP_DIR = ${toml(appDir)}
UX_APP_DOMAIN = ${toml(appDomain)}
UX_SCREEN_TYPE = ${toml(appDomain)}
UX_TARGET_AUDIENCE = ${toml(targetAudience)}
UX_USE_MOBBIN_MCP = ${toml(useMobbinMcp)}
UX_IOS_VALIDATION_MODE = ${toml(iosValidationMode)}
UX_ALLOW_MACOS_DEFERRED = ${toml(allowMacosDeferred)}
APP_DIR = ${toml(appDir)}
APIFY_TOKEN = "{{ env.APIFY_TOKEN }}"
GITHUB_TOKEN = "{{ env.GITHUB_TOKEN }}"
GH_TOKEN = "{{ env.GH_TOKEN }}"
OPENROUTER_API_KEY = "{{ env.OPENROUTER_API_KEY }}"
CLAUDE_CODE_OAUTH_TOKEN = "{{ env.CLAUDE_CODE_OAUTH_TOKEN }}"
CLAUDE_CODE_CREDENTIALS_JSON_BASE64 = "{{ env.CLAUDE_CODE_CREDENTIALS_JSON_BASE64 }}"
CODEX_AUTH_JSON_BASE64 = "{{ env.CODEX_AUTH_JSON_BASE64 }}"
CODEX_MCP_CREDENTIALS_JSON_BASE64 = "{{ env.CODEX_MCP_CREDENTIALS_JSON_BASE64 }}"
DESIGN_CORPUS_DATABASE_URL = "{{ env.DESIGN_CORPUS_DATABASE_URL }}"
DESIGN_CORPUS_OBJECT_STORE = "{{ env.DESIGN_CORPUS_OBJECT_STORE }}"

[run.artifacts]
include = [
  ".workflow/iphone-app-ux-studio/**",
  ".workflow/iphone-app-factory/**",
  "reports/ios/**",
  ".github/workflows/**",
]
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, mode === "ux-iteration" ? uxContent : buildContent);
console.log(JSON.stringify({ ok: true, path: outPath, mode, slug, app_dir: appDir, bundle_id: bundleId }, null, 2));
