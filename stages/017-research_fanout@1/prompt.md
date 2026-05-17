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


# UX Apple HIG Research

Research Apple Human Interface Guidelines and relevant Apple developer guidance for this app type, then write the artifact to `.workflow/iphone-app-ux-studio/research/apple-hig-research.md`.

## Source Policy

- Use official Apple Human Interface Guidelines and official Apple developer documentation as primary sources.
- Use secondary sources only to locate the relevant Apple page, not as authority.
- Do not output secrets, credentials, tokens, cookies, private keys, session values, or environment variable values.
- Do not clone proprietary third-party screens, exact layouts, UI copy, brand identity, screenshots, or assets.

## Required Headings

Use these exact headings:

1. `# Apple HIG Research`
2. `## Source Policy`
3. `## Source List`
4. `## Applicable HIG Constraints`
5. `## Interaction And Motion Guidance`
6. `## Accessibility Guidance`
7. `## Notification And Interruption Guidance`
8. `## Screen Type Implications`
9. `## what_to_adapt`
10. `## what_not_to_copy`

## Required Content

- Include direct Apple source links or exact Apple source names under `## Source List`.
- Translate each HIG constraint into an implication for the current app screens.
- Under `## what_to_adapt`, identify Apple-native principles to apply in SwiftUI.
- Under `## what_not_to_copy`, identify patterns that would violate platform expectations, accessibility, privacy, or interruption norms.
