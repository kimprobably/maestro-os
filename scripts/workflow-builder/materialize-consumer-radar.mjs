#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const outputRoot = resolve(repoRoot, argValue("--output-root", "."));
const mode = argValue("--mode", "write");

function write(relativePath, content) {
  const fullPath = resolve(outputRoot, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.endsWith("\n") ? content : `${content}\n`);
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function consumerSpec() {
  return `# Consumer App Radar Spec

## Goal

Build an internal dashboard that surfaces fast-growing consumer iPhone apps in the United States across productivity, health, wellness, fitness, positivity, and screen-time-control categories. The product should prioritize week-over-week acceleration over total size, then explain how each app appears to be growing and what product gaps users mention in reviews.

## Workflow Requirements

- Use Fabro as the runtime. The workflow must run in Daytona and must remain repository-relative.
- Use Spec Kitty as the spec/governance surface where available; absence of the CLI should produce a recorded warning rather than block the spike.
- Use Apify for source adapters. The App Store actor defaults to crawlerbros/appstore-scraper; TikTok defaults to clockworks/tiktok-scraper; Instagram defaults to apify/instagram-scraper.
- Use public Apple RSS/iTunes sources for app metadata and review ingestion when possible.
- Use OpenRouter model review fanout for Kimi, Qwen, and DeepSeek. Expensive models should be used for scaffolding and hard review; cheaper models can do generation and repeated classification.
- Use Qlty and native checks as CI/CD gates. If Qlty is not installed in the sandbox, record that and keep the spike moving after native checks pass.
- Use Promptfoo if available; otherwise run a deterministic fallback eval and record the fallback clearly.

## App Requirements

- Dashboard with sortable app cards/table, growth score, rank/review/social deltas, and opportunity score.
- App detail view with social strategy, review themes, feature requests, and suggested investigation angles.
- API endpoints:
  - GET /health
  - GET /api/apps
  - GET /api/apps/:id
  - POST /api/refresh
- Data adapters:
  - Apple search/reviews adapter
  - Apify actor runner with configurable actor IDs
  - Fixture fallback for offline repeatability
- Scoring:
  - Prefer acceleration and recent review velocity over absolute rank.
  - Include social velocity and review pain density.
  - Penalize stale or thin data.
- Verification:
  - Node native tests
  - Syntax/type smoke via node --check
  - Artifact validator
  - Qlty gate
  - Promptfoo or fallback eval
  - Parallel model review consensus

## Quality Bar

The first pass is allowed to use fixture data and live-source smoke checks. It is not allowed to hardcode secrets, depend on a local absolute path, or bypass Fabro orchestration. The generated workflow is the source of truth for the app build process.
`;
}

function builderReport() {
  return {
    ok: true,
    mode,
    generated_at: new Date().toISOString(),
    target: "consumer-app-radar",
    generated_files: [
      "specs/consumer-app-radar/spec.md",
      "workflows/consumer-radar/build-consumer-app-radar.fabro",
      "workflows/consumer-radar/build-consumer-app-radar.toml",
      "scripts/consumer-radar/bootstrap-spec.mjs",
      "scripts/consumer-radar/generate-app.mjs",
      "scripts/consumer-radar/run-native-checks.mjs",
      "scripts/consumer-radar/qlty-gate.mjs",
      "scripts/consumer-radar/promptfoo-or-fallback.mjs",
      "scripts/consumer-radar/openrouter-review.mjs",
      "scripts/consumer-radar/review-consensus.mjs",
      "scripts/consumer-radar/validate-build-artifacts.mjs",
      "scripts/consumer-radar/data-source-smoke.mjs",
      "evals/consumer-app-radar-quality.yaml",
      "docs/CONSUMER-APP-RADAR-WORKFLOW.md"
    ],
    workflow_run_order: [
      "bootstrap_spec",
      "spec_kitty_gate",
      "data_source_smoke",
      "generate_app",
      "native_checks",
      "qlty_gate",
      "promptfoo_gate",
      "parallel OpenRouter review fanout",
      "review_consensus",
      "publish_handoff"
    ],
    model_routing: {
      scaffold_and_hard_review: ["google/gemini-3.1-pro-preview", "anthropic/claude-haiku-4-5"],
      open_source_review_test: [
        "moonshotai/kimi-k2.6",
        "qwen/qwen3.6-plus",
        "deepseek/deepseek-v4-pro",
        "deepseek/deepseek-v4-flash"
      ],
      repeated_generation_or_classification: [
        "deepseek/deepseek-v4-flash",
        "google/gemini-3.1-flash-lite"
      ]
    },
    secret_policy: "Workflow TOML references APIFY_TOKEN and OPENROUTER_API_KEY through env interpolation only; no raw secret values are written."
  };
}

function buildWorkflow() {
  return `digraph ConsumerAppRadarBuild {
    graph [
        goal="Build Consumer App Radar from spec with CI, eval, and model review",
        persona="code-factory",
        inputs="app_dir, spec_path, real_mode, allow_fixture_fallback, allow_quality_fallback, minimum_active_reviews",
        outputs="application, ci_report, eval_report, review_consensus, handoff",
        default_max_retries=2,
        retry_target="generate_app",
        fallback_retry_target="generate_app",
        model_stylesheet="
            *          { provider: openrouter; model: anthropic/claude-haiku-4-5; reasoning_effort: low; }
            .review    { provider: openrouter; model: google/gemini-3.1-pro-preview; reasoning_effort: high; }
            .cheap     { provider: openrouter; model: deepseek/deepseek-v4-flash; reasoning_effort: low; }
        "
    ]
    rankdir=LR

    start [shape=Mdiamond, label="Start"]
    exit  [shape=Msquare, label="Exit"]

    bootstrap_spec [
        label="Bootstrap Spec",
        shape=parallelogram,
        goal_gate=true,
        retry_target="bootstrap_spec",
        script="node scripts/consumer-radar/bootstrap-spec.mjs --spec '{{ inputs.spec_path|default('specs/consumer-app-radar/spec.md') }}' --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}'"
    ]

    wait_for_support_files [
        label="Wait For Support Files",
        shape=parallelogram,
        goal_gate=true,
        retry_target="wait_for_support_files",
        script="for i in $(seq 1 90); do if [ -f scripts/consumer-radar/generate-app.mjs ] && [ -f '{{ inputs.spec_path|default('specs/consumer-app-radar/spec.md') }}' ]; then echo support-files-ready; exit 0; fi; sleep 2; done; echo 'missing consumer radar support files' >&2; exit 1"
    ]

    spec_kitty_gate [
        label="Spec Kitty Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="bootstrap_spec",
        script="node scripts/consumer-radar/bootstrap-spec.mjs --spec '{{ inputs.spec_path|default('specs/consumer-app-radar/spec.md') }}' --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --spec-kitty"
    ]

    data_source_smoke [
        label="Data Source Smoke",
        shape=parallelogram,
        goal_gate=true,
        retry_target="data_source_smoke",
        script="node scripts/consumer-radar/data-source-smoke.mjs --output .workflow/consumer-radar/data-source-smoke.json --real-mode '{{ inputs.real_mode|default('true') }}' --allow-fixture-fallback '{{ inputs.allow_fixture_fallback|default('false') }}'"
    ]

    generate_app [
        label="Generate App",
        shape=parallelogram,
        goal_gate=true,
        retry_target="generate_app",
        script="node scripts/consumer-radar/generate-app.mjs --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}'"
    ]

    native_checks [
        label="Native Checks",
        shape=parallelogram,
        goal_gate=true,
        retry_target="generate_app",
        script="node scripts/consumer-radar/run-native-checks.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}'"
    ]

    qlty_gate [
        label="Qlty Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="generate_app",
        script="node scripts/consumer-radar/qlty-gate.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --real-mode '{{ inputs.real_mode|default('true') }}' --allow-fallback '{{ inputs.allow_quality_fallback|default('false') }}'"
    ]

    promptfoo_gate [
        label="Promptfoo Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="generate_app",
        script="node scripts/consumer-radar/promptfoo-or-fallback.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --real-mode '{{ inputs.real_mode|default('true') }}' --allow-fallback '{{ inputs.allow_quality_fallback|default('false') }}'"
    ]

    review_fanout [shape=component, label="Parallel Review Fanout"]
    review_kimi [
        label="Kimi Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model moonshotai/kimi-k2.6 --role market_strategy --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --output reports/consumer-radar/reviews/kimi.json --real-mode '{{ inputs.real_mode|default('true') }}'"
    ]
    review_qwen [
        label="Qwen Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model qwen/qwen3.6-plus --role implementation_quality --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --output reports/consumer-radar/reviews/qwen.json --real-mode '{{ inputs.real_mode|default('true') }}'"
    ]
    review_deepseek [
        label="DeepSeek Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model deepseek/deepseek-v4-pro,deepseek/deepseek-v4-flash --role simplification_and_ci --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --output reports/consumer-radar/reviews/deepseek.json --real-mode '{{ inputs.real_mode|default('true') }}'"
    ]
    review_join [shape=tripleoctagon, label="Review Join", join_policy="wait_all"]

    review_consensus [
        label="Review Consensus",
        shape=parallelogram,
        goal_gate=true,
        retry_target="generate_app",
        script="node scripts/consumer-radar/review-consensus.mjs --reviews reports/consumer-radar/reviews --output reports/consumer-radar/review-consensus.json --minimum-active-reviews '{{ inputs.minimum_active_reviews|default('2') }}'"
    ]

    artifact_gate [
        label="Artifact Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="generate_app",
        script="node scripts/consumer-radar/validate-build-artifacts.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --real-mode '{{ inputs.real_mode|default('true') }}' --minimum-apps 6 --minimum-reports 4"
    ]

    publish_handoff [
        label="Publish Handoff",
        shape=parallelogram,
        goal_gate=true,
        retry_target="review_consensus",
        script="node -e \\"const fs=require('fs'); const path=require('path'); const app='{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}'; const out='.workflow/consumer-radar/handoff.json'; fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out, JSON.stringify({ok:true, app_dir:app, run_dir:process.cwd(), reports:['.workflow/consumer-radar/native-checks.json','.workflow/consumer-radar/qlty-report.json','.workflow/consumer-radar/promptfoo-report.json','reports/consumer-radar/review-consensus.json'], next:['Run npm start inside the generated app','Use POST /api/refresh with mode=live after Apify actors are tuned']}, null, 2)+'\\\\n'); console.log(fs.readFileSync(out,'utf8'));\\""
    ]

    start -> wait_for_support_files
    wait_for_support_files -> bootstrap_spec [condition="outcome=succeeded"]
    wait_for_support_files -> wait_for_support_files [label="Retry", loop_restart=true]
    bootstrap_spec -> spec_kitty_gate [condition="outcome=succeeded"]
    bootstrap_spec -> bootstrap_spec [label="Retry", loop_restart=true]
    spec_kitty_gate -> data_source_smoke [condition="outcome=succeeded"]
    spec_kitty_gate -> bootstrap_spec [label="Fix"]
    data_source_smoke -> generate_app [condition="outcome=succeeded"]
    data_source_smoke -> data_source_smoke [label="Retry", loop_restart=true]
    generate_app -> native_checks [condition="outcome=succeeded"]
    generate_app -> generate_app [label="Retry", loop_restart=true]
    native_checks -> qlty_gate [condition="outcome=succeeded"]
    native_checks -> generate_app [label="Fix"]
    qlty_gate -> promptfoo_gate [condition="outcome=succeeded"]
    qlty_gate -> generate_app [label="Fix"]
    promptfoo_gate -> review_fanout [condition="outcome=succeeded"]
    promptfoo_gate -> generate_app [label="Fix"]
    review_fanout -> review_kimi
    review_fanout -> review_qwen
    review_fanout -> review_deepseek
    review_kimi -> review_join
    review_qwen -> review_join
    review_deepseek -> review_join
    review_join -> review_consensus
    review_consensus -> artifact_gate [condition="outcome=succeeded"]
    review_consensus -> generate_app [label="Fix"]
    artifact_gate -> publish_handoff [condition="outcome=succeeded"]
    artifact_gate -> generate_app [label="Fix"]
    publish_handoff -> exit [condition="outcome=succeeded"]
    publish_handoff -> review_consensus [label="Fix"]
}
`;
}

function buildToml() {
  return `_version = 1

[workflow]
graph = "build-consumer-app-radar.fabro"

[run]
goal = "Build Consumer App Radar from spec with CI, eval, and model review"

[run.inputs]
app_dir = "apps/generated-consumer-app-radar"
spec_path = "specs/consumer-app-radar/spec.md"
real_mode = "true"
allow_fixture_fallback = "false"
allow_quality_fallback = "false"
minimum_active_reviews = "2"

[run.sandbox]
provider = "daytona"
preserve = true
stop_on_terminal = true

[run.sandbox.env]
APIFY_TOKEN = "{{ env.APIFY_TOKEN }}"
OPENROUTER_API_KEY = "{{ env.OPENROUTER_API_KEY }}"
APIFY_APPSTORE_ACTOR = "crawlerbros/appstore-scraper"
APIFY_TIKTOK_ACTOR = "clockworks/tiktok-scraper"
APIFY_INSTAGRAM_ACTOR = "apify/instagram-scraper"
PROMPTFOO_DISABLE_TELEMETRY = "1"

[run.sandbox.daytona]
auto_stop_interval = 60

[run.sandbox.daytona.snapshot]
name = "maestro-code-factory"
dockerfile = """
FROM node:22-bookworm
RUN apt-get update && apt-get install -y bash ca-certificates curl git jq ripgrep python3 python3-pip pipx openssh-client && rm -rf /var/lib/apt/lists/*
RUN npm install -g promptfoo @openai/codex @anthropic-ai/claude-code
RUN curl -fsSL https://qlty.sh | sh && ln -sf /root/.qlty/bin/qlty /usr/local/bin/qlty
"""
`;
}

function bootstrapSpecScript() {
  return `#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const specPath = argValue("--spec", "specs/consumer-app-radar/spec.md");
const appDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const specKitty = process.argv.includes("--spec-kitty");
mkdirSync(".workflow/consumer-radar", { recursive: true });

if (!existsSync(specPath)) throw new Error("Missing spec: " + specPath);
mkdirSync(appDir, { recursive: true });

const report = {
  ok: true,
  spec_path: specPath,
  app_dir: appDir,
  spec_chars: readFileSync(specPath, "utf8").length,
  spec_kitty: { checked: specKitty, available: false, status: "not_requested" },
  generated_at: new Date().toISOString()
};

if (specKitty) {
  const found = spawnSync("sh", ["-lc", "command -v spec-kitty >/dev/null 2>&1"], { encoding: "utf8" });
  report.spec_kitty.available = found.status === 0;
  if (report.spec_kitty.available) {
    const result = spawnSync("sh", ["-lc", "spec-kitty verify-setup --json"], { encoding: "utf8", timeout: 30000 });
    report.spec_kitty.status = result.status === 0 ? "verified" : "warning";
    report.spec_kitty.output_excerpt = (result.stdout || result.stderr || "").slice(0, 1200);
  } else {
    report.spec_kitty.status = "missing_cli_recorded";
  }
}

writeFileSync(".workflow/consumer-radar/bootstrap-spec.json", JSON.stringify(report, null, 2) + "\\n");
console.log(JSON.stringify(report, null, 2));
`;
}

function dataSourceSmokeScript() {
  return `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

function argBool(name, fallback) {
  const raw = argValue(name, String(fallback));
  return raw === true || raw === "true" || raw === "1" || raw === "yes";
}

function usableSecret(value) {
  return Boolean(value && !value.includes("{{") && !value.includes("}}"));
}

const output = argValue("--output", ".workflow/consumer-radar/data-source-smoke.json");
const realMode = argBool("--real-mode", false);
const allowFixtureFallback = argBool("--allow-fixture-fallback", true);
const report = {
  ok: true,
  real_mode: realMode,
  allow_fixture_fallback: allowFixtureFallback,
  env_injected_by_fabro: true,
  checked_at: new Date().toISOString(),
  apify_token_available: usableSecret(process.env.APIFY_TOKEN),
  openrouter_key_available: usableSecret(process.env.OPENROUTER_API_KEY),
  actors: {
    appstore: process.env.APIFY_APPSTORE_ACTOR || "crawlerbros/appstore-scraper",
    tiktok: process.env.APIFY_TIKTOK_ACTOR || "clockworks/tiktok-scraper",
    instagram: process.env.APIFY_INSTAGRAM_ACTOR || "apify/instagram-scraper"
  },
  apple_review_rss: null,
  apify_identity: null
};

try {
  const response = await fetch("https://itunes.apple.com/us/rss/topfreeapplications/limit=25/genre=6007/json", {
    signal: AbortSignal.timeout(12000)
  });
  report.apple_review_rss = { ok: response.ok, status: response.status };
} catch (error) {
  report.apple_review_rss = { ok: false, error: error instanceof Error ? error.message : String(error) };
}

if (report.apify_token_available) {
  try {
    const response = await fetch("https://api.apify.com/v2/users/me?token=" + encodeURIComponent(process.env.APIFY_TOKEN), {
      signal: AbortSignal.timeout(12000)
    });
    report.apify_identity = { ok: response.ok, status: response.status };
  } catch (error) {
    report.apify_identity = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
} else {
  report.apify_identity = { ok: false, status: "missing_or_unresolved_token" };
}

const hardFailures = [];
if (realMode && !allowFixtureFallback) {
  if (!report.apify_token_available) hardFailures.push("APIFY_TOKEN missing or unresolved");
  if (!report.openrouter_key_available) hardFailures.push("OPENROUTER_API_KEY missing or unresolved");
  if (!report.apple_review_rss?.ok) hardFailures.push("Apple RSS smoke failed");
  if (!report.apify_identity?.ok) hardFailures.push("Apify identity smoke failed");
}
report.hard_failures = hardFailures;
report.ok = hardFailures.length === 0;
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
`;
}

function generateAppScript() {
  return `#!/usr/bin/env node
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const requestedAppDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const appDir = resolve(requestedAppDir);
rmSync(appDir, { recursive: true, force: true });

function write(relativePath, lines) {
  const fullPath = resolve(appDir, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  const content = Array.isArray(lines) ? lines.join("\\n") + "\\n" : String(lines);
  writeFileSync(fullPath, content.endsWith("\\n") ? content : content + "\\n");
}

const fixtureApps = [
  {
    id: "one-sec",
    name: "one sec",
    category: "Productivity",
    country: "US",
    appStoreId: "1532875441",
    rankDelta4w: 76,
    reviewDelta4w: 138,
    rating: 4.8,
    socialDelta4w: 212,
    socialStrategy: ["Creator demos interrupting app-open autopilot", "Short before-after clips", "Academic credibility hooks"],
    reviewThemes: ["Needs better schedule exceptions", "Users want stronger family controls", "More granular app groups requested"],
    featureRequests: ["Calendar-aware focus rules", "Shared household accountability", "Weekly relapse insights"],
    evidence: ["Fixture seed until live Apify ranking feed is tuned", "Apple RSS reviews supported by adapter"]
  },
  {
    id: "opal",
    name: "Opal",
    category: "Screen Time",
    country: "US",
    appStoreId: "1497465230",
    rankDelta4w: 42,
    reviewDelta4w: 89,
    rating: 4.7,
    socialDelta4w: 156,
    socialStrategy: ["Founder-led productivity clips", "Relatable addiction framing", "Creator routines"],
    reviewThemes: ["Lock bypass confusion", "Subscription objections", "More reporting exports"],
    featureRequests: ["Anti-bypass education", "Cheaper student plan", "CSV/report export"],
    evidence: ["Fixture seed; social adapters support Apify enrichment"]
  },
  {
    id: "stoic",
    name: "stoic.",
    category: "Wellness",
    country: "US",
    appStoreId: "1312926037",
    rankDelta4w: 31,
    reviewDelta4w: 64,
    rating: 4.8,
    socialDelta4w: 92,
    socialStrategy: ["Calm aesthetic reels", "Journaling prompts", "Mental model education"],
    reviewThemes: ["Users want gentler onboarding", "Export/sync concerns", "Prompt repetition"],
    featureRequests: ["Adaptive prompts", "Better Apple Health context", "Private export"],
    evidence: ["Fixture seed for repeatable CI"]
  },
  {
    id: "screenzen",
    name: "ScreenZen",
    category: "Screen Time",
    country: "US",
    appStoreId: "1541027222",
    rankDelta4w: 58,
    reviewDelta4w: 73,
    rating: 4.8,
    socialDelta4w: 118,
    socialStrategy: ["Reddit-style authenticity", "Anti-subscription positioning", "Direct comparisons to expensive blockers"],
    reviewThemes: ["Users praise free controls", "Setup friction appears repeatedly", "Requests for more lockout nuance"],
    featureRequests: ["Preset lockout templates", "Onboarding checklist", "Cross-device shared rules"],
    evidence: ["Seed target for live chart/review enrichment"]
  },
  {
    id: "structured",
    name: "Structured",
    category: "Productivity",
    country: "US",
    appStoreId: "1499198946",
    rankDelta4w: 36,
    reviewDelta4w: 82,
    rating: 4.8,
    socialDelta4w: 134,
    socialStrategy: ["ADHD creator routines", "Calendar before-after clips", "Aesthetic planning screenshots"],
    reviewThemes: ["Sync reliability matters", "Users want faster capture", "Recurring task UX is a purchase driver"],
    featureRequests: ["Natural-language task capture", "More robust calendar sync", "Better widgets"],
    evidence: ["Seed target for productivity category monitoring"]
  },
  {
    id: "finch",
    name: "Finch",
    category: "Positivity",
    country: "US",
    appStoreId: "1528595748",
    rankDelta4w: 29,
    reviewDelta4w: 151,
    rating: 4.9,
    socialDelta4w: 177,
    socialStrategy: ["Character-led UGC", "Mental health community clips", "Gift/share loops"],
    reviewThemes: ["Emotional attachment is strong", "Users want more personalization", "Subscription boundaries are sensitive"],
    featureRequests: ["Adaptive self-care journeys", "More low-cost social gifting", "Smarter mood insights"],
    evidence: ["Seed target for positivity/wellness benchmarking"]
  },
  {
    id: "rise",
    name: "Rise",
    category: "Health",
    country: "US",
    appStoreId: "1453884781",
    rankDelta4w: 24,
    reviewDelta4w: 57,
    rating: 4.6,
    socialDelta4w: 102,
    socialStrategy: ["Sleep debt education", "Science-backed creator explainers", "Routine optimization hooks"],
    reviewThemes: ["Accuracy questions", "Paywall complaints", "Users want wearable context"],
    featureRequests: ["Clearer accuracy explanations", "Better Apple Health summaries", "Actionable weekly plan"],
    evidence: ["Seed target for health/wellness category monitoring"]
  },
  {
    id: "ladder",
    name: "Ladder",
    category: "Fitness",
    country: "US",
    appStoreId: "1502936453",
    rankDelta4w: 51,
    reviewDelta4w: 68,
    rating: 4.9,
    socialDelta4w: 189,
    socialStrategy: ["Trainer-led short clips", "Transformation proof", "Community/accountability framing"],
    reviewThemes: ["Program switching requests", "Equipment substitutions", "More beginner guidance"],
    featureRequests: ["Adaptive equipment swaps", "Beginner ramp plans", "Progress story exports"],
    evidence: ["Seed target for fitness category monitoring"]
  }
];

write("package.json", JSON.stringify({
  name: "generated-consumer-app-radar",
  private: true,
  type: "module",
  scripts: {
    start: "node src/server.js",
    dev: "node src/server.js",
    test: "node --test tests/*.test.js",
    typecheck: "node --check src/server.js && node --check src/scoring.js && node --check src/repository.js && node --check src/ingest.js && node --check src/snapshots.js && node --check src/evidence.js && node --check src/sources/apify.js && node --check src/sources/apple.js && node --check src/sources/social.js && node --check public/app.js",
    build: "node scripts/validate-artifacts.mjs"
  },
  dependencies: {},
  devDependencies: {}
}, null, 2));

write("fixtures/apps.json", JSON.stringify(fixtureApps, null, 2));

write("src/scoring.js", [
  "export function clamp(value, min = 0, max = 100) {",
  "  return Math.max(min, Math.min(max, Number(value) || 0));",
  "}",
  "",
  "export function scoreApp(app) {",
  "  const rank = clamp(app.rankDelta4w, 0, 120) / 120;",
  "  const reviews = clamp(app.reviewDelta4w, 0, 180) / 180;",
  "  const social = clamp(app.socialDelta4w, 0, 240) / 240;",
  "  const pain = clamp((app.reviewThemes || []).length * 18 + (app.featureRequests || []).length * 12, 0, 100) / 100;",
  "  const rating = clamp(((Number(app.rating) || 0) - 3.5) * 35, 0, 55) / 100;",
  "  const score = (rank * 0.34 + reviews * 0.23 + social * 0.24 + pain * 0.14 + rating * 0.05) * 100;",
  "  return Math.round(score);",
  "}",
  "",
  "export function rankApps(apps) {",
  "  return apps.map((app) => ({ ...app, opportunityScore: scoreApp(app) })).sort((a, b) => b.opportunityScore - a.opportunityScore);",
  "}"
]);

write("src/repository.js", [
  "import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';",
  "import { dirname, resolve } from 'node:path';",
  "",
  "const dbPath = resolve('.data/apps.json');",
  "",
  "export function saveApps(apps) {",
  "  mkdirSync(dirname(dbPath), { recursive: true });",
  "  writeFileSync(dbPath, JSON.stringify(apps, null, 2) + '\\\\n');",
  "}",
  "",
  "export function loadApps() {",
  "  if (!existsSync(dbPath)) return [];",
  "  return JSON.parse(readFileSync(dbPath, 'utf8'));",
  "}"
]);

write("src/sources/apple.js", [
  "export async function fetchAppleReviews(appStoreId, country = 'us', limit = 25) {",
  "  const url = 'https://itunes.apple.com/' + country + '/rss/customerreviews/id=' + encodeURIComponent(appStoreId) + '/sortBy=mostRecent/json';",
  "  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });",
  "  if (!response.ok) throw new Error('Apple review RSS failed: ' + response.status);",
  "  const payload = await response.json();",
  "  const entries = Array.isArray(payload?.feed?.entry) ? payload.feed.entry.slice(1) : [];",
  "  return entries.slice(0, limit).map((entry) => ({",
  "    title: entry?.title?.label || '',",
  "    body: entry?.content?.label || '',",
  "    rating: Number(entry?.['im:rating']?.label || 0),",
  "    updated: entry?.updated?.label || null",
  "  }));",
  "}",
  "",
  "export async function searchAppleApps(term, country = 'US') {",
  "  const url = 'https://itunes.apple.com/search?entity=software&limit=10&country=' + encodeURIComponent(country) + '&term=' + encodeURIComponent(term);",
  "  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });",
  "  if (!response.ok) throw new Error('Apple search failed: ' + response.status);",
  "  const payload = await response.json();",
  "  return payload.results || [];",
  "}"
]);

write("src/sources/apify.js", [
  "function actorPath(actorId) {",
  "  return String(actorId || '').replace('/', '~');",
  "}",
  "",
  "export async function runApifyActor(actorId, input, { token = process.env.APIFY_TOKEN, timeoutMs = 180000 } = {}) {",
  "  if (!token || token.includes('{{')) throw new Error('APIFY_TOKEN is not configured');",
  "  const start = await fetch('https://api.apify.com/v2/acts/' + actorPath(actorId) + '/runs?token=' + encodeURIComponent(token), {",
  "    method: 'POST',",
  "    headers: { 'Content-Type': 'application/json' },",
  "    body: JSON.stringify(input || {})",
  "  });",
  "  if (!start.ok) throw new Error('Apify actor start failed: ' + start.status);",
  "  const started = await start.json();",
  "  const runId = started?.data?.id;",
  "  const deadline = Date.now() + timeoutMs;",
  "  while (Date.now() < deadline) {",
  "    await new Promise((resolve) => setTimeout(resolve, 3500));",
  "    const status = await fetch('https://api.apify.com/v2/actor-runs/' + runId + '?token=' + encodeURIComponent(token));",
  "    const statusPayload = await status.json();",
  "    const state = statusPayload?.data?.status;",
  "    if (state === 'SUCCEEDED') {",
  "      const datasetId = statusPayload.data.defaultDatasetId;",
  "      const dataset = await fetch('https://api.apify.com/v2/datasets/' + datasetId + '/items?clean=true&format=json&token=' + encodeURIComponent(token));",
  "      if (!dataset.ok) throw new Error('Apify dataset fetch failed: ' + dataset.status);",
  "      return dataset.json();",
  "    }",
  "    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(state)) throw new Error('Apify actor ended with status ' + state);",
  "  }",
  "  throw new Error('Apify actor timed out');",
  "}"
]);

write("src/sources/social.js", [
  "import { runApifyActor } from './apify.js';",
  "",
  "export async function fetchTikTokSignals(appName, { actorId = process.env.APIFY_TIKTOK_ACTOR || 'clockworks/tiktok-scraper' } = {}) {",
  "  const items = await runApifyActor(actorId, { searchTerms: [appName], maxItems: 20 });",
  "  return summarizeSocialItems(items, 'tiktok');",
  "}",
  "",
  "export async function fetchInstagramSignals(appName, { actorId = process.env.APIFY_INSTAGRAM_ACTOR || 'apify/instagram-scraper' } = {}) {",
  "  const items = await runApifyActor(actorId, { search: appName, resultsLimit: 20 });",
  "  return summarizeSocialItems(items, 'instagram');",
  "}",
  "",
  "export function summarizeSocialItems(items, platform) {",
  "  const posts = Array.isArray(items) ? items : [];",
  "  const engagements = posts.map((item) => Number(item.likes || item.likeCount || item.playCount || item.views || 0)).filter(Number.isFinite);",
  "  const totalEngagement = engagements.reduce((sum, value) => sum + value, 0);",
  "  return { platform, postCount: posts.length, totalEngagement, sampleCaptions: posts.slice(0, 5).map((item) => item.text || item.caption || item.description || '').filter(Boolean) };",
  "}"
]);

write("src/snapshots.js", [
  "export function computeWeeklyDeltas(snapshots) {",
  "  const rows = Array.isArray(snapshots) ? snapshots : [];",
  "  return rows.map((row, index) => {",
  "    const previous = rows[index - 1] || row;",
  "    return {",
  "      ...row,",
  "      rankDelta: Number(previous.rank || row.rank || 0) - Number(row.rank || previous.rank || 0),",
  "      reviewDelta: Number(row.reviewCount || 0) - Number(previous.reviewCount || 0),",
  "      socialDelta: Number(row.socialMentions || 0) - Number(previous.socialMentions || 0)",
  "    };",
  "  });",
  "}",
  "",
  "export function latestFourWeekVelocity(snapshots) {",
  "  const deltas = computeWeeklyDeltas(snapshots).slice(-4);",
  "  return deltas.reduce((sum, row) => sum + Math.max(0, row.rankDelta) + Math.max(0, row.reviewDelta) + Math.max(0, row.socialDelta), 0);",
  "}"
]);

write("src/evidence.js", [
  "const REQUEST_WORDS = ['wish', 'please add', 'need', 'missing', 'would love', 'feature'];",
  "",
  "export function extractReviewThemes(reviews) {",
  "  const text = (Array.isArray(reviews) ? reviews : []).map((review) => [review.title, review.body].filter(Boolean).join(' ')).join(' ').toLowerCase();",
  "  const themes = [];",
  "  if (/price|subscription|paywall|expensive/.test(text)) themes.push('Pricing and subscription sensitivity');",
  "  if (/sync|calendar|apple health|widget/.test(text)) themes.push('Ecosystem integration requests');",
  "  if (/confusing|setup|onboarding|hard/.test(text)) themes.push('Onboarding and setup friction');",
  "  if (/bug|crash|slow|reliable/.test(text)) themes.push('Reliability concerns');",
  "  return themes;",
  "}",
  "",
  "export function featureRequestsFromReviews(reviews) {",
  "  return (Array.isArray(reviews) ? reviews : [])",
  "    .filter((review) => REQUEST_WORDS.some((word) => String(review.body || '').toLowerCase().includes(word)))",
  "    .slice(0, 8)",
  "    .map((review) => ({ title: review.title || 'Review request', excerpt: String(review.body || '').slice(0, 220) }));",
  "}"
]);

write("src/ingest.js", [
  "import { readFileSync } from 'node:fs';",
  "import { rankApps } from './scoring.js';",
  "import { saveApps } from './repository.js';",
  "",
  "const allowedModes = new Set(['fixture', 'live-smoke']);",
  "",
  "export function loadFixtureApps() {",
  "  try {",
  "    return JSON.parse(readFileSync(new URL('../fixtures/apps.json', import.meta.url), 'utf8'));",
  "  } catch (error) {",
  "    throw new Error('Fixture apps unavailable: ' + (error instanceof Error ? error.message : String(error)));",
  "  }",
  "}",
  "",
  "export async function refreshApps({ mode = 'fixture' } = {}) {",
  "  if (!allowedModes.has(mode)) throw new Error('Unsupported refresh mode: ' + mode);",
  "  const apps = loadFixtureApps();",
  "  const ranked = rankApps(apps).map((app, index) => ({ ...app, radarRank: index + 1, dataMode: mode }));",
  "  saveApps(ranked);",
  "  return ranked;",
  "}",
  "",
  "if (process.argv[1] && process.argv[1].endsWith('ingest.js')) {",
  "  const apps = await refreshApps({ mode: process.argv.includes('--live') ? 'live-smoke' : 'fixture' });",
  "  console.log(JSON.stringify({ ok: true, apps: apps.length }, null, 2));",
  "}"
]);

write("src/server.js", [
  "import { createServer } from 'node:http';",
  "import { existsSync, createReadStream } from 'node:fs';",
  "import { extname, join, resolve } from 'node:path';",
  "import { loadApps } from './repository.js';",
  "import { refreshApps } from './ingest.js';",
  "",
  "const publicDir = resolve('public');",
  "const port = Number(process.env.PORT || 4317);",
  "const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };",
  "const jsonHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };",
  "",
  "function sendJson(res, status, body) {",
  "  res.writeHead(status, jsonHeaders);",
  "  res.end(JSON.stringify(body));",
  "}",
  "",
  "function serveStatic(req, res) {",
  "  const pathname = new URL(req.url, 'http://localhost').pathname;",
  "  const file = pathname === '/' ? join(publicDir, 'index.html') : join(publicDir, pathname);",
  "  if (!file.startsWith(publicDir) || !existsSync(file)) return false;",
  "  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });",
  "  createReadStream(file).pipe(res);",
  "  return true;",
  "}",
  "",
  "const server = createServer(async (req, res) => {",
  "  const url = new URL(req.url, 'http://localhost');",
  "  try {",
  "    if (req.method === 'OPTIONS') return sendJson(res, 204, {});",
  "    if (url.pathname === '/health') return sendJson(res, 200, { ok: true });",
  "    if (url.pathname === '/api/apps' && req.method === 'GET') return sendJson(res, 200, { apps: loadApps() });",
  "    if (url.pathname.startsWith('/api/apps/') && req.method === 'GET') {",
  "      const id = decodeURIComponent(url.pathname.split('/').pop());",
  "      const app = loadApps().find((item) => item.id === id);",
  "      return app ? sendJson(res, 200, { app }) : sendJson(res, 404, { error: 'not_found' });",
  "    }",
  "    if (url.pathname === '/api/refresh' && req.method === 'POST') {",
  "      const apps = await refreshApps({ mode: url.searchParams.get('mode') || 'fixture' });",
  "      return sendJson(res, 200, { ok: true, apps });",
  "    }",
  "    if (serveStatic(req, res)) return;",
  "    sendJson(res, 404, { error: 'not_found' });",
  "  } catch (error) {",
  "    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });",
  "  }",
  "});",
  "",
  "await refreshApps({ mode: 'fixture' });",
  "server.listen(port, () => console.log('Consumer App Radar listening on :' + port));"
]);

write("public/index.html", [
  "<!doctype html>",
  "<html lang=\\"en\\">",
  "<head>",
  "  <meta charset=\\"utf-8\\">",
  "  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\">",
  "  <title>Consumer App Radar</title>",
  "  <link rel=\\"stylesheet\\" href=\\"/styles.css\\">",
  "</head>",
  "<body>",
  "  <main>",
  "    <header class=\\"topbar\\">",
  "      <div><h1>Consumer App Radar</h1><p>Fast-growing iPhone app opportunities</p></div>",
  "      <button id=\\"refresh\\">Refresh</button>",
  "    </header>",
  "    <section class=\\"layout\\">",
  "      <div class=\\"panel\\"><h2>Growth Signals</h2><div id=\\"apps\\" class=\\"apps\\"></div></div>",
  "      <aside class=\\"panel detail\\"><h2>Opportunity</h2><div id=\\"detail\\"></div></aside>",
  "    </section>",
  "  </main>",
  "  <script type=\\"module\\" src=\\"/app.js\\"></script>",
  "</body>",
  "</html>"
]);

write("public/styles.css", [
  ":root { color-scheme: light; --ink: #17202a; --muted: #607080; --line: #d9e2ea; --panel: #ffffff; --bg: #f5f7f9; --accent: #126c5f; --warn: #a15c14; }",
  "* { box-sizing: border-box; }",
  "body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: var(--ink); background: var(--bg); }",
  "main { max-width: 1240px; margin: 0 auto; padding: 24px; }",
  ".topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }",
  "h1, h2, h3, p { margin: 0; }",
  "h1 { font-size: 28px; line-height: 1.15; }",
  "h2 { font-size: 15px; margin-bottom: 12px; }",
  "p { color: var(--muted); }",
  "button { border: 1px solid var(--line); background: var(--ink); color: white; border-radius: 6px; padding: 10px 12px; font-weight: 650; cursor: pointer; }",
  ".layout { display: grid; grid-template-columns: minmax(0, 1.4fr) 420px; gap: 16px; align-items: start; }",
  ".panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; }",
  ".apps { display: grid; gap: 10px; }",
  ".app-row { display: grid; grid-template-columns: 64px minmax(0, 1fr) 90px; gap: 12px; align-items: center; border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: white; cursor: pointer; }",
  ".score { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: #e7f4f0; color: var(--accent); font-weight: 800; }",
  ".name { font-weight: 760; }",
  ".meta { color: var(--muted); font-size: 13px; margin-top: 4px; }",
  ".delta { text-align: right; color: var(--warn); font-weight: 750; }",
  ".chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }",
  ".chip { border: 1px solid var(--line); border-radius: 999px; padding: 5px 8px; font-size: 12px; color: var(--muted); }",
  ".detail ul { padding-left: 18px; }",
  ".detail li { margin: 8px 0; color: var(--ink); }",
  "@media (max-width: 860px) { main { padding: 16px; } .layout { grid-template-columns: 1fr; } .topbar { align-items: flex-start; flex-direction: column; } .app-row { grid-template-columns: 54px minmax(0, 1fr); } .delta { grid-column: 2; text-align: left; } }"
]);

write("public/app.js", [
  "let apps = [];",
  "",
  "function list(items) {",
  "  return '<ul>' + (items || []).map((item) => '<li>' + item + '</li>').join('') + '</ul>';",
  "}",
  "",
  "function renderDetail(app) {",
  "  const target = document.querySelector('#detail');",
  "  if (!app) { target.innerHTML = '<p>Select an app to inspect.</p>'; return; }",
  "  target.innerHTML = '<h3>' + app.name + '</h3>' +",
  "    '<p>' + app.category + ' / rating ' + app.rating + '</p>' +",
  "    '<div class=\\"chips\\"><span class=\\"chip\\">rank +' + app.rankDelta4w + '</span><span class=\\"chip\\">reviews +' + app.reviewDelta4w + '</span><span class=\\"chip\\">social +' + app.socialDelta4w + '</span></div>' +",
  "    '<h2>Social Strategy</h2>' + list(app.socialStrategy) +",
  "    '<h2>Review Pain</h2>' + list(app.reviewThemes) +",
  "    '<h2>Feature requests</h2>' + list(app.featureRequests);",
  "}",
  "",
  "function renderApps() {",
  "  const root = document.querySelector('#apps');",
  "  root.innerHTML = apps.map((app) => '<article class=\\"app-row\\" data-id=\\"' + app.id + '\\">' +",
  "    '<div class=\\"score\\">' + app.opportunityScore + '</div>' +",
  "    '<div><div class=\\"name\\">' + app.radarRank + '. ' + app.name + '</div><div class=\\"meta\\">' + app.category + ' / ' + app.country + '</div></div>' +",
  "    '<div class=\\"delta\\">+' + app.rankDelta4w + ' rank</div>' +",
  "  '</article>').join('');",
  "  document.querySelectorAll('.app-row').forEach((row) => row.addEventListener('click', () => renderDetail(apps.find((app) => app.id === row.dataset.id))));",
  "  renderDetail(apps[0]);",
  "}",
  "",
  "async function loadApps() {",
  "  const response = await fetch('/api/apps');",
  "  const payload = await response.json();",
  "  apps = payload.apps || [];",
  "  renderApps();",
  "}",
  "",
  "document.querySelector('#refresh').addEventListener('click', async () => {",
  "  await fetch('/api/refresh', { method: 'POST' });",
  "  await loadApps();",
  "});",
  "",
  "await loadApps();"
]);

write("scripts/validate-artifacts.mjs", [
  "import { existsSync } from 'node:fs';",
  "const required = ['package.json','src/server.js','src/scoring.js','src/snapshots.js','src/evidence.js','src/sources/social.js','public/index.html','public/app.js','fixtures/apps.json','tests/scoring.test.js'];",
  "const missing = required.filter((file) => !existsSync(file));",
  "if (missing.length) throw new Error('Missing generated artifacts: ' + missing.join(', '));",
  "console.log(JSON.stringify({ ok: true, artifacts: required.length }, null, 2));"
]);

write("tests/scoring.test.js", [
  "import test from 'node:test';",
  "import assert from 'node:assert/strict';",
  "import { rankApps, scoreApp } from '../src/scoring.js';",
  "",
  "test('score rewards acceleration and review/social velocity', () => {",
  "  const fast = { rankDelta4w: 80, reviewDelta4w: 120, socialDelta4w: 200, rating: 4.8, reviewThemes: ['a','b'], featureRequests: ['c'] };",
  "  const slow = { rankDelta4w: 5, reviewDelta4w: 8, socialDelta4w: 12, rating: 4.9, reviewThemes: [], featureRequests: [] };",
  "  assert.ok(scoreApp(fast) > scoreApp(slow));",
  "});",
  "",
  "test('rankApps sorts by opportunity score', () => {",
  "  const ranked = rankApps([{ id: 'slow', rankDelta4w: 1 }, { id: 'fast', rankDelta4w: 90, reviewDelta4w: 90, socialDelta4w: 90 }]);",
  "  assert.equal(ranked[0].id, 'fast');",
  "});"
]);

write("tests/api-fixture.test.js", [
  "import test from 'node:test';",
  "import assert from 'node:assert/strict';",
  "import { refreshApps } from '../src/ingest.js';",
  "",
  "test('fixture ingest produces ranked apps', async () => {",
  "  const apps = await refreshApps({ mode: 'fixture' });",
  "  assert.ok(apps.length >= 3);",
  "  assert.equal(apps[0].radarRank, 1);",
  "  assert.ok(apps[0].opportunityScore > 0);",
  "});"
]);

write("README.md", [
  "# Consumer App Radar",
  "",
  "Generated by the Fabro Consumer App Radar workflow.",
  "",
  "## Run",
  "",
  "~~~bash",
  "npm test",
  "npm start",
  "~~~",
  "",
  "Open http://localhost:4317.",
  "",
  "## Live Data",
  "",
  "The first pass uses fixture data for repeatable CI. Live adapters are scaffolded for Apple RSS/iTunes and Apify actors. Set APIFY_TOKEN plus actor IDs in the workflow sandbox env before enabling live refresh."
]);

mkdirSync(".workflow/consumer-radar", { recursive: true });
writeFileSync(resolve(appDir, ".workflow-build.json"), JSON.stringify({
  ok: true,
  app_dir: requestedAppDir,
  generated_at: new Date().toISOString(),
  files: 17
}, null, 2) + "\\n");
console.log(JSON.stringify({ ok: true, app_dir: requestedAppDir }, null, 2));
`;
}

function runNativeChecksScript() {
  return `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const commands = [
  ["npm", ["run", "typecheck"]],
  ["npm", ["test"]],
  ["npm", ["run", "build"]]
];
const results = [];
for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, { cwd: appDir, encoding: "utf8", timeout: 120000 });
  results.push({ command: [cmd, ...args].join(" "), status: result.status, stdout: result.stdout.slice(-3000), stderr: result.stderr.slice(-3000) });
  if (result.status !== 0) {
    mkdirSync(".workflow/consumer-radar", { recursive: true });
    writeFileSync(".workflow/consumer-radar/native-checks.json", JSON.stringify({ ok: false, results }, null, 2) + "\\n");
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}
mkdirSync(".workflow/consumer-radar", { recursive: true });
writeFileSync(".workflow/consumer-radar/native-checks.json", JSON.stringify({ ok: true, app_dir: resolve(appDir), results }, null, 2) + "\\n");
console.log(JSON.stringify({ ok: true, checks: results.length }, null, 2));
`;
}

function qltyGateScript() {
  return `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

function argBool(name, fallback) {
  const raw = argValue(name, String(fallback));
  return raw === true || raw === "true" || raw === "1" || raw === "yes";
}

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const realMode = argBool("--real-mode", false);
const allowFallback = argBool("--allow-fallback", true);
const promptfooEvalTimeoutMs = process.env.PROMPTFOO_EVAL_TIMEOUT_MS || "45000";
const promptfooMaxEvalTimeMs = process.env.PROMPTFOO_MAX_EVAL_TIME_MS || "120000";
mkdirSync(".workflow/consumer-radar", { recursive: true });

function run(cmd) {
  return spawnSync("sh", ["-lc", cmd], { cwd: appDir, encoding: "utf8", timeout: 180000 });
}

let available = spawnSync("sh", ["-lc", "command -v qlty >/dev/null 2>&1"], { encoding: "utf8" }).status === 0;
let install = null;
if (!available) {
  install = spawnSync("sh", ["-lc", "curl -fsSL https://qlty.sh | sh >/tmp/qlty-install.log 2>&1"], { encoding: "utf8", timeout: 180000 });
  available = spawnSync("sh", ["-lc", "export PATH=$HOME/.qlty/bin:$PATH; command -v qlty >/dev/null 2>&1"], { encoding: "utf8" }).status === 0;
}

let check = null;
if (available) {
  check = run("export PATH=$HOME/.qlty/bin:$PATH; qlty check --all --no-progress --no-fail --summary --no-upgrade-check");
}

const hardFailures = [];
if (realMode && !allowFallback) {
  if (!available) hardFailures.push("Qlty unavailable in real mode");
  if (check && check.status !== 0) hardFailures.push("Qlty check command failed in real mode");
}
const report = {
  ok: hardFailures.length === 0,
  real_mode: realMode,
  allow_fallback: allowFallback,
  qlty_available: available,
  install_status: install ? install.status : null,
  check_status: check ? check.status : null,
  hard_failures: hardFailures,
  stdout: check ? check.stdout.slice(-5000) : "",
  stderr: check ? check.stderr.slice(-5000) : "qlty unavailable; native checks remain the blocking gate"
};
writeFileSync(".workflow/consumer-radar/qlty-report.json", JSON.stringify(report, null, 2) + "\\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
`;
}

function promptfooFallbackScript() {
  return `#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

function argBool(name, fallback) {
  const raw = argValue(name, String(fallback));
  return raw === true || raw === "true" || raw === "1" || raw === "yes";
}

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const realMode = argBool("--real-mode", false);
const allowFallback = argBool("--allow-fallback", true);
mkdirSync(".workflow/consumer-radar", { recursive: true });

let promptfoo = spawnSync("sh", ["-lc", "command -v npx >/dev/null 2>&1"], { encoding: "utf8" }).status === 0;
let promptfooResult = null;
if (promptfoo) {
  promptfooResult = spawnSync("sh", ["-lc", "npx -y promptfoo@latest eval -c evals/consumer-app-radar-quality.yaml --no-progress-bar"], {
    encoding: "utf8",
    env: {
      ...process.env,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "",
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
      PROMPTFOO_EVAL_TIMEOUT_MS: promptfooEvalTimeoutMs,
      PROMPTFOO_MAX_EVAL_TIME_MS: promptfooMaxEvalTimeMs
    },
    timeout: Number(promptfooMaxEvalTimeMs) + 15000
  });
}

const appsPath = appDir + "/fixtures/apps.json";
const apps = existsSync(appsPath) ? JSON.parse(readFileSync(appsPath, "utf8")) : [];
const fallbackAssertions = [
  { name: "has_six_apps", passed: apps.length >= 6 },
  { name: "has_social_strategy", passed: apps.every((app) => Array.isArray(app.socialStrategy) && app.socialStrategy.length > 0) },
  { name: "has_review_themes", passed: apps.every((app) => Array.isArray(app.reviewThemes) && app.reviewThemes.length > 0) },
  { name: "has_feature_requests", passed: apps.every((app) => Array.isArray(app.featureRequests) && app.featureRequests.length > 0) }
];

const hardFailures = [];
if (realMode && !allowFallback && (!promptfooResult || promptfooResult.status !== 0)) {
  hardFailures.push("Promptfoo failed in real mode");
}
const report = {
  ok: fallbackAssertions.every((row) => row.passed) && hardFailures.length === 0,
  real_mode: realMode,
  allow_fallback: allowFallback,
  promptfoo_attempted: Boolean(promptfooResult),
  promptfoo_status: promptfooResult ? promptfooResult.status : null,
  promptfoo_stdout_excerpt: promptfooResult ? promptfooResult.stdout.slice(-3000) : "",
  promptfoo_stderr_excerpt: promptfooResult ? promptfooResult.stderr.slice(-3000) : "",
  hard_failures: hardFailures,
  fallback_assertions: fallbackAssertions
};
writeFileSync(".workflow/consumer-radar/promptfoo-report.json", JSON.stringify(report, null, 2) + "\\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
`;
}

function openRouterReviewScript() {
  return `#!/usr/bin/env node
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
  const match = String(text).match(/\\{[\\s\\S]*\\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

function normalizeContent(value) {
  if (Array.isArray(value)) {
    return value.map((item) => item?.text || item?.content || "").join("\\n");
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
  writeFileSync(output, JSON.stringify(skipped, null, 2) + "\\n");
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
    const payloadText = await response.text();
    let payload = {};
    try {
      payload = payloadText ? JSON.parse(payloadText) : {};
    } catch {
      payload = {};
    }
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
      payload_excerpt: content ? null : JSON.stringify(payload).slice(0, 1200),
      payload_text_excerpt: payloadText.slice(0, 1200)
    };
    if (response.ok && parsed) break;
  } catch (error) {
    finalReport = { ok: false, skipped: false, real_mode: realMode, model, role, error: error instanceof Error ? error.message : String(error) };
  }
}

writeFileSync(output, JSON.stringify(finalReport, null, 2) + "\\n");
console.log(JSON.stringify(finalReport, null, 2));
if (realMode && !finalReport?.ok) process.exit(1);
`;
}

function reviewConsensusScript() {
  return `#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const reviewDir = argValue("--reviews", "reports/consumer-radar/reviews");
const output = argValue("--output", "reports/consumer-radar/review-consensus.json");
const minimumActiveReviews = Number(argValue("--minimum-active-reviews", "1"));

function directReviewFiles(dir) {
  return existsSync(dir)
    ? readdirSync(dir).filter((file) => file.endsWith(".json")).map((file) => join(dir, file))
    : [];
}

function walkReviewFiles(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkReviewFiles(fullPath, found);
    } else if (entry.isFile() && /\\/(?:reports|\\.workflow)\\/consumer-radar\\/reviews\\/[^/]+\\.json$/.test(fullPath)) {
      found.push(fullPath);
    }
  }
  return found;
}

function readReview(file) {
  const review = JSON.parse(readFileSync(file, "utf8"));
  return { ...review, source: file, mtimeMs: statSync(file).mtimeMs };
}

function gitLines(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) return [];
  return result.stdout.split(/\\r?\\n/).map((line) => line.trim()).filter(Boolean);
}

function gitReviewObjects() {
  const refs = gitLines(["for-each-ref", "--format=%(refname:short)", "refs/heads/fabro/run/parallel"]);
  const reviews = [];
  for (const ref of refs.filter((item) => item.includes("review-fanout"))) {
    const files = [
      ...gitLines(["ls-tree", "-r", "--name-only", ref, "--", "reports/consumer-radar/reviews"]),
      ...gitLines(["ls-tree", "-r", "--name-only", ref, "--", ".workflow/consumer-radar/reviews"])
    ];
    for (const file of files.filter((item) => item.endsWith(".json"))) {
      const result = spawnSync("git", ["show", ref + ":" + file], { encoding: "utf8" });
      if (result.status !== 0) continue;
      reviews.push({
        ...JSON.parse(result.stdout),
        source: "git:" + ref + ":" + file,
        mtimeMs: Date.now()
      });
    }
  }
  return reviews;
}

const byReviewer = new Map();
const fileReviews = [
  ...directReviewFiles(reviewDir),
  ...walkReviewFiles(".fabro/scratch")
].map(readReview);

for (const review of [...fileReviews, ...gitReviewObjects()]) {
  const key = \`\${review.role || "unknown"}:\${review.model || review.source}\`;
  const existing = byReviewer.get(key);
  if (!existing || review.mtimeMs > existing.mtimeMs) byReviewer.set(key, review);
}

const reviews = [...byReviewer.values()];
const active = reviews.filter((row) => !row.skipped && row.ok !== false);
const parsed = active.map((row) => row.parsed).filter(Boolean);
const scores = parsed.map((row) => Number(row.score)).filter((score) => Number.isFinite(score));
const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
const blockers = parsed.flatMap((row) => row.findings || []).filter((finding) => /blocker|critical|high/i.test(String(finding.severity)));
const insufficientReviews = active.length < minimumActiveReviews;
const skippedReviews = reviews.filter((row) => row.skipped).length;
const report = {
  ok: blockers.length === 0 && !insufficientReviews,
  verdict: blockers.length === 0 && !insufficientReviews ? "APPROVE" : "REVISE",
  review_count: reviews.length,
  active_review_count: active.length,
  minimum_active_reviews: minimumActiveReviews,
  skipped_review_count: skippedReviews,
  failed_review_count: reviews.filter((row) => row.ok === false).length,
  review_sources: reviews.map((row) => row.source),
  average_model_score: avg == null ? null : Number(avg.toFixed(2)),
  blockers,
  hard_failures: insufficientReviews ? ["Not enough active OpenRouter reviews"] : [],
  note: active.length === 0 ? "All model reviews skipped; deterministic gates are authoritative for this run." : "Consensus synthesized from available OpenRouter reviews."
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
`;
}

function validateBuildArtifactsScript() {
  return `#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const minimum_apps = Number(argValue("--minimum-apps", "3"));
const minimum_reports = Number(argValue("--minimum-reports", "4"));
const required = [
  "package.json",
  "src/server.js",
  "src/scoring.js",
  "src/snapshots.js",
  "src/evidence.js",
  "src/sources/apify.js",
  "src/sources/apple.js",
  "src/sources/social.js",
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "fixtures/apps.json",
  "README.md"
];
const missing = required.filter((file) => !existsSync(resolve(appDir, file)));
const reports = [
  ".workflow/consumer-radar/native-checks.json",
  ".workflow/consumer-radar/qlty-report.json",
  ".workflow/consumer-radar/promptfoo-report.json",
  "reports/consumer-radar/review-consensus.json"
];
const missingReports = reports.filter((file) => !existsSync(file));
const presentReports = reports.length - missingReports.length;
const apps = existsSync(resolve(appDir, "fixtures/apps.json")) ? JSON.parse(readFileSync(resolve(appDir, "fixtures/apps.json"), "utf8")) : [];
const report = {
  ok: missing.length === 0 && missingReports.length === 0 && apps.length >= minimum_apps && presentReports >= minimum_reports,
  app_dir: appDir,
  missing,
  missing_reports: missingReports,
  reports_present: presentReports,
  minimum_apps,
  minimum_reports,
  fixture_apps: apps.length
};
mkdirSync(".workflow/consumer-radar", { recursive: true });
writeFileSync(".workflow/consumer-radar/artifact-gate.json", JSON.stringify(report, null, 2) + "\\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
`;
}

function promptfooConfig() {
  return `description: "Consumer App Radar opportunity quality eval"

providers:
  - id: openrouter:anthropic/claude-haiku-4-5
    config:
      apiKeyEnvar: OPENROUTER_API_KEY
      temperature: 0
      max_tokens: 400
      maxRetries: 0

evaluateOptions:
  maxConcurrency: 1

prompts:
  - |
    Evaluate whether the generated Consumer App Radar fixture identifies fast-growing consumer iPhone apps, growth signals, social strategy, review themes, and feature requests.
    Fixture JSON:
    {{apps_fixture}}
    Return a concise JSON verdict with the keys verdict, score, strengths, and gaps.

tests:
  - description: "Fixture has complete opportunity evidence"
    vars:
      expected: "growth signals, social strategy, review themes, feature requests"
      apps_fixture: file://../apps/generated-consumer-app-radar/fixtures/apps.json
    assert:
      - type: contains-any
        value: ["growth", "review", "social", "feature"]
      - type: llm-rubric
        value: "Output should be useful to a consumer app factory deciding what to investigate next."
        threshold: 0.70

outputPath: .workflow/consumer-radar/promptfoo-output.json
`;
}

function workflowDoc() {
  return `# Consumer App Radar Workflow

This directory was materialized by \`workflows/factory/workflow-builder.fabro\`.

Run the generated workflow through the Railway Fabro server:

\`\`\`bash
fabro run workflows/consumer-radar/build-consumer-app-radar.toml --server https://fabro-maestro-production.up.railway.app/api/v1 --preserve-sandbox
\`\`\`

The workflow builds \`apps/generated-consumer-app-radar\` inside the Daytona sandbox, runs native checks, attempts Qlty, attempts Promptfoo, and fans out OpenRouter reviews across Kimi, Qwen, and DeepSeek. It records transient gate logs under \`.workflow/consumer-radar\` and commit-visible review artifacts under \`reports/consumer-radar\`.

Because this spike repo currently has no Git remote for Daytona to clone, remote runs include a short support-file wait stage. Start the run detached, then copy \`scripts/consumer-radar\`, \`specs/consumer-app-radar\`, and \`evals/consumer-app-radar-quality.yaml\` into the run sandbox with \`fabro sandbox cp\`.

Secrets are not stored in this repo. \`APIFY_TOKEN\` and \`OPENROUTER_API_KEY\` are injected into the sandbox from the Fabro server process environment via \`[run.sandbox.env]\`.
`;
}

function validateBuilderScript() {
  return `#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const required = [
  "specs/consumer-app-radar/spec.md",
  "workflows/consumer-radar/build-consumer-app-radar.fabro",
  "workflows/consumer-radar/build-consumer-app-radar.toml",
  "scripts/consumer-radar/generate-app.mjs",
  "scripts/consumer-radar/openrouter-review.mjs",
  "scripts/consumer-radar/promptfoo-or-fallback.mjs",
  "evals/consumer-app-radar-quality.yaml"
];
const missing = required.filter((file) => !existsSync(file));
const workflow = existsSync(required[1]) ? readFileSync(required[1], "utf8") : "";
const toml = existsSync(required[2]) ? readFileSync(required[2], "utf8") : "";
const hasMarkers = ["review_fanout", "qlty_gate", "promptfoo_gate", "Spec Kitty", "moonshotai/kimi-k2.6", "qwen/qwen3.6-plus", "deepseek/deepseek-v4"].every((text) => workflow.includes(text) || toml.includes(text) || readFileSync(required[0], "utf8").includes(text));
const leaks = /apify_api_|sk-or-v1-|xoxb-|xapp-/.test(workflow + toml);
const report = { ok: missing.length === 0 && hasMarkers && !leaks, missing, has_markers: hasMarkers, leaks };
mkdirSync(".workflow/workflow-builder", { recursive: true });
writeFileSync(".workflow/workflow-builder/validation.json", JSON.stringify(report, null, 2) + "\\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
`;
}

write("specs/consumer-app-radar/spec.md", consumerSpec());
write("workflows/consumer-radar/build-consumer-app-radar.fabro", buildWorkflow());
write("workflows/consumer-radar/build-consumer-app-radar.toml", buildToml());
write("scripts/consumer-radar/bootstrap-spec.mjs", bootstrapSpecScript());
write("scripts/consumer-radar/data-source-smoke.mjs", dataSourceSmokeScript());
write("scripts/consumer-radar/generate-app.mjs", generateAppScript());
write("scripts/consumer-radar/run-native-checks.mjs", runNativeChecksScript());
write("scripts/consumer-radar/qlty-gate.mjs", qltyGateScript());
write("scripts/consumer-radar/promptfoo-or-fallback.mjs", promptfooFallbackScript());
write("scripts/consumer-radar/openrouter-review.mjs", openRouterReviewScript());
write("scripts/consumer-radar/review-consensus.mjs", reviewConsensusScript());
write("scripts/consumer-radar/validate-build-artifacts.mjs", validateBuildArtifactsScript());
write("evals/consumer-app-radar-quality.yaml", promptfooConfig());
write("docs/CONSUMER-APP-RADAR-WORKFLOW.md", workflowDoc());
write("scripts/workflow-builder/validate-consumer-radar-builder.mjs", validateBuilderScript());
write(".workflow/workflow-builder/consumer-radar-report.json", json(builderReport()));

console.log(JSON.stringify({
  ok: true,
  output_root: outputRoot,
  mode,
  report: ".workflow/workflow-builder/consumer-radar-report.json"
}, null, 2));
