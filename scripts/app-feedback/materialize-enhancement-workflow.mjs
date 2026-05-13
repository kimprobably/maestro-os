#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function write(path, content) {
  const fullPath = resolve(path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.endsWith("\n") ? content : `${content}\n`);
}

const target = argValue("--target", "consumer-radar");
const appDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const workflowPath = argValue("--workflow", "workflows/consumer-radar/live-enrichment.fabro");
const runConfigPath = argValue("--run-config", "workflows/consumer-radar/live-enrichment.toml");
const realMode = argValue("--real-mode", "true");
const allowFixtureFallback = argValue("--allow-fixture-fallback", "false");

if (target !== "consumer-radar") {
  throw new Error(`Unsupported generated enhancement target: ${target}`);
}

write(
  "specs/consumer-radar/live-enrichment-spec.md",
  `# Consumer Radar Live Enrichment Spec

## Goal

Replace fixture-only Consumer Radar enhancement behavior with a real live enrichment path.

## Required Behavior

- Discover additional US iPhone app candidates from live sources.
- Use Apify for App Store and social content scraping when credentials are present.
- Use Apple review ingestion for visible review samples.
- Mark rows as live only when live evidence was scraped.
- Fail real mode when APIFY_TOKEN is missing and allow_fixture_fallback=false.
- Add UI/API controls to fetch more apps.
- Preserve fixture fallback only as an explicitly disclosed offline mode.

## Non-Cheating Acceptance

- Notes or disclosure text alone do not satisfy this spec.
- A manual seed form alone does not satisfy "get more apps".
- A liveScraped=true value is invalid without source evidence.
- The live_data_gate must fail if no live apps, reviews, or social examples are produced in real mode.

## Quality Gates

- Test-driven development before implementation.
- Eval-driven review for source realism, ranking quality, and workflow quality.
- Code simplification before final review.
`,
);

write(
  workflowPath,
  `digraph ConsumerRadarLiveEnrichment {
    graph [
        goal="Implement real Consumer Radar live discovery and enrichment from evaluated enhancement spec",
        persona="consumer-radar-live-enrichment-builder",
        inputs="app_dir, real_mode, allow_fixture_fallback, minimum_live_apps, minimum_review_samples, minimum_social_examples, minimum_active_reviews",
        outputs="live_enriched_app, live_data_report, review_consensus, handoff",
        default_max_retries=2,
        retry_target="implement_live_enrichment",
        fallback_retry_target="implementation_plan_fanout",
        model_stylesheet="
            *          { provider: openrouter; model: anthropic/claude-haiku-4-5; reasoning_effort: low; }
            .coding    { provider: openrouter; model: qwen/qwen3.6-plus; reasoning_effort: high; }
            .review    { provider: openrouter; model: google/gemini-3.1-pro-preview; reasoning_effort: high; }
            .cheap     { provider: openrouter; model: deepseek/deepseek-v4-flash; reasoning_effort: low; }
        "
    ]
    rankdir=LR

    start [shape=Mdiamond, label="Start"]
    exit  [shape=Msquare, label="Exit"]

    live_source_preflight [
        label="Live Source Preflight",
        shape=parallelogram,
        goal_gate=true,
        retry_target="live_source_preflight",
        script="node scripts/app-feedback/live-source-preflight.mjs --app-dir '{{ inputs.app_dir|default('${appDir}') }}' --real-mode '{{ inputs.real_mode|default('${realMode}') }}' --allow-fixture-fallback '{{ inputs.allow_fixture_fallback|default('${allowFixtureFallback}') }}' --out .workflow/consumer-radar-live-enrichment/source-preflight.json"
    ]

    implementation_plan_fanout [shape=component, label="Implementation Plan Fanout"]
    plan_live_sources [
        label="Plan Live Sources",
        class="coding",
        prompt="@../../prompts/app-feedback/live-enrichment-plan-a.md"
    ]
    plan_product_surface [
        label="Plan Product Surface",
        class="coding",
        prompt="@../../prompts/app-feedback/live-enrichment-plan-b.md"
    ]
    plan_join [shape=tripleoctagon, label="Plan Join", join_policy="wait_all"]

    plan_eval [
        label="Plan Eval",
        shape=parallelogram,
        goal_gate=true,
        retry_target="implementation_plan_fanout",
        script="node scripts/app-feedback/evaluate-enhancement-artifact.mjs --stage workflow --candidates .workflow/consumer-radar-live-enrichment/plans --out .workflow/consumer-radar-live-enrichment/plan-eval.json --minimum-candidates 2 --minimum-eval-score 0.72"
    ]

    implement_live_enrichment [
        label="Implement Live Enrichment",
        class="coding",
        goal_gate=true,
        retry_target="implement_live_enrichment",
        prompt="@../../prompts/app-feedback/live-enrichment-implementation.md"
    ]

    native_checks [
        label="Native Checks",
        shape=parallelogram,
        goal_gate=true,
        retry_target="implement_live_enrichment",
        script="node scripts/consumer-radar/run-native-checks.mjs '{{ inputs.app_dir|default('${appDir}') }}'"
    ]

    live_data_gate [
        label="Live Data Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="implement_live_enrichment",
        script="node scripts/consumer-radar/assert-live-enrichment.mjs '{{ inputs.app_dir|default('${appDir}') }}' --real-mode '{{ inputs.real_mode|default('${realMode}') }}' --allow-fixture-fallback '{{ inputs.allow_fixture_fallback|default('${allowFixtureFallback}') }}' --minimum-live-apps '{{ inputs.minimum_live_apps|default('8') }}' --minimum-review-samples '{{ inputs.minimum_review_samples|default('12') }}' --minimum-social-examples '{{ inputs.minimum_social_examples|default('8') }}'"
    ]

    simplification [
        label="Code Simplification",
        class="review",
        goal_gate=true,
        retry_target="simplification",
        prompt="@../../prompts/app-feedback/simplification-plan.md"
    ]

    qlty_gate [
        label="Qlty Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="simplification",
        script="node scripts/consumer-radar/qlty-gate.mjs '{{ inputs.app_dir|default('${appDir}') }}' --real-mode '{{ inputs.real_mode|default('${realMode}') }}' --allow-fallback '{{ inputs.allow_fixture_fallback|default('${allowFixtureFallback}') }}'"
    ]

    promptfoo_gate [
        label="Promptfoo Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="simplification",
        script="node scripts/consumer-radar/promptfoo-or-fallback.mjs '{{ inputs.app_dir|default('${appDir}') }}' --real-mode '{{ inputs.real_mode|default('${realMode}') }}' --allow-fallback '{{ inputs.allow_fixture_fallback|default('${allowFixtureFallback}') }}'"
    ]

    prepare_review_reports [
        label="Prepare Review Reports",
        shape=parallelogram,
        goal_gate=true,
        retry_target="promptfoo_gate",
        script="rm -rf reports/consumer-radar/live-enrichment-reviews && mkdir -p reports/consumer-radar/live-enrichment-reviews"
    ]

    review_fanout [shape=component, label="Parallel Live Enrichment Review Fanout"]
    review_kimi [
        label="Kimi Source Strategy Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model moonshotai/kimi-k2.6 --role live_source_strategy --app-dir '{{ inputs.app_dir|default('${appDir}') }}' --output reports/consumer-radar/live-enrichment-reviews/kimi.json --real-mode '{{ inputs.real_mode|default('${realMode}') }}'"
    ]
    review_qwen [
        label="Qwen Implementation Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model qwen/qwen3.6-plus --role live_enrichment_implementation --app-dir '{{ inputs.app_dir|default('${appDir}') }}' --output reports/consumer-radar/live-enrichment-reviews/qwen.json --real-mode '{{ inputs.real_mode|default('${realMode}') }}'"
    ]
    review_deepseek [
        label="DeepSeek Simplification Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model deepseek/deepseek-v4-pro,deepseek/deepseek-v4-flash --role simplification_and_ci --app-dir '{{ inputs.app_dir|default('${appDir}') }}' --output reports/consumer-radar/live-enrichment-reviews/deepseek.json --real-mode '{{ inputs.real_mode|default('${realMode}') }}'"
    ]
    review_join [shape=tripleoctagon, label="Review Join", join_policy="wait_all"]

    review_consensus [
        label="Review Consensus",
        shape=parallelogram,
        goal_gate=true,
        retry_target="simplification",
        script="node scripts/consumer-radar/review-consensus.mjs --reviews reports/consumer-radar/live-enrichment-reviews --output reports/consumer-radar/live-enrichment-review-consensus.json --minimum-active-reviews '{{ inputs.minimum_active_reviews|default('2') }}'"
    ]

    publish_handoff [
        label="Publish Handoff",
        shape=parallelogram,
        goal_gate=true,
        retry_target="review_consensus",
        script="node scripts/app-feedback/publish-enhancement-discovery-handoff.mjs --app-dir '{{ inputs.app_dir|default('${appDir}') }}' --generated-workflow workflows/consumer-radar/live-enrichment.fabro --out .workflow/consumer-radar-live-enrichment/handoff.json"
    ]

    start -> live_source_preflight
    live_source_preflight -> implementation_plan_fanout [condition="outcome=succeeded"]
    live_source_preflight -> live_source_preflight [label="Retry", loop_restart=true]
    implementation_plan_fanout -> plan_live_sources
    implementation_plan_fanout -> plan_product_surface
    plan_live_sources -> plan_join
    plan_product_surface -> plan_join
    plan_join -> plan_eval
    plan_eval -> implement_live_enrichment [condition="outcome=succeeded"]
    plan_eval -> implementation_plan_fanout [label="Replan"]
    implement_live_enrichment -> native_checks [condition="outcome=succeeded"]
    implement_live_enrichment -> implement_live_enrichment [label="Retry", loop_restart=true]
    native_checks -> live_data_gate [condition="outcome=succeeded"]
    native_checks -> implement_live_enrichment [label="Fix"]
    live_data_gate -> simplification [condition="outcome=succeeded"]
    live_data_gate -> implement_live_enrichment [label="Fix"]
    simplification -> qlty_gate [condition="outcome=succeeded"]
    simplification -> simplification [label="Retry", loop_restart=true]
    qlty_gate -> promptfoo_gate [condition="outcome=succeeded"]
    qlty_gate -> simplification [label="Fix"]
    promptfoo_gate -> prepare_review_reports [condition="outcome=succeeded"]
    promptfoo_gate -> simplification [label="Fix"]
    prepare_review_reports -> review_fanout [condition="outcome=succeeded"]
    prepare_review_reports -> promptfoo_gate [label="Fix"]
    review_fanout -> review_kimi
    review_fanout -> review_qwen
    review_fanout -> review_deepseek
    review_kimi -> review_join
    review_qwen -> review_join
    review_deepseek -> review_join
    review_join -> review_consensus
    review_consensus -> publish_handoff [condition="outcome=succeeded"]
    review_consensus -> simplification [label="Fix"]
    publish_handoff -> exit [condition="outcome=succeeded"]
    publish_handoff -> review_consensus [label="Fix"]
}
`,
);

