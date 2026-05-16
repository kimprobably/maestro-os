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
    {"ok":true,"action":"updated","repo_url":"https://github.com/kimprobably/waketask-ios.git","base_branch":"main","run_branch":"ux-studio/waketask-20260516-173017","app_dir":"apps/waketask-ios","sha":"3b035f2ff8f28e4262315f4e10b9eaaa3b479a6d","failures":[]}
    ```
- **existing_app_intake**: succeeded
  - Model: anthropic/claude-haiku-4-5, 806.5k tokens in / 19.6k out
  - Files: /home/daytona/workspace/.workflow/iphone-app-ux-studio/research/existing-app-intake.md, /home/daytona/workspace/.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Capture is blocked in this worker: `xcodebuild` and `xcrun` are not installed, so simulator control and screenshot capture are unavailable. I also checked workspace evidence paths and there are no pre-existing baseline screenshots to reuse.\n\nWhat I verified:\n- iOS toolchain missing (`xcodebuild: command not found`, `xcrun: command not found`).\n- No existing files under `reports/ios/screenshots/` or `.workflow` containing the required before-screen captures.\n\nI can complete this immediately once run in a macOS worker with Xcode/simctl available (or if you provide an existing `.xcresult`/screenshot artifact set).\n","stderr_excerpt":"           Text(\"Restore previously purchased subscriptions\")\n                .font(DSTypography.caption)\n                .foregroundStyle(DSColors.textSecondary)\n        }\n    }\n}\n\nexec\n/bin/bash -lc \"xcrun xcresulttool --help | sed -n '1,220p'\" in /home/daytona/workspace\n succeeded in 0ms:\n/bin/bash: line 1: xcrun: command not found\n\nexec\n/bin/bash -lc 'xcodebuild -version' in /home/daytona/workspace\n exited 127 in 0ms:\n/bin/bash: line 1: xcodebuild: command not found\n\ncodex\nI hit an environment blocker: this worker does not have `xcodebuild`/`xcrun`, so I can’t drive the simulator here. I’ll now check for existing baseline screenshot artifacts in the workspace/evidence directories and, if present, assemble/validate the required manifest from those files.\nexec\n/bin/bash -lc \"find /home/daytona/workspace -type f \\\\( -name '*.png' -o -name 'manifest.json' -o -name '*.jpg' \\\\) | rg 'reports/ios|workflow|evidence|screenshot|xcresult|before|after' | sed -n '1,300p'\" in /home/daytona/workspace\n succeeded in 0ms:\nexec\n/bin/bash -lc \"find /home/daytona/workspace -type d | rg 'reports/ios|screenshots|xcresult|evidence|iphone-app-ux-studio' | sed -n '1,300p'\" in /home/daytona/workspace\n succeeded in 0ms:\n/home/daytona/workspace/.workflow/iphone-app-ux-studio\n/home/daytona/workspace/.workflow/iphone-app-ux-studio/research\n/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex\n\nexec\n/bin/bash -lc \"ls -la /home/daytona/workspace/.workflow/iphone-app-ux-studio || true && find /home/daytona/workspace/.workflow/iphone-app-ux-studio -maxdepth 5 -type f | sed -n '1,300p'\" in /home/daytona/workspace\n succeeded in 0ms:\ntotal 8\ndrwxr-xr-x 4 root root   98 May 16 21:34 .\ndrwxr-xr-x 3 root root   42 May 16 21:30 ..\n-rw-r--r-- 1 root root  288 May 16 21:30 checkout.json\ndrwxr-xr-x 2 root root   59 May 16 21:34 codex\n-rw-r--r-- 1 root root 3131 May 16 21:30 preflight.json\ndrwxr-xr-x 2 root root   83 May 16 21:32 research\n/home/daytona/workspace/.workflow/iphone-app-ux-studio/preflight.json\n/home/daytona/workspace/.workflow/iphone-app-ux-studio/checkout.json\n/home/daytona/workspace/.workflow/iphone-app-ux-studio/research/existing-app-intake.md\n/home/daytona/workspace/.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json\n/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md\n\ncodex\nCapture is blocked in this worker: `xcodebuild` and `xcrun` are not installed, so simulator control and screenshot capture are unavailable. I also checked workspace evidence paths and there are no pre-existing baseline screenshots to reuse.\n\nWhat I verified:\n- iOS toolchain missing (`xcodebuild: command not found`, `xcrun: command not found`).\n- No existing files under `reports/ios/screenshots/` or `.workflow` containing the required before-screen captures.\n\nI can complete this immediately once run in a macOS worker with Xcode/simctl available (or if you provide an existing `.xcresult`/screenshot artifact set).\ntokens used\n54,903\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
    ```
- **design_corpus_preflight**: failed
  - Script: `node scripts/iphone-app-factory/design-corpus.mjs init`
  - Output:
    ```
    DESIGN_CORPUS_DATABASE_URL is set, but Postgres/Neon support is not enabled yet. Unset it or use --db for local SQLite.
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
    {"ok":true,"action":"updated","repo_url":"https://github.com/kimprobably/waketask-ios.git","base_branch":"main","run_branch":"ux-studio/waketask-20260516-173017","app_dir":"apps/waketask-ios","sha":"3b035f2ff8f28e4262315f4e10b9eaaa3b479a6d","failures":[]}
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
