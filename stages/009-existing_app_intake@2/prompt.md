Goal: Iterate on an existing iPhone app UX with private design research, adversarial design options, hosted iOS validation, and postmortem learning capture

## Completed stages
- **remote_environment_preflight**: succeeded
  - Script: `node scripts/iphone-app-factory/ux-studio-preflight.mjs --server https://fabro-maestro-production.up.railway.app/api/v1 --expected-control-plane railway`
  - Output:
    ```
    (108 lines omitted)
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
    {"ok":true,"action":"updated","repo_url":"https://github.com/kimprobably/waketask-ios.git","base_branch":"main","run_branch":"ux-studio/waketask-20260516-174106","app_dir":"apps/waketask-ios","sha":"3b035f2ff8f28e4262315f4e10b9eaaa3b479a6d","failures":[]}
    ```
- **existing_app_intake**: succeeded
  - Model: anthropic/claude-haiku-4-5, 896.8k tokens in / 14.9k out
  - Files: /home/daytona/workspace/.workflow/iphone-app-ux-studio/research/existing-app-intake.md, /home/daytona/workspace/.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Blocked by missing iOS tooling in this worker:\n\n- `xcodebuild` is not installed (`xcodebuild: command not found`).\n- `xcrun`/`simctl`/`xcresulttool` are also unavailable.\n- No existing baseline screenshots were present in `reports/ios/screenshots/before/` to reuse.\n\nBecause of that, I could not capture the required screens or generate a valid `reports/ios/screenshots/manifest.json` with real image dimensions/quality checks.\n\nRepository state is clean (I reverted the temporary UITest change I made while attempting a fallback path).  \n\nTo complete this stage, rerun in a macOS worker with Xcode CLI tools available (at minimum `xcodebuild` + `xcrun simctl`), then I can capture all 9 required `before` screenshots and write the manifest.\n","stderr_excerpt":" checking whether any pre-generated evidence screenshots/artifacts already exist in the repo that satisfy this stage.\nexec\n/bin/bash -lc \"rg --files -g '*.png' -g '*.jpg' -g '*.jpeg' reports apps/waketask-ios | head -200\" in /home/daytona/workspace\n succeeded in 0ms:\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@3x.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@2x.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@1x.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Tinted.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Light.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Dark.png\n\nexec\n/bin/bash -lc 'command -v xcrun || true; command -v simctl || true; command -v xcresulttool || true' in /home/daytona/workspace\n succeeded in 0ms:\nexec\n/bin/bash -lc \"find . -type d | rg -n 'xcresult|screenshots|evidence|artifacts|baseline' -S | head -200\" in /home/daytona/workspace\n succeeded in 0ms:\n324:./evals/workflow-quality/baselines\n359:./reports/ios/screenshots\n360:./reports/ios/screenshots/before\n\nexec\n/bin/bash -lc 'ls -la reports/ios/screenshots reports/ios/screenshots/before && find reports/ios/screenshots -maxdepth 2 -type f -print' in /home/daytona/workspace\n succeeded in 0ms:\nreports/ios/screenshots:\ntotal 0\ndrwxr-xr-x 3 root root 28 May 16 21:46 .\ndrwxr-xr-x 3 root root 33 May 16 21:46 ..\ndrwxr-xr-x 2 root root 10 May 16 21:46 before\n\nreports/ios/screenshots/before:\ntotal 0\ndrwxr-xr-x 2 root root 10 May 16 21:46 .\ndrwxr-xr-x 3 root root 28 May 16 21:46 ..\n\ncodex\nNo reusable baseline screenshots are present, and simulator tooling (`xcodebuild`/`xcrun`) is unavailable in this container. I’m reverting the temporary UITest edit so the repository stays clean, then I’ll report the exact blocker and what’s needed to complete capture.\nexec\n/bin/bash -lc 'cd apps/waketask-ios && git checkout -- SwiftAIBoilerplateProUITests/IntegrationWakeExploratoryUITests.swift && git status --short' in /home/daytona/workspace\n succeeded in 0ms:\ncodex\nBlocked by missing iOS tooling in this worker:\n\n- `xcodebuild` is not installed (`xcodebuild: command not found`).\n- `xcrun`/`simctl`/`xcresulttool` are also unavailable.\n- No existing baseline screenshots were present in `reports/ios/screenshots/before/` to reuse.\n\nBecause of that, I could not capture the required screens or generate a valid `reports/ios/screenshots/manifest.json` with real image dimensions/quality checks.\n\nRepository state is clean (I reverted the temporary UITest change I made while attempting a fallback path).  \n\nTo complete this stage, rerun in a macOS worker with Xcode CLI tools available (at minimum `xcodebuild` + `xcrun simctl`), then I can capture all 9 required `before` screenshots and write the manifest.\ntokens used\n66,764\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
    ```
- **design_corpus_preflight**: failed
  - Script: `node scripts/iphone-app-factory/design-corpus.mjs init --db .workflow/iphone-app-ux-studio/design-corpus.sqlite`
  - Output:
    ```
    sqlite3 CLI is required for design-corpus SQLite storage and was not found on PATH.
    ```
- **remote_environment_preflight**: succeeded
  - Script: `node scripts/iphone-app-factory/ux-studio-preflight.mjs --server https://fabro-maestro-production.up.railway.app/api/v1 --expected-control-plane railway`
  - Output:
    ```
    (108 lines omitted)
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
    {"ok":true,"action":"updated","repo_url":"https://github.com/kimprobably/waketask-ios.git","base_branch":"main","run_branch":"ux-studio/waketask-20260516-174106","app_dir":"apps/waketask-ios","sha":"3b035f2ff8f28e4262315f4e10b9eaaa3b479a6d","failures":[]}
    ```


