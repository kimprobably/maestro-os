Goal: Build Joni Capture, a phone-first iPhone app for capturing rambled LinkedIn ideas, handing them to Joni for draft preparation, monitoring Joni activity and analytics, and supporting an AI content interviewer mode.

## Completed stages
- **run_input_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/run-input-gate.mjs --app-type 'iPhone productivity and creator-operator tool. Read docs/superpowers/specs/2026-05-19-joni-capture-iphone-design.md and contexts/iphone-app-factory/joni-capture/feature-context.md. Build a lock-screen/action-button voice capture app for Joni, the LinkedIn agent. It must capture rambled post ideas, transcribe or queue them, submit through a configurable Joni ingestion client, classify post type, prepare evaluated LinkedIn drafts in Tim voice, show Joni activity and analytics, and include interviewer mode for structured notes. No LinkedIn publishing or mutation.' --target-audience 'Tim Keen and operator-founders who capture ideas on the move and want a private agent-assisted LinkedIn drafting workflow with visible status, draft review, and analytics.' --app-name 'Joni Capture' --bundle-id 'com.maestro.jonicapture' --app-dir 'apps/joni-capture-iphone' --spec-kitty-feature 'joni-capture-iphone-app' --ios-validation-mode 'github' --allow-macos-deferred 'false'`
  - Output:
    ```
    {"ok":true,"inputs":{"app_type":"[present]","target_audience":"[present]","app_name":"Joni Capture","bundle_id":"com.maestro.jonicapture","app_dir":"apps/joni-capture-iphone","spec_kitty_feature":"joni-capture-iphone-app","ios_validation_mode":"github","allow_macos_deferred":"false"},"failures":[]}
    ```
- **bootstrap**: succeeded
  - Script: `node scripts/iphone-app-factory/bootstrap.mjs --app-dir 'apps/joni-capture-iphone' --app-name 'Joni Capture' --bundle-id 'com.maestro.jonicapture' --boilerplate-repo 'SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution'`
  - Output:
    ```
    {"ok":true,"appDir":"apps/joni-capture-iphone","appName":"Joni Capture","bundleId":"com.maestro.jonicapture","boilerplateRepo":"SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution","secretShellGuards":{"installed":true,"path":"/usr/local/bin"},"boilerplateMaterialization":{"status":"materialized","source":"vendor/SwiftAIBoilerplatePro-Distribution.tar.gz","permissionNormalization":{"touched":8799,"errors":[]}},"appleDoubleCleanup":{"removed_count":7114,"remaining_count":0,"errors":[]}}
    ```
- **prompt_quality_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/promptfoo-prompt-quality.mjs --config evals/iphone-app-factory/prompt-quality.yaml --registry evals/iphone-app-factory/prompt-registry.json --out .workflow/iphone-app-factory/evals/prompt-quality.json --allow-fallback true --accepted-risk-promptfoo-failure false`
  - Output:
    ```
    (61 lines omitted)
      "attempted_fallback_accepted": true,
      "accepted_risk_promptfoo_failure": false,
      "skip_promptfoo": false,
      "fallback_used": true,
      "allow_fallback": true,
      "fallback_ok": true,
      "fallback_failures": [],
      "promptfoo_failures": [
        {
          "score": 0.09999999999999999,
          "failure_reason": 1,
          "grading_reason": "The output demonstrates strong reproducibility mechanisms (multi-stage review with consensus, deterministic gates, quality evidence collection, learning loops) but explicitly identifies 3 critical gaps that undermine reproducibility across the full pipeline: (1) no control-plane failure recovery strategy causing silent failures, (2) no hosted macOS CI fallback policy creating ambiguous deferral states, and (3) incomplete artifact handoff verification. These gaps mean the suite cannot reliably produce reproducible quality across overnight runs—partial state can be lost, QA evidence may be missing without clear resolution, and final artifacts may not be properly verified. The evaluation acknowledges strong foundations but concludes these gaps will cause overnight failures, directly contradicting the rubric requirement for reproducible quality across the full pipeline.",
          "component_failures": [
            "Custom function threw error: Unexpected token '#', \"# Evaluati\"... is not valid JSON\nStack Trace: SyntaxError: Unexpected token '#', \"# Evaluati\"... is not valid JSON\n    at JSON.parse (<anonymous>)\n    at eval (eval at handleJavascript (file:///usr/lib/node_modules/promptfoo/dist/src/evaluator-DbOsHSRe.js:2038:34), <anonymous>:3:21)\n    at handleJavascript (file:///usr/lib/node_modules/promptfoo/dist/src/evaluator-DbOsHSRe.js:2038:92)\n    at runAssertion (file:///usr/lib/node_modules/promptfoo/dist/src/evaluator-DbOsHSRe.js:4727:24)\n    at file:///usr/lib/node_modules/promptfoo/dist/src/evaluator-DbOsHSRe.js:4826:24\n    at /usr/lib/node_modules/promptfoo/node_modules/async/dist/async.js:151:38\n    at replenish (/usr/lib/node_modules/promptfoo/node_modules/async/dist/async.js:447:21)\n    at /usr/lib/node_modules/promptfoo/node_modules/async/dist/async.js:452:13\n    at Object.eachOfLimit (/usr/lib/node_modules/promptfoo/node_modules/async/dist/async.js:478:36)\n    at /usr/lib/node_modules/promptfoo/node_modules/async/dist/async.js:220:25\nconst parsed = JSON.parse(output);\nconst requiredKeys = [\"verdict\", \"score\", \"covered\", \"golden_case_results\", \"critical_gaps\", \"gaps\", \"risks\", \"required_artifacts\", \"accepted_risk\"];\nfor (const key of requiredKeys) {\n  if (!(key in parsed)) return { pass: false, reason: `missing ${key}` };\n}\nif (!Array.isArray(parsed.covered)) return { pass: false, reason: \"covered must be an array\" };\nif (!Array.isArray(parsed.golden_case_results)) return { pass: false, reason: \"golden_case_results must be an array\" };\nif (!Array.isArray(parsed.critical_gaps)) return { pass: false, reason: \"critical_gaps must be an array\" };\nif (!Array.isArray(parsed.gaps)) return { pass: false, reason: \"gaps must be an array\" };\nif (!Array.isArray(parsed.risks)) return { pass: false, reason: \"risks must be an array\" };\nif (!Array.isArray(parsed.required_artifacts)) return { pass: false, reason: \"required_artifacts must be an array\" };\nif (parsed.accepted_risk !== false) return { pass: false, reason: \"accepted_risk must be false for overnight runs\" };\nconst requiredCases = [\"spec-lab\", \"boilerplate-first\", \"ios-qa\", \"mobbin-safe\", \"waketask-control-plane\", \"waketask-hosted-ios-evidence\", \"waketask-artifacts-metadata\", \"waketask-review-fan-in\", \"ux-existing-app-intake\", \"ux-mobbin-mcp-safe\", \"ux-design-tournament\", \"ux-screenshot-evidence\", \"ux-postmortem-learning\"];\nconst seenCases = new Set(parsed.golden_case_results.map((entry) => entry.id));\nfor (const id of requiredCases) {\n  if (!seenCases.has(id)) return { pass: false, reason: `missing golden case result ${id}` };\n}\nconst requiredCoverage = [\"spec_lab\", \"boilerplate_reuse\", \"ios_quality\", \"appium_qa\", \"mobbin_safety\", \"release_hardening\", \"mobbin_mcp\", \"design_corpus\", \"adversarial_design\", \"screenshots\", \"accessibility\", \"postmortem\"];\nconst seenCoverage = new Set(parsed.covered);\nfor (const id of requiredCoverage) {\n  if (!seenCoverage.has(id)) return { pass: false, reason: `missing coverage ${id}` };\n}\nconst requiredArtifacts = [\n  \".workflow/iphone-app-ux-studio/research/existing-app-intake.md\",\n  \".workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md\",\n  \".workflow/iphone-app-ux-studio/design/tournament-consensus.json\",\n  \"reports/ios/screenshots/manifest.json\",\n  \".workflow/iphone-app-ux-studio/postmortem.md\",\n];\nconst artifactText = JSON.stringify(parsed.required_artifacts);\nfor (const artifact of requiredArtifacts) {\n  if (!artifactText.includes(artifact)) return { pass: false, reason: `missing required artifact ${artifact}` };\n}\nif (parsed.golden_case_results.some((entry) => entry.pass !== true)) {\n  return { pass: false, reason: \"one or more golden cases failed\" };\n}\nif (parsed.critical_gaps.length > 0) {\n  return { pass: false, reason: `critical gaps present: ${parsed.critical_gaps.join(\", \")}` };\n}\nreturn true;",
            "Expected output to contain all of [spec_lab, boilerplate_reuse, ios_quality, appium_qa, mobbin_safety, release_hardening, mobbin_mcp, design_corpus, adversarial_design, screenshots, accessibility, postmortem, required_artifacts, risks]. Missing: [spec_lab, boilerplate_reuse, ios_quality, appium_qa, mobbin_safety, release_hardening, mobbin_mcp, design_corpus, adversarial_design, screenshots, accessibility, postmortem, required_artifacts, risks]",
            "The output demonstrates strong reproducibility mechanisms (multi-stage review with consensus, deterministic gates, quality evidence collection, learning loops) but explicitly identifies 3 critical gaps that undermine reproducibility across the full pipeline: (1) no control-plane failure recovery strategy causing silent failures, (2) no hosted macOS CI fallback policy creating ambiguous deferral states, and (3) incomplete artifact handoff verification. These gaps mean the suite cannot reliably produce reproducible quality across overnight runs—partial state can be lost, QA evidence may be missing without clear resolution, and final artifacts may not be properly verified. The evaluation acknowledges strong foundations but concludes these gaps will cause overnight failures, directly contradicting the rubric requirement for reproducible quality across the full pipeline."
          ]
        }
      ],
      "critical_gaps": [
        "appium_xcuitest_deferral_policy",
        "deterministic_gate_enforcement",
        "review_fan_in_integrity"
      ]
    }
    ```
- **research_fanout**: partially_succeeded
- **app_store_research**: failed
- **research_join**: failed
- **research_synthesis**: failed
- **research_fanout**: partially_succeeded

## Context
- parallel.branch_count: 4
- parallel.results: [{"id":"","status":"failed"},{"id":"","status":"failed"},{"id":"","status":"failed"},{"id":"","status":"failed"}]


# App Store Review Research

Read `.workflow/iphone-app-factory/context.md` and `quality-bar.json`.

Research iPhone apps related to `iPhone productivity and creator-operator tool. Read docs/superpowers/specs/2026-05-19-joni-capture-iphone-design.md and contexts/iphone-app-factory/joni-capture/feature-context.md. Build a lock-screen/action-button voice capture app for Joni, the LinkedIn agent. It must capture rambled post ideas, transcribe or queue them, submit through a configurable Joni ingestion client, classify post type, prepare evaluated LinkedIn drafts in Tim voice, show Joni activity and analytics, and include interviewer mode for structured notes. No LinkedIn publishing or mutation.` for `Tim Keen and operator-founders who capture ideas on the move and want a private agent-assisted LinkedIn drafting workflow with visible status, draft review, and analytics.`.

Use the existing Consumer Radar/App Store reviews tooling if available. Prefer live Apify/App Store data when credentials are present. If live scraping is unavailable, mark the limitation explicitly and do not invent review quotes.

Secret handling is blocking: never print environment variables or credential values. To check whether `APIFY_TOKEN` or another credential exists, use a boolean/presence-only command such as `node -e "console.log(Boolean(process.env.APIFY_TOKEN))"` and never echo, grep, dump, log, or write the value. Do not run environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`, and do not echo any `$...TOKEN`, `$...KEY`, `$...PASSWORD`, `$...AUTH`, or `$...CREDENTIAL` variable.

Write `.workflow/iphone-app-factory/research/app-store.md` with:

- candidate apps and App Store links
- why each app is relevant
- recent review themes, complaints, feature requests, and delight moments
- what appears fast-growing versus merely large
- evidence quality: `live`, `partial`, or `limited`
- concrete product opportunities for our app

Do not write implementation code.