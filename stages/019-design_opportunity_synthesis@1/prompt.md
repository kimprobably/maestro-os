## Parent workflow context
Goal: Create staged WakeTask product-iteration workflows, then run the UX Studio implementation workflow through Railway Fabro with durable evidence and postmortem learning

## Completed stages
- **workflow_definition_preflight**: succeeded
- **product_spec_child**: succeeded


## Current sub-workflow
Goal: Iterate on an existing iPhone app UX with private design research, adversarial design directions, hosted iOS validation, and postmortem learning capture

## Completed stages
- **remote_environment_preflight**: succeeded
  - Script: `node scripts/iphone-app-factory/ux-studio-preflight.mjs --server https://fabro-maestro-production.up.railway.app/api/v1 --expected-control-plane railway`
  - Output:
    ```
    (114 lines omitted)
          {
            "url": "https://api.mobbin.com/mcp",
            "ok": false,
            "status": null,
            "error": "fetch failed",
            "required": false
          },
          {
            "url": "https://pageflows.com/",
            "ok": false,
            "status": null,
            "error": "fetch failed",
            "required": false
          },
          {
            "url": "https://www.reddit.com/",
            "ok": false,
            "status": null,
            "error": "fetch failed",
            "required": false
          }
        ]
      },
      "failures": []
    }
    ```
- **checkout_existing_app**: succeeded
  - Script: `node scripts/iphone-app-factory/checkout-existing-app.mjs`
  - Output:
    ```
    {"ok":true,"action":"cloned","repo_url":"https://github.com/kimprobably/waketask-ios.git","base_branch":"main","run_branch":"ux-studio/waketask-product-iteration-20260517","app_dir":"apps/waketask-ios","sha":"3b035f2ff8f28e4262315f4e10b9eaaa3b479a6d","failures":[]}
    ```
- **existing_app_intake**: succeeded
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Blocked in this worker: iOS tooling is unavailable, so baseline capture cannot be executed here.\n\nEvidence from workspace:\n- `xcrun simctl ...` fails with `xcrun: command not found`.\n- No existing baseline images or manifest were found under `reports/ios/screenshots/`.\n- The only related artifact is the prompt file at `.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md`.\n\nBecause of that, I did not generate placeholder/fake screenshots or a fabricated manifest.\n\nNext step to complete this stage:\n1. Run this same stage on a macOS worker with full Xcode CLI tools (`xcrun`, `simctl`, `xcodebuild`) and an available iOS Simulator.\n","stderr_excerpt":"Y637Z4Y` is correct for the target account.\n- Set production Supabase, RevenueCat, AI proxy, and optional OneSignal values.\n- Use the RevenueCat Test Store key only for Debug/local testing; TestFlight/App Store builds require the iOS app-specific RevenueCat key.\n- Run the hosted `iOS Quality` workflow on `main`.\n- Confirm both uploaded reports are present and passing.\n- Archive in Xcode or wire a signing-enabled GitHub Actions archive job.\n- Create the App Store Connect app record, privacy answers, screenshots, description, keywords, support URL, and review notes.\n\nActual App Store submission should happen only after a successful TestFlight/internal QA pass.\n\ncodex\nI’m now creating a standalone UITest capture file that mirrors the existing exploratory flow, adds targeted screenshots for each required key, and writes them straight to the expected `before/` folder.\nexec\n/bin/bash -lc \"xcrun simctl list devices available | sed -n '1,120p' && ls -la apps/waketask-ios/SwiftAIBoilerplateProUITests\" in /home/daytona/workspace\n succeeded in 0ms:\n/bin/bash: line 1: xcrun: command not found\ntotal 52\ndrwxr-xr-x  2 root root 4096 May 17 05:01 .\ndrwxr-xr-x 17 root root 4096 May 17 05:01 ..\n-rw-r--r--  1 root root 5898 May 17 05:01 AuthFlowUITests.swift\n-rw-r--r--  1 root root 7113 May 17 05:01 ChatFlowUITests.swift\n-rw-r--r--  1 root root 9196 May 17 05:01 IntegrationWakeExploratoryUITests.swift\n-rw-r--r--  1 root root 7753 May 17 05:01 PaywallFlowUITests.swift\n-rw-r--r--  1 root root  952 May 17 05:01 SwiftAIBoilerplateProUITests.swift\n-rw-r--r--  1 root root  730 May 17 05:01 SwiftAIBoilerplateProUITestsLaunchTests.swift\n\ncodex\nI hit an environment blocker: `xcrun` is not installed in this worker, so iOS simulator control and screenshot capture cannot run here. I’ll check for any existing baseline screenshot artifacts in the repo that satisfy your required keys before concluding.\nexec\n/bin/bash -lc \"find reports -maxdepth 6 -type f | rg \\\"reports/ios/screenshots|\\\\.png\"'$|manifest.json\" -n' in /home/daytona/workspace\n exited 1 in 0ms:\nexec\n/bin/bash -lc 'find .workflow -maxdepth 7 -type f 2>/dev/null | rg \"screenshot|ios|manifest|before|after|png\" -n | head -n 200' in /home/daytona/workspace\n succeeded in 0ms:\n7:.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md\n\ncodex\nBlocked in this worker: iOS tooling is unavailable, so baseline capture cannot be executed here.\n\nEvidence from workspace:\n- `xcrun simctl ...` fails with `xcrun: command not found`.\n- No existing baseline images or manifest were found under `reports/ios/screenshots/`.\n- The only related artifact is the prompt file at `.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md`.\n\nBecause of that, I did not generate placeholder/fake screenshots or a fabricated manifest.\n\nNext step to complete this stage:\n1. Run this same stage on a macOS worker with full Xcode CLI tools (`xcrun`, `simctl`, `xcodebuild`) and an available iOS Simulator.\ntokens used\n48,776\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
    ```
