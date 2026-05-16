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
- **design_direction_fanout**: succeeded
- **design_direction_join**: succeeded
- **design_cross_critique**: succeeded
  - Model: gpt-5.3-codex, 141.0k tokens in / 2.3k out
- **design_tournament_consensus**: succeeded
  - Model: gpt-5.3-codex, 187.5k tokens in / 5.2k out
- **design_tournament_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/design-tournament-gate.mjs`
  - Output:
    ```
    {"ok":true,"consensus_path":".workflow/iphone-app-ux-studio/design/tournament-consensus.json","out_path":".workflow/iphone-app-ux-studio/design/tournament-gate.json","direction_count":3,"winner":"calm_accountability_direction","required_scores":["differentiation","native_ios_quality","wake_state_usability","conversion_potential","accessibility","implementation_risk","visual_distinctiveness"],"required_screen_ids":["onboarding","home","primary_list","create_edit","active_task","completion","history_streaks","profile_settings","paywall_subscription"],"failures":[]}
    ```

## Context
- parallel.branch_count: 4
- parallel.fan_in.best_head_sha: 0ad8d4c3e55f462ce0e1070c518360be4990ff6e
- parallel.fan_in.best_id: calm_accountability_direction
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"calm_accountability_direction","status":"succeeded","head_sha":"0ad8d4c3e55f462ce0e1070c518360be4990ff6e"},{"id":"hard_wake_direction","status":"succeeded","head_sha":"351197bdbd5d49a8e3a085f56b9e95e0086dcb5f"},{"id":"gamified_streak_direction","status":"succeeded","head_sha":"00f8cf7cbaded9d6cd4c778c59398c66f59ca1a7"},{"id":"minimal_native_direction","status":"succeeded","head_sha":"d30788f2007a7e49d15dd10516e18c154869342b"}]


# UX Screen Spec

Read:

- `.workflow/iphone-app-ux-studio/design/tournament-consensus.md`
- `.workflow/iphone-app-ux-studio/design/tournament-consensus.json`
- `.workflow/iphone-app-ux-studio/design/tournament-gate.json`
- all winning direction source material referenced by the tournament consensus

Convert the winning design direction into implementation-ready iPhone screen specs. Preserve the winning direction's target emotion, visual principles, tokens, accessibility commitments, monetization stance, and no-clone boundaries.

## Required Outputs

Write:

- `.workflow/iphone-app-ux-studio/design/screen-spec.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.json`

The Markdown is for implementation planning. The JSON is for downstream checks and screenshot review. Do not include Markdown fences in the JSON file.

## Required Screens

Create a spec for each screen:

- onboarding
- home
- primary list
- create/edit
- active task
- completion
- history/streaks
- profile/settings
- paywall/subscription

## Per-Screen Requirements

Every screen must include:

- purpose: the job this screen performs for the user
- hierarchy: ordered regions and the information priority from top to bottom
- primary action: the one action the screen optimizes for
- secondary actions: supporting actions and where they live
- empty state: what appears before user data exists
- loading state: what appears while data or entitlement state is loading
- error state: what appears when a save, sync, purchase, permission, or network operation fails
- copy direction: tone, example labels, avoided phrases, and localization constraints
- accessibility requirements: VoiceOver labels, focus order, Dynamic Type behavior, contrast, reduced motion, haptic alternatives, target sizes, and one-handed reach
- screenshot acceptance criteria: concrete visual checks a reviewer can apply to simulator screenshots

## Markdown Structure

`screen-spec.md` must include these headings exactly:

- `# UX Screen Spec`
- `## Winning Direction Summary`
- `## Global Visual System`
- `## Global Accessibility Requirements`
- `## Screens`
- `## Screenshot Acceptance Checklist`
- `## No-Clone Statement`
- `## No Secret Output`

Under `## Screens`, use one `###` subsection per required screen.

## JSON Schema

`screen-spec.json` must use this structure:

```json
{
  "winning_direction": "selected_direction_label",
  "global_visual_system": {
    "target_emotion": "Short summary.",
    "tokens": ["semantic token names"],
    "typography": "Dynamic Type and hierarchy summary.",
    "motion": "Motion and reduced-motion summary."
  },
  "screens": [
    {
      "id": "onboarding",
      "purpose": "The screen job.",
      "hierarchy": ["Top priority", "Second priority"],
      "primary_action": "Primary action label and behavior.",
      "secondary_actions": ["Secondary action and placement"],
      "states": {
        "empty": "Empty state behavior.",
        "loading": "Loading state behavior.",
        "error": "Error state behavior."
      },
      "copy_direction": "Tone, sample labels, avoided phrases, localization constraints.",
      "accessibility_requirements": ["Requirement"],
      "screenshot_acceptance_criteria": ["Concrete screenshot check"]
    }
  ],
  "no_clone_statement": "The screen specs adapt abstract patterns only and do not copy another app's assets, copy, brand, visual composition, screenshots, or proprietary interaction sequences."
}
```

Use the screen ids exactly: `onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, and `paywall_subscription`.

## Screenshot Acceptance Criteria Guidance

Acceptance criteria must be visible and testable from screenshots. Include checks for:

- the primary action is visible without scrolling on the intended screen
- text does not truncate at common Dynamic Type sizes unless explicitly allowed
- core status is understandable in dark mode and light mode
- no element depends on color alone
- loading and error states preserve layout stability
- paywall/subscription clearly separates free and premium value without dark patterns
- screens do not visually clone any named competitor or reference source

## No Secret Output

Do not print, persist, summarize, or infer credentials, session tokens, private links, signed URLs, cookies, API keys, or user secrets. If a source contains secrets or private account information, write only: `secret material omitted`.