write(
  runConfigPath,
  `_version = 1

[workflow]
graph = "live-enrichment.fabro"

[run]
goal = "Implement Consumer Radar live discovery and enrichment with strict real-data gates"

[run.inputs]
app_dir = "${appDir}"
real_mode = ${realMode}
allow_fixture_fallback = ${allowFixtureFallback}
minimum_live_apps = 8
minimum_review_samples = 12
minimum_social_examples = 8
minimum_active_reviews = 2

[run.sandbox]
provider = "daytona"
preserve = true
stop_on_terminal = true

[run.sandbox.env]
APIFY_TOKEN = "\${{ secrets.APIFY_TOKEN }}"
APIFY_APPSTORE_ACTOR = "\${{ secrets.APIFY_APPSTORE_ACTOR }}"
APIFY_TIKTOK_ACTOR = "\${{ secrets.APIFY_TIKTOK_ACTOR }}"
APIFY_INSTAGRAM_ACTOR = "\${{ secrets.APIFY_INSTAGRAM_ACTOR }}"
OPENROUTER_API_KEY = "\${{ secrets.OPENROUTER_API_KEY }}"

[run.sandbox.daytona]
auto_stop_interval = 60
`,
);

const report = {
  ok: true,
  target,
  app_dir: appDir,
  workflow: "workflows/consumer-radar/live-enrichment.fabro",
  workflow_path: workflowPath,
  run_config: runConfigPath,
  real_mode: realMode === "true",
  allow_fixture_fallback: allowFixtureFallback === "true",
  required_gates: ["live_data_gate", "native_checks", "qlty_gate", "promptfoo_gate", "review_fanout", "simplification"],
};

mkdirSync(".workflow/enhancement-discovery", { recursive: true });
writeFileSync(
  ".workflow/enhancement-discovery/materialized-workflow.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