# UX Existing App Intake

Read the run context, existing app source, screenshots, current UX notes, and any ADRs available for this UX Studio run.

Write the primary artifact to `.workflow/iphone-app-ux-studio/research/existing-app-intake.md`.

Also write `.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json` as strict JSON that lists missing or weak reference areas for downstream research.

## Source Policy

- Use only repository files, user-provided context, current app screenshots, simulator evidence, and committed ADRs.
- Do not output secrets, credentials, tokens, cookies, private keys, session values, or environment variable values.
- Do not run or request environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`.
- Do not clone proprietary screens, screenshots, layouts, copy, brand identity, or assets.
- This intake is for UX iteration only. Do not propose rebuilding auth, payments, storage, networking, localization, settings, or the design system unless a later ADR explicitly approves that scope.

## Required Headings For `existing-app-intake.md`

Use these exact headings:

1. `# Existing App UX Intake`
2. `## Source Policy`
3. `## Source List`
4. `## Current App Purpose`
5. `## Current User Flow`
6. `## Current Screens And States`
7. `## Current UX Weaknesses`
8. `## Protected Existing Systems`
9. `## Reference Gaps`
10. `## what_to_adapt`
11. `## what_not_to_copy`
12. `## Open Questions`

## Required Content

- List every source inspected under `## Source List`.
- Identify current app weaknesses in navigation, hierarchy, copy, interaction states, accessibility, and emotional tone.
- Mark protected existing systems clearly: auth, payments, storage, networking, localization, settings, and design system are out of scope until a later ADR approves changes.
- Under `## what_to_adapt`, describe UX principles to preserve or strengthen.
- Under `## what_not_to_copy`, describe current weaknesses and proprietary external patterns that must not be copied.

## Required JSON Shape For `reference-gap-analysis.json`

```json
{
  "gaps": [
    {
      "area": "competitor_flows|app_store_pain|mobbin_or_pageflows|apple_hig|behavioral_ux|screen_type",
      "why_it_matters": "...",
      "needed_sources": ["..."],
      "priority": "low|medium|high"
    }
  ]
}
```
