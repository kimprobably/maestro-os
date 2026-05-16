Goal: Iterate on an existing iPhone app UX with private design research, adversarial design options, hosted iOS validation, and postmortem learning capture

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
    {"ok":true,"action":"cloned","repo_url":"https://github.com/kimprobably/waketask-ios.git","base_branch":"main","run_branch":"ux-studio/waketask-20260516-184007","app_dir":"apps/waketask-ios","sha":"3b035f2ff8f28e4262315f4e10b9eaaa3b479a6d","failures":[]}
    ```
- **existing_app_intake**: succeeded
  - Model: gpt-5.3-codex-spark, 3.0m tokens in / 16.8k out
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Blocked by missing iOS simulator tooling in this worker, so I could not perform a valid capture run.\n\nEvidence:\n- `xcrun simctl ...` fails with: `xcrun: command not found`\n- Without `xcrun`/Xcode CLI tools, I cannot launch or control the simulator, navigate screens, or generate real PNG captures for:\n  - `onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, `paywall_subscription`\n\nI did not generate placeholder/blank screenshots or a fake manifest, because that would violate your capture requirements.\n\nNext step needed in this environment:\n1. Install/enable full Xcode command-line tools so `xcrun` and `xcodebuild` are available, then I can run the baseline capture end-to-end and write:\n- `reports/ios/screenshots/before/*.png`\n- `reports/ios/screenshots/manifest.json`\n","stderr_excerpt":"BoilerplatePro/Resources/DesignSystemColors.xcassets/TextSecondary.colorset\n/home/daytona/workspace/apps/waketask-ios/SwiftAIBoilerplateProTests\n/home/daytona/workspace/apps/waketask-ios/SwiftAIBoilerplateProTests/WakeTask\n/home/daytona/workspace/apps/waketask-ios/SwiftAIBoilerplateProUITests\n/home/daytona/workspace/apps/waketask-ios/docs\n/home/daytona/workspace/apps/waketask-ios/docs/buyers\n/home/daytona/workspace/apps/waketask-ios/docs/checklists\n/home/daytona/workspace/apps/waketask-ios/docs/examples\n/home/daytona/workspace/apps/waketask-ios/docs/foundations\n/home/daytona/workspace/apps/waketask-ios/docs/integrations\n/home/daytona/workspace/apps/waketask-ios/docs/maintenance\n/home/daytona/workspace/apps/waketask-ios/docs/migrations\n/home/daytona/workspace/apps/waketask-ios/docs/modules\n/home/daytona/workspace/apps/waketask-ios/docs/prompts\n/home/daytona/workspace/apps/waketask-ios/docs/recipes\n/home/daytona/workspace/apps/waketask-ios/sast\n/home/daytona/workspace/apps/waketask-ios/scripts\n/home/daytona/workspace/apps/waketask-ios/scripts/assets\n/home/daytona/workspace/apps/waketask-ios/scripts/ci\n/home/daytona/workspace/apps/waketask-ios/scripts/local\n/home/daytona/workspace/apps/waketask-ios/scripts/qa\n/home/daytona/workspace/apps/waketask-ios/supabase\n/home/daytona/workspace/apps/waketask-ios/supabase/functions\n/home/daytona/workspace/apps/waketask-ios/supabase/functions/ai\n/home/daytona/workspace/apps/waketask-ios/supabase/migrations\n/home/daytona/workspace/evals/workflow-quality/baselines\n\nexec\n/bin/bash -lc \"find /home/daytona/workspace/evals/workflow-quality/baselines -maxdepth 4 -type f | sed -n '1,200p' && rg -n \\\"waketask|onboarding|home|paywall|history|streak|profile|create|active|completion\\\" /home/daytona/workspace/evals/workflow-quality/baselines -g'*.json'\" in /home/daytona/workspace\n exited 1 in 0ms:\n/home/daytona/workspace/evals/workflow-quality/baselines/enhancement-discovery-architecture.json\n/home/daytona/workspace/evals/workflow-quality/baselines/enhancement-discovery-spec.json\n/home/daytona/workspace/evals/workflow-quality/baselines/enhancement-discovery-workflow.json\n\ncodex\nBlocked by missing iOS simulator tooling in this worker, so I could not perform a valid capture run.\n\nEvidence:\n- `xcrun simctl ...` fails with: `xcrun: command not found`\n- Without `xcrun`/Xcode CLI tools, I cannot launch or control the simulator, navigate screens, or generate real PNG captures for:\n  - `onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, `paywall_subscription`\n\nI did not generate placeholder/blank screenshots or a fake manifest, because that would violate your capture requirements.\n\nNext step needed in this environment:\n1. Install/enable full Xcode command-line tools so `xcrun` and `xcodebuild` are available, then I can run the baseline capture end-to-end and write:\n- `reports/ios/screenshots/before/*.png`\n- `reports/ios/screenshots/manifest.json`\ntokens used\n50,926\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
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
- **design_opportunity_synthesis**: succeeded
  - Model: gpt-5.3-codex-spark, 248.5k tokens in / 12.6k out