- **design_corpus_preflight**: succeeded
  - Script: `node scripts/iphone-app-factory/design-corpus.mjs init --db .workflow/iphone-app-ux-studio/design-corpus.sqlite`
  - Output:
    ```
    {
      "ok": true,
      "storage": "sqlite",
      "path": "/home/daytona/workspace/.workflow/iphone-app-ux-studio/design-corpus.sqlite"
    }
    ```
- **retrieve_existing_references**: succeeded
  - Script: `mkdir -p .workflow/iphone-app-ux-studio/research; node scripts/iphone-app-factory/design-corpus.mjs reference-pack --db .workflow/iphone-app-ux-studio/design-corpus.sqlite > .workflow/iphone-app-ux-studio/research/reference-pack.json`
  - Output: (empty)
- **reference_gap_analysis**: succeeded
  - Script: `mkdir -p .workflow/iphone-app-ux-studio/research; node -e "const fs=require('fs'); const path='.workflow/iphone-app-ux-studio/research/reference-pack.json'; const pack=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):{}; const refs=pack.references||pack.reference_pack?.references||[]; const report={ok:true,total_references:refs.length,needs_live_research:refs.length<12,missing:['competitor_flow_research','app_store_review_mining','mobbin_mcp_research','pageflows_research','apple_hig_research','behavioral_ux_research'],railway_fabro_required:true}; fs.writeFileSync('.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json', JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify(report));"`
  - Output:
    ```
    {"ok":true,"total_references":0,"needs_live_research":true,"missing":["competitor_flow_research","app_store_review_mining","mobbin_mcp_research","pageflows_research","apple_hig_research","behavioral_ux_research"],"railway_fabro_required":true}
    ```
- **research_fanout**: succeeded
- **research_join**: succeeded

## Context
- parallel.branch_count: 6
- parallel.fan_in.best_id: app_store_review_mining
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"competitor_flow_research","status":"succeeded"},{"id":"app_store_review_mining","status":"succeeded"},{"id":"mobbin_mcp_research","status":"succeeded"},{"id":"pageflows_research","status":"succeeded"},{"id":"apple_hig_research","status":"succeeded"},{"id":"behavioral_ux_research","status":"succeeded"}]


# UX Design Opportunity Synthesis

Synthesize the UX Studio research into a design opportunity artifact at `.workflow/iphone-app-ux-studio/research/design-opportunity-synthesis.md`.

Also write `.workflow/iphone-app-ux-studio/research/reference-pack.json` as strict JSON for the deterministic reference pack gate.

## Source Policy

