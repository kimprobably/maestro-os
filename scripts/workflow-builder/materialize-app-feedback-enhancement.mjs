#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const outputRoot = resolve(argValue("--output-root", "."));
const mode = argValue("--mode", "write");

function write(relativePath, content) {
  const fullPath = resolve(outputRoot, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.endsWith("\n") ? content : `${content}\n`);
}

function copy(relativePath) {
  const source = resolve(repoRoot, relativePath);
  if (!existsSync(source)) throw new Error(`missing source support file: ${relativePath}`);
  write(relativePath, readFileSync(source, "utf8"));
}

write(
  "feedback/consumer-radar-product-feedback.md",
  `# Consumer Radar Product Feedback

- How do you know what the growth hypothesis is if the Apify key is not set? Did you actually scrape the content?
- Can I see the reviews? They're not surfaced anywhere.
- These are all the biggest in the category. I want fast-growing apps that aren't already the biggest.
- Can I see example content?
- What happens if I want to add more apps to this? Can you add a feature so I can easily make it get more?
`,
);

write(
  "workflows/app-feedback/enhance-app-from-feedback.fabro",
  `digraph AppFeedbackEnhancement {
    graph [
        goal="Enhance an app from product feedback with a reusable spec, implementation, validation, and review workflow",
        persona="app-feedback-workflow-builder",
        inputs="app_dir, feedback_path, target_adapter, real_mode, allow_quality_fallback, minimum_active_reviews",
        outputs="feedback_analysis, enhanced_app, quality_reports, review_consensus, handoff",
        default_max_retries=2,
        retry_target="apply_enhancement",
        fallback_retry_target="apply_enhancement",
        model_stylesheet="
            *       { provider: openrouter; model: anthropic/claude-haiku-4-5; reasoning_effort: low; }
            .review { provider: openrouter; model: google/gemini-3.1-pro-preview; reasoning_effort: high; }
            .cheap  { provider: openrouter; model: deepseek/deepseek-v4-flash; reasoning_effort: low; }
        "
    ]
    rankdir=LR

    start [shape=Mdiamond, label="Start"]
    exit  [shape=Msquare, label="Exit"]

    wait_for_support_files [
        label="Wait For Feedback Support Files",
        shape=parallelogram,
        goal_gate=true,
        retry_target="wait_for_support_files",
        script="for i in $(seq 1 90); do if [ -f scripts/app-feedback/parse-feedback.mjs ] && [ -f scripts/app-feedback/apply-feedback-enhancement.mjs ] && [ -f '{{ inputs.feedback_path|default('feedback/consumer-radar-product-feedback.md') }}' ]; then echo feedback-support-ready; exit 0; fi; sleep 2; done; echo 'missing feedback enhancement support files' >&2; exit 1"
    ]

    parse_feedback [
        label="Parse Product Feedback",
        shape=parallelogram,
        goal_gate=true,
        retry_target="parse_feedback",
        script="node scripts/app-feedback/parse-feedback.mjs --feedback '{{ inputs.feedback_path|default('feedback/consumer-radar-product-feedback.md') }}' --out .workflow/app-feedback/feedback-analysis.json"
    ]

    spec_kitty_feedback_gate [
        label="Spec Kitty Feedback Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="parse_feedback",
        script="node scripts/app-feedback/spec-kitty-feedback-gate.mjs --analysis .workflow/app-feedback/feedback-analysis.json --out .workflow/app-feedback/spec-kitty-feedback-gate.json --target '{{ inputs.target_adapter|default('consumer-radar') }}'"
    ]

    apply_enhancement [
        label="Apply Feedback Enhancement",
        shape=parallelogram,
        class="cheap",
        goal_gate=true,
        retry_target="apply_enhancement",
        script="node scripts/app-feedback/apply-feedback-enhancement.mjs --target '{{ inputs.target_adapter|default('consumer-radar') }}' --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --feedback '{{ inputs.feedback_path|default('feedback/consumer-radar-product-feedback.md') }}'"
    ]

    native_checks [
        label="Native Checks",
        shape=parallelogram,
        goal_gate=true,
        retry_target="apply_enhancement",
        script="node scripts/consumer-radar/run-native-checks.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}'"
    ]

    product_surface_gate [
        label="Product Surface Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="apply_enhancement",
        script="node scripts/consumer-radar/assert-product-surface.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}'"
    ]

    feedback_acceptance_gate [
        label="Feedback Acceptance Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="apply_enhancement",
        script="node scripts/app-feedback/assert-feedback-enhancement.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --target '{{ inputs.target_adapter|default('consumer-radar') }}'"
    ]

    qlty_gate [
        label="Qlty Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="apply_enhancement",
        script="node scripts/consumer-radar/qlty-gate.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --real-mode '{{ inputs.real_mode|default('true') }}' --allow-fallback '{{ inputs.allow_quality_fallback|default('false') }}'"
    ]

    promptfoo_gate [
        label="Promptfoo Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="apply_enhancement",
        script="node scripts/consumer-radar/promptfoo-or-fallback.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --real-mode '{{ inputs.real_mode|default('true') }}' --allow-fallback '{{ inputs.allow_quality_fallback|default('false') }}'"
    ]

    prepare_review_reports [
        label="Prepare Review Reports",
        shape=parallelogram,
        goal_gate=true,
        retry_target="promptfoo_gate",
        script="rm -rf reports/consumer-radar/reviews reports/consumer-radar/review-consensus.json && mkdir -p reports/consumer-radar/reviews"
    ]

    review_fanout [shape=component, label="Parallel Feedback Review Fanout"]
    review_kimi [
        label="Kimi Product Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model moonshotai/kimi-k2.6 --role feedback_product_strategy --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --output reports/consumer-radar/reviews/kimi-feedback.json --real-mode '{{ inputs.real_mode|default('true') }}'"
    ]
    review_qwen [
        label="Qwen Implementation Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model qwen/qwen3.6-plus --role feedback_implementation_quality --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --output reports/consumer-radar/reviews/qwen-feedback.json --real-mode '{{ inputs.real_mode|default('true') }}'"
    ]
    review_deepseek [
        label="DeepSeek Simplification Review",
        class="cheap",
        shape=parallelogram,
        script="node scripts/consumer-radar/openrouter-review.mjs --model deepseek/deepseek-v4-pro,deepseek/deepseek-v4-flash --role feedback_simplification_and_ci --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --output reports/consumer-radar/reviews/deepseek-feedback.json --real-mode '{{ inputs.real_mode|default('true') }}'"
    ]
    review_join [shape=tripleoctagon, label="Review Join", join_policy="wait_all"]

    review_consensus [
        label="Review Consensus",
        shape=parallelogram,
        goal_gate=true,
        retry_target="apply_enhancement",
        script="node scripts/consumer-radar/review-consensus.mjs --reviews reports/consumer-radar/reviews --output reports/consumer-radar/review-consensus.json --minimum-active-reviews '{{ inputs.minimum_active_reviews|default('2') }}'"
    ]

    artifact_gate [
        label="Artifact Gate",
        shape=parallelogram,
        goal_gate=true,
        retry_target="apply_enhancement",
        script="node scripts/consumer-radar/validate-build-artifacts.mjs '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --minimum-apps 6 --minimum-reports 4 && test -f .workflow/app-feedback/feedback-acceptance.json"
    ]

    publish_handoff [
        label="Publish Handoff",
        shape=parallelogram,
        goal_gate=true,
        retry_target="review_consensus",
        script="node scripts/app-feedback/publish-feedback-handoff.mjs --app-dir '{{ inputs.app_dir|default('apps/generated-consumer-app-radar') }}' --out .workflow/app-feedback/handoff.json"
    ]

    start -> wait_for_support_files
    wait_for_support_files -> parse_feedback [condition="outcome=succeeded"]
    wait_for_support_files -> wait_for_support_files [label="Retry", loop_restart=true]
    parse_feedback -> spec_kitty_feedback_gate [condition="outcome=succeeded"]
    parse_feedback -> parse_feedback [label="Retry", loop_restart=true]
    spec_kitty_feedback_gate -> apply_enhancement [condition="outcome=succeeded"]
    spec_kitty_feedback_gate -> parse_feedback [label="Fix"]
    apply_enhancement -> native_checks [condition="outcome=succeeded"]
    apply_enhancement -> apply_enhancement [label="Retry", loop_restart=true]
    native_checks -> product_surface_gate [condition="outcome=succeeded"]
    native_checks -> apply_enhancement [label="Fix"]
    product_surface_gate -> feedback_acceptance_gate [condition="outcome=succeeded"]
    product_surface_gate -> apply_enhancement [label="Fix"]
    feedback_acceptance_gate -> qlty_gate [condition="outcome=succeeded"]
    feedback_acceptance_gate -> apply_enhancement [label="Fix"]
    qlty_gate -> promptfoo_gate [condition="outcome=succeeded"]
    qlty_gate -> apply_enhancement [label="Fix"]
    promptfoo_gate -> prepare_review_reports [condition="outcome=succeeded"]
    promptfoo_gate -> apply_enhancement [label="Fix"]
    prepare_review_reports -> review_fanout [condition="outcome=succeeded"]
    prepare_review_reports -> promptfoo_gate [label="Fix"]
    review_fanout -> review_kimi
    review_fanout -> review_qwen
    review_fanout -> review_deepseek
    review_kimi -> review_join
    review_qwen -> review_join
    review_deepseek -> review_join
    review_join -> review_consensus
    review_consensus -> artifact_gate [condition="outcome=succeeded"]
    review_consensus -> apply_enhancement [label="Fix"]
    artifact_gate -> publish_handoff [condition="outcome=succeeded"]
    artifact_gate -> apply_enhancement [label="Fix"]
    publish_handoff -> exit [condition="outcome=succeeded"]
    publish_handoff -> review_consensus [label="Fix"]
}
`,
);

write(
  "workflows/app-feedback/enhance-app-from-feedback.consumer-radar.toml",
  `_version = 1

[workflow]
graph = "enhance-app-from-feedback.fabro"

[run]
goal = "Enhance Consumer App Radar from product feedback using the generic app feedback workflow"

[run.inputs]
app_dir = "apps/generated-consumer-app-radar"
feedback_path = "feedback/consumer-radar-product-feedback.md"
target_adapter = "consumer-radar"
real_mode = true
allow_quality_fallback = true
minimum_active_reviews = 2

[run.sandbox]
provider = "daytona"
preserve = true
stop_on_terminal = true

[run.sandbox.daytona]
auto_stop_interval = 60
`,
);

write(
  "docs/APP-FEEDBACK-ENHANCEMENT-WORKFLOW.md",
  `# App Feedback Enhancement Workflow

This workflow turns product feedback into a bounded enhancement loop that can be reused across apps:

1. Parse feedback into acceptance checks.
2. Produce a Spec Kitty-compatible feedback gate artifact.
3. Dispatch a target-specific enhancement adapter.
4. Run native app checks, product surface checks, feedback acceptance checks, Qlty, Promptfoo, and parallel model review.
5. Publish a handoff with the changed app and quality reports.

The first adapter target is \`consumer-radar\`. It addresses the current feedback by making growth provenance explicit, surfacing review samples and example content, penalizing category leaders in ranking, and adding a manual app seed flow.

Run locally:

\`\`\`bash
node scripts/workflow-builder/materialize-app-feedback-enhancement.mjs
node scripts/app-feedback/parse-feedback.mjs --feedback feedback/consumer-radar-product-feedback.md
node scripts/app-feedback/apply-feedback-enhancement.mjs --target consumer-radar --app-dir apps/generated-consumer-app-radar --feedback feedback/consumer-radar-product-feedback.md
node scripts/app-feedback/assert-feedback-enhancement.mjs apps/generated-consumer-app-radar --target consumer-radar
\`\`\`

Run through Fabro:

\`\`\`bash
fabro run workflows/app-feedback/enhance-app-from-feedback.consumer-radar.toml
\`\`\`
`,
);

for (const file of [
  "scripts/app-feedback/parse-feedback.mjs",
  "scripts/app-feedback/spec-kitty-feedback-gate.mjs",
  "scripts/app-feedback/apply-feedback-enhancement.mjs",
  "scripts/app-feedback/apply-consumer-radar-feedback.mjs",
  "scripts/app-feedback/assert-feedback-enhancement.mjs",
  "scripts/app-feedback/publish-feedback-handoff.mjs",
]) {
  copy(file);
}

write(
  ".workflow/workflow-builder/app-feedback-enhancement-report.json",
  JSON.stringify(
    {
      ok: true,
      mode,
      output_root: outputRoot,
      workflow: "workflows/app-feedback/enhance-app-from-feedback.fabro",
      run_config: "workflows/app-feedback/enhance-app-from-feedback.consumer-radar.toml",
      target_adapter: "consumer-radar",
      acceptance_checks: [
        "growth evidence provenance",
        "visible reviews",
        "emerging apps over category leaders",
        "example content",
        "add-app research seed",
      ],
    },
    null,
    2,
  ),
);

console.log(JSON.stringify({ ok: true, output_root: outputRoot, mode }, null, 2));