- **reference_pack_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/reference-pack-gate.mjs`
  - Output:
    ```
    {"ok":true,"root":".workflow/iphone-app-ux-studio/research","use_mobbin_mcp":true,"counts":{"total_references":17,"competitor_flow_references":4,"mobbin_or_pageflows_references":8,"screen_types":9,"observations":6,"raw_assets":10},"required_artifacts":["existing-app-intake.md","reference-gap-analysis.json","competitor-flows.md","app-store-review-mining.md","mobbin-mcp-research.md","pageflows-research.md","apple-hig-research.md","behavioral-ux-research.md","design-opportunity-synthesis.md","reference-pack.json"],"failures":[]}
    ```
- **research_fanout**: succeeded
- **research_join**: succeeded
- **design_opportunity_synthesis**: succeeded
  - Model: gpt-5.3-codex-spark, 248.5k tokens in / 12.6k out
- **reference_pack_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/reference-pack-gate.mjs`
  - Output:
    ```
    {"ok":true,"root":".workflow/iphone-app-ux-studio/research","use_mobbin_mcp":true,"counts":{"total_references":17,"competitor_flow_references":4,"mobbin_or_pageflows_references":8,"screen_types":9,"observations":6,"raw_assets":10},"required_artifacts":["existing-app-intake.md","reference-gap-analysis.json","competitor-flows.md","app-store-review-mining.md","mobbin-mcp-research.md","pageflows-research.md","apple-hig-research.md","behavioral-ux-research.md","design-opportunity-synthesis.md","reference-pack.json"],"failures":[]}
    ```

## Context
- parallel.branch_count: 6
- parallel.fan_in.best_head_sha: 320224bf9334f8878a28c69e961951786eac8db1
- parallel.fan_in.best_id: app_store_review_mining
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"competitor_flow_research","status":"succeeded","head_sha":"5a6cdecb60a183d0afbd09cf2b45cd863b82e5f5"},{"id":"app_store_review_mining","status":"succeeded","head_sha":"320224bf9334f8878a28c69e961951786eac8db1"},{"id":"mobbin_mcp_research","status":"succeeded","head_sha":"911d95f2a90e1ad70fa3dcae051fe1f84ab0227d"},{"id":"pageflows_research","status":"succeeded","head_sha":"29272da615ef2b177ee3f639b1fe00f15b0b1207"},{"id":"apple_hig_research","status":"succeeded","head_sha":"a2f62a28221b9b5c35c432bef9ee775af065db2b"},{"id":"behavioral_ux_research","status":"succeeded","head_sha":"072c3e68721946e48bb878124027685b679c3f7a"}]


# UX Design Direction Candidate

You are one branch in the UX Studio design direction tournament. The same prompt is run by multiple agents with one of these direction labels:

- `calm_accountability_direction`
- `hard_wake_direction`
- `gamified_streak_direction`
- `minimal_native_direction`

Use the assigned direction label from your run context. Do not invent a fifth direction and do not collapse directions together.

Read all available context:

- `.workflow/iphone-app-ux-studio/preflight.json`
- `.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json`
- `.workflow/iphone-app-ux-studio/research/competitor-flows.md`
- `.workflow/iphone-app-ux-studio/research/app-store-review-mining.md`
- `.workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md`
- `.workflow/iphone-app-ux-studio/research/pageflows-research.md`
- `.workflow/iphone-app-ux-studio/research/apple-hig-research.md`
- `.workflow/iphone-app-ux-studio/research/behavioral-ux-research.md`
- `.workflow/iphone-app-ux-studio/research/design-opportunity-synthesis.md`
- any retrieved reference pack artifacts in `.workflow/iphone-app-ux-studio/design/`

Design a distinct iPhone UX direction for a wake/task app. Treat competitor and Mobbin/Pageflows material as pattern evidence only. Adapt principles, not assets, screenshots, branding, copy, or proprietary compositions.

## Required Output

Write your candidate to:

`.workflow/iphone-app-ux-studio/design/directions/<direction_label>.md`

The Markdown must include these headings exactly:

- `# Design Direction: <direction_label>`
- `## Target Emotion`
- `## Visual Principles`
- `## Colors And Tokens`
- `## Typography`
- `## Motion`
- `## Screen-By-Screen Implications`
- `## Monetization Implications`
- `## Accessibility Risks`
- `## Implementation Risks`
- `## Source List`
- `## What To Adapt`
- `## What Not To Copy`
- `## No Secret Output`

## Direction Requirements

Your candidate must define:

- target emotion: the feeling this direction should create in the first 10 seconds, in the wake state, and after task completion
- visual principles: layout density, contrast model, component shape language, information hierarchy, empty-state tone, and how this direction stays native to iOS
- colors and tokens: semantic token names, light/dark mode behavior, accent strategy, destructive states, success states, disabled states, and high-contrast fallback
- typography: Dynamic Type behavior, title/body/caption roles, numeric treatment, and minimum readable sizes
- motion: transition principles, reduce-motion behavior, haptics, animation timing ranges, and wake-state restraint
- screen-by-screen implications for onboarding, home, primary list, create/edit, active task, completion, history/streaks, profile/settings, and paywall/subscription
- monetization implications: what premium promise this direction supports, what should remain free, and how to avoid coercive dark patterns
- accessibility risks: VoiceOver, Dynamic Type, contrast, reduced motion, haptics-only feedback, cognitive load, and one-handed use
- implementation risks: SwiftUI complexity, custom component risk, animation risk, App Store risk, localization risk, and scope tradeoffs
- source list: every reference artifact or external source you used, with a short reason for relevance
- what_to_adapt: abstracted patterns, heuristics, or interaction ideas safe to adapt
- what_not_to_copy: specific visual layouts, assets, copy, brand systems, animations, or distinctive sequences that must not be cloned

## No Secret Output

Do not print, persist, summarize, or infer credentials, session tokens, private links, signed URLs, cookies, API keys, or user secrets. If a source contains secrets or private account information, write only: `secret material omitted`.

## Quality Bar

Make the direction opinionated enough that another agent can critique it adversarially. Avoid generic iOS advice. Every claim should connect to the app's wake-state use case, research evidence, or implementation constraints.