- Use only the research artifacts in `.workflow/iphone-app-ux-studio/research`, current app evidence, and explicitly listed public sources.
- Read these exact upstream artifacts when present: `.workflow/iphone-app-ux-studio/research/existing-app-intake.md`, `.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json`, `.workflow/iphone-app-ux-studio/research/competitor-flows.md`, `.workflow/iphone-app-ux-studio/research/app-store-review-mining.md`, `.workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md`, `.workflow/iphone-app-ux-studio/research/pageflows-research.md`, `.workflow/iphone-app-ux-studio/research/apple-hig-research.md`, and `.workflow/iphone-app-ux-studio/research/behavioral-ux-research.md`.
- Do not output secrets, credentials, tokens, cookies, private keys, session values, or environment variable values.
- Do not clone proprietary screens, exact layouts, UI copy, brand identity, screenshots, or assets.
- Treat raw Mobbin, Page Flows, competitor, and screenshot assets as private-only reference evidence.

## Required Headings For `design-opportunity-synthesis.md`

Use these exact headings:

1. `# Design Opportunity Synthesis`
2. `## Source Policy`
3. `## Source List`
4. `## Current App Weaknesses`
5. `## Competitor Patterns`
6. `## App Store Pain`
7. `## Mobbin And Page Flows Patterns`
8. `## Apple HIG Constraints`
9. `## Behavioral UX Constraints`
10. `## Top Screens`
11. `## Visual Principles`
12. `## Anti-Patterns`
13. `## what_to_adapt`
14. `## what_not_to_copy`
15. `## Reference Pack Summary`

## Required Synthesis

- Synthesize current app weaknesses, competitor patterns, App Store pain, Mobbin/Page Flows patterns, Apple HIG constraints, behavioral UX constraints, top screens, visual principles, and anti-patterns.
- If `.workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md` is missing but the Mobbin/Codex stage completed, first materialize a source-limited fallback Mobbin research artifact with the required Mobbin headings. Do not keep searching for missing Codex branch files.
- For WakeTask-like alarm apps, explicitly evaluate:
  - calm setup mode
  - urgent wake mode
  - reward/accountability mode
- Include source-backed observations only. Mark inference when the source is indirect.
- Under `## what_to_adapt`, describe reusable principles and interaction ideas.
- Under `## what_not_to_copy`, describe proprietary visuals, exact screen structures, copy, brand identity, and harmful UX patterns to avoid.

## Required `reference-pack.json` Shape

Write strict JSON with at least these keys:

```json
{
  "references": [
    {
      "id": "...",
      "title": "...",
      "source": "competitor|app_store|mobbin|pageflows|apple_hig|behavioral_research|synthesis",
      "category": "competitor_flow|review_mining|pattern_library|platform_guidance|behavioral_ux|opportunity",
      "screen_type": "...",
      "source_url": "...",
      "evidence_summary": "...",
      "what_to_adapt": "...",
      "what_not_to_copy": "..."
    }
  ],
  "observations": [
    {
      "id": "...",
      "evidence": ["..."],
      "what_to_adapt": "...",
      "what_not_to_copy": "..."
    }
  ],
  "screen_types": ["..."],
  "raw_assets": [
    {
      "path": "...",
      "source": "...",
      "private_only": true
    }
  ]
}
```

The JSON must include at least 12 total references, at least 4 competitor flow references, at least 4 Mobbin or Page Flows references when Mobbin MCP is enabled, at least 5 screen types, `what_to_adapt` and `what_not_to_copy` on every reference and observation, and `private_only=true` on every raw asset.

For the deterministic gate, Mobbin/Page Flows references must be machine-detectable. At least four references must include `source`, `source_type`, `provider`, `url`, or `tags` containing either `mobbin`, `pageflows`, or `page flows`. If Mobbin is unavailable, use Page Flows or PageFlows-style fallback references and label the limitation in `evidence_summary`; do not hide them behind a generic `pattern_library` source.

Before finishing, validate the JSON mentally against these gate predicates:

- `references.length >= 12`
- at least four references have `category` or `source_type` containing `competitor_flow`
- at least four references have `source`, `source_type`, `provider`, `url`, or `tags` containing `mobbin`, `pageflows`, or `page flows`
- `screen_types.length >= 5`
- every reference and observation has non-empty `what_to_adapt` and `what_not_to_copy`
- every raw asset has `"private_only": true`
