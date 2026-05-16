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
  - Model: anthropic/claude-haiku-4-5, 263.7k tokens in / 5.6k out
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Blocked in this worker: baseline screenshots cannot be captured here because iOS simulator tooling is missing.\n\nEvidence:\n- `xcodebuild`/`xcrun`/`simctl` are unavailable in this environment.\n- `reports/ios/screenshots/before/` is empty, so there are no existing captures to manifest.\n- Prior stage output already recorded this blocker at [baseline-screenshot-capture.json](/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json).\n\nCurrent state:\n- No product code changes were made.\n- [before/](/home/daytona/workspace/reports/ios/screenshots/before) remains empty.\n- `manifest.json` was not generated because real screenshots/dimensions could not be produced.\n\nUnblock:\n1. Rerun `baseline-screenshot-capture` on a macOS worker with Xcode CLI tools (`xcodebuild` + `xcrun simctl`) and an available booted iPhone simulator.\n","stderr_excerpt":"nsions/quality checks.\\n\\nRepository state is clean (I reverted the temporary UITest change I made while attempting a fallback path).  \\n\\nTo complete this stage, rerun in a macOS worker with Xcode CLI tools available (at minimum `xcodebuild` + `xcrun simctl`), then I can capture all 9 required `before` screenshots and write the manifest.\\ntokens used\\n66,764\\n\",\n  \"codex_auth_installed\": true,\n  \"codex_mcp_credentials_installed\": true,\n  \"codex_mobbin_mcp\": {\n    \"configured\": false,\n    \"skipped\": true,\n    \"status\": null\n  },\n  \"failures\": []\n}\n\nexec\n/bin/bash -lc \"sed -n '1,260p' .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md\" in /home/daytona/workspace\n succeeded in 0ms:\nBlocked by missing iOS tooling in this worker:\n\n- `xcodebuild` is not installed (`xcodebuild: command not found`).\n- `xcrun`/`simctl`/`xcresulttool` are also unavailable.\n- No existing baseline screenshots were present in `reports/ios/screenshots/before/` to reuse.\n\nBecause of that, I could not capture the required screens or generate a valid `reports/ios/screenshots/manifest.json` with real image dimensions/quality checks.\n\nRepository state is clean (I reverted the temporary UITest change I made while attempting a fallback path).  \n\nTo complete this stage, rerun in a macOS worker with Xcode CLI tools available (at minimum `xcodebuild` + `xcrun simctl`), then I can capture all 9 required `before` screenshots and write the manifest.\ncodex\nI verified the stage evidence file already records the same hard blocker in this worker: no `xcodebuild`/`xcrun simctl`, and no pre-existing baseline screenshots to package. I’m doing one final repo-state check, then I’ll return a precise unblock request.\nexec\n/bin/bash -lc 'git status --short && ls -la reports/ios/screenshots && ls -la reports/ios/screenshots/before' in /home/daytona/workspace\n succeeded in 0ms:\ntotal 0\ndrwxr-xr-x 3 root root 28 May 16 21:46 .\ndrwxr-xr-x 3 root root 33 May 16 21:46 ..\ndrwxr-xr-x 2 root root 10 May 16 21:46 before\ntotal 0\ndrwxr-xr-x 2 root root 10 May 16 21:46 .\ndrwxr-xr-x 3 root root 28 May 16 21:46 ..\n\ncodex\nBlocked in this worker: baseline screenshots cannot be captured here because iOS simulator tooling is missing.\n\nEvidence:\n- `xcodebuild`/`xcrun`/`simctl` are unavailable in this environment.\n- `reports/ios/screenshots/before/` is empty, so there are no existing captures to manifest.\n- Prior stage output already recorded this blocker at [baseline-screenshot-capture.json](/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json).\n\nCurrent state:\n- No product code changes were made.\n- [before/](/home/daytona/workspace/reports/ios/screenshots/before) remains empty.\n- `manifest.json` was not generated because real screenshots/dimensions could not be produced.\n\nUnblock:\n1. Rerun `baseline-screenshot-capture` on a macOS worker with Xcode CLI tools (`xcodebuild` + `xcrun simctl`) and an available booted iPhone simulator.\ntokens used\n27,057\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
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
- **existing_app_intake**: succeeded
  - Model: anthropic/claude-haiku-4-5, 263.7k tokens in / 5.6k out
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Blocked in this worker: baseline screenshots cannot be captured here because iOS simulator tooling is missing.\n\nEvidence:\n- `xcodebuild`/`xcrun`/`simctl` are unavailable in this environment.\n- `reports/ios/screenshots/before/` is empty, so there are no existing captures to manifest.\n- Prior stage output already recorded this blocker at [baseline-screenshot-capture.json](/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json).\n\nCurrent state:\n- No product code changes were made.\n- [before/](/home/daytona/workspace/reports/ios/screenshots/before) remains empty.\n- `manifest.json` was not generated because real screenshots/dimensions could not be produced.\n\nUnblock:\n1. Rerun `baseline-screenshot-capture` on a macOS worker with Xcode CLI tools (`xcodebuild` + `xcrun simctl`) and an available booted iPhone simulator.\n","stderr_excerpt":"nsions/quality checks.\\n\\nRepository state is clean (I reverted the temporary UITest change I made while attempting a fallback path).  \\n\\nTo complete this stage, rerun in a macOS worker with Xcode CLI tools available (at minimum `xcodebuild` + `xcrun simctl`), then I can capture all 9 required `before` screenshots and write the manifest.\\ntokens used\\n66,764\\n\",\n  \"codex_auth_installed\": true,\n  \"codex_mcp_credentials_installed\": true,\n  \"codex_mobbin_mcp\": {\n    \"configured\": false,\n    \"skipped\": true,\n    \"status\": null\n  },\n  \"failures\": []\n}\n\nexec\n/bin/bash -lc \"sed -n '1,260p' .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md\" in /home/daytona/workspace\n succeeded in 0ms:\nBlocked by missing iOS tooling in this worker:\n\n- `xcodebuild` is not installed (`xcodebuild: command not found`).\n- `xcrun`/`simctl`/`xcresulttool` are also unavailable.\n- No existing baseline screenshots were present in `reports/ios/screenshots/before/` to reuse.\n\nBecause of that, I could not capture the required screens or generate a valid `reports/ios/screenshots/manifest.json` with real image dimensions/quality checks.\n\nRepository state is clean (I reverted the temporary UITest change I made while attempting a fallback path).  \n\nTo complete this stage, rerun in a macOS worker with Xcode CLI tools available (at minimum `xcodebuild` + `xcrun simctl`), then I can capture all 9 required `before` screenshots and write the manifest.\ncodex\nI verified the stage evidence file already records the same hard blocker in this worker: no `xcodebuild`/`xcrun simctl`, and no pre-existing baseline screenshots to package. I’m doing one final repo-state check, then I’ll return a precise unblock request.\nexec\n/bin/bash -lc 'git status --short && ls -la reports/ios/screenshots && ls -la reports/ios/screenshots/before' in /home/daytona/workspace\n succeeded in 0ms:\ntotal 0\ndrwxr-xr-x 3 root root 28 May 16 21:46 .\ndrwxr-xr-x 3 root root 33 May 16 21:46 ..\ndrwxr-xr-x 2 root root 10 May 16 21:46 before\ntotal 0\ndrwxr-xr-x 2 root root 10 May 16 21:46 .\ndrwxr-xr-x 3 root root 28 May 16 21:46 ..\n\ncodex\nBlocked in this worker: baseline screenshots cannot be captured here because iOS simulator tooling is missing.\n\nEvidence:\n- `xcodebuild`/`xcrun`/`simctl` are unavailable in this environment.\n- `reports/ios/screenshots/before/` is empty, so there are no existing captures to manifest.\n- Prior stage output already recorded this blocker at [baseline-screenshot-capture.json](/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json).\n\nCurrent state:\n- No product code changes were made.\n- [before/](/home/daytona/workspace/reports/ios/screenshots/before) remains empty.\n- `manifest.json` was not generated because real screenshots/dimensions could not be produced.\n\nUnblock:\n1. Rerun `baseline-screenshot-capture` on a macOS worker with Xcode CLI tools (`xcodebuild` + `xcrun simctl`) and an available booted iPhone simulator.\ntokens used\n27,057\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
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
