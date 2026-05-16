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
  - Model: anthropic/claude-haiku-4-5, 25.3k tokens in / 907 out
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Blocked by environment: this worker does not have Apple simulator tooling (`xcrun` is not installed), and there are no existing screenshot/evidence artifacts in the repo to use as baseline captures.\n\nWhat I verified:\n- `xcrun simctl ...` fails with `xcrun: command not found`.\n- No existing baseline screenshots under `reports/ios/...`.\n- No `.xcresult` bundles or external artifact/evidence directories containing captures.\n\nBecause of that, I cannot produce valid required screenshots (`onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, `paywall_subscription`) or a truthful manifest with real image dimensions/quality flags in this environment.\n\nNext step to unblock:\n1. Re-run this stage on a macOS worker with Xcode command-line tools (so `xcrun simctl` is available), or provide existing screenshot artifacts in the workspace for me to package into `reports/ios/screenshots/before/` and `reports/ios/screenshots/manifest.json`.\n","stderr_excerpt":"os/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@1x.png\n5:./apps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@2x.png\n6:./apps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@3x.png\n\nexec\n/bin/bash -lc \"find apps/waketask-ios -type f \\\\( -name \\\"*.png\\\" -o -name \\\"*.jpg\\\" -o -name \\\"*.jpeg\\\" \\\\) | sed -n '1,220p'\" in /home/daytona/workspace\n succeeded in 0ms:\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Dark.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Light.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Tinted.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@1x.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@2x.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@3x.png\n\ncodex\nThere are no existing baseline screen captures in the repository, only app icon/launch assets. I’m going to scan for Fabro/Daytona evidence artifact directories outside `reports/` that may already contain simulator captures from the current worker session.\nexec\n/bin/bash -lc \"find /home/daytona -type d \\\\( -iname \\\"*artifact*\\\" -o -iname \\\"*evidence*\\\" -o -iname \\\"*screens*\\\" -o -iname \\\"*screenshot*\\\" \\\\) 2>/dev/null | sed -n '1,260p'\" in /home/daytona/workspace\n succeeded in 0ms:\ncodex\nI can’t find any pre-existing evidence artifacts on disk either, so I’m checking for prior XCUITest result bundles (`.xcresult`) that might contain valid screenshots we can extract without changing app code or state.\nexec\n/bin/bash -lc \"find /home/daytona/workspace -type d -name \\\"*.xcresult\\\" -o -type f -name \\\"*.xcresult\\\" | sed -n '1,200p'\" in /home/daytona/workspace\n succeeded in 0ms:\ncodex\nBlocked by environment: this worker does not have Apple simulator tooling (`xcrun` is not installed), and there are no existing screenshot/evidence artifacts in the repo to use as baseline captures.\n\nWhat I verified:\n- `xcrun simctl ...` fails with `xcrun: command not found`.\n- No existing baseline screenshots under `reports/ios/...`.\n- No `.xcresult` bundles or external artifact/evidence directories containing captures.\n\nBecause of that, I cannot produce valid required screenshots (`onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, `paywall_subscription`) or a truthful manifest with real image dimensions/quality flags in this environment.\n\nNext step to unblock:\n1. Re-run this stage on a macOS worker with Xcode command-line tools (so `xcrun simctl` is available), or provide existing screenshot artifacts in the workspace for me to package into `reports/ios/screenshots/before/` and `reports/ios/screenshots/manifest.json`.\ntokens used\n11,486\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
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
- **existing_app_intake**: succeeded
  - Model: anthropic/claude-haiku-4-5, 25.3k tokens in / 907 out
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Blocked by environment: this worker does not have Apple simulator tooling (`xcrun` is not installed), and there are no existing screenshot/evidence artifacts in the repo to use as baseline captures.\n\nWhat I verified:\n- `xcrun simctl ...` fails with `xcrun: command not found`.\n- No existing baseline screenshots under `reports/ios/...`.\n- No `.xcresult` bundles or external artifact/evidence directories containing captures.\n\nBecause of that, I cannot produce valid required screenshots (`onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, `paywall_subscription`) or a truthful manifest with real image dimensions/quality flags in this environment.\n\nNext step to unblock:\n1. Re-run this stage on a macOS worker with Xcode command-line tools (so `xcrun simctl` is available), or provide existing screenshot artifacts in the workspace for me to package into `reports/ios/screenshots/before/` and `reports/ios/screenshots/manifest.json`.\n","stderr_excerpt":"os/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@1x.png\n5:./apps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@2x.png\n6:./apps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@3x.png\n\nexec\n/bin/bash -lc \"find apps/waketask-ios -type f \\\\( -name \\\"*.png\\\" -o -name \\\"*.jpg\\\" -o -name \\\"*.jpeg\\\" \\\\) | sed -n '1,220p'\" in /home/daytona/workspace\n succeeded in 0ms:\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Dark.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Light.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/WakeTaskIcon-Tinted.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@1x.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@2x.png\napps/waketask-ios/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/WakeTaskLaunchLogo@3x.png\n\ncodex\nThere are no existing baseline screen captures in the repository, only app icon/launch assets. I’m going to scan for Fabro/Daytona evidence artifact directories outside `reports/` that may already contain simulator captures from the current worker session.\nexec\n/bin/bash -lc \"find /home/daytona -type d \\\\( -iname \\\"*artifact*\\\" -o -iname \\\"*evidence*\\\" -o -iname \\\"*screens*\\\" -o -iname \\\"*screenshot*\\\" \\\\) 2>/dev/null | sed -n '1,260p'\" in /home/daytona/workspace\n succeeded in 0ms:\ncodex\nI can’t find any pre-existing evidence artifacts on disk either, so I’m checking for prior XCUITest result bundles (`.xcresult`) that might contain valid screenshots we can extract without changing app code or state.\nexec\n/bin/bash -lc \"find /home/daytona/workspace -type d -name \\\"*.xcresult\\\" -o -type f -name \\\"*.xcresult\\\" | sed -n '1,200p'\" in /home/daytona/workspace\n succeeded in 0ms:\ncodex\nBlocked by environment: this worker does not have Apple simulator tooling (`xcrun` is not installed), and there are no existing screenshot/evidence artifacts in the repo to use as baseline captures.\n\nWhat I verified:\n- `xcrun simctl ...` fails with `xcrun: command not found`.\n- No existing baseline screenshots under `reports/ios/...`.\n- No `.xcresult` bundles or external artifact/evidence directories containing captures.\n\nBecause of that, I cannot produce valid required screenshots (`onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, `paywall_subscription`) or a truthful manifest with real image dimensions/quality flags in this environment.\n\nNext step to unblock:\n1. Re-run this stage on a macOS worker with Xcode command-line tools (so `xcrun simctl` is available), or provide existing screenshot artifacts in the workspace for me to package into `reports/ios/screenshots/before/` and `reports/ios/screenshots/manifest.json`.\ntokens used\n11,486\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
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
