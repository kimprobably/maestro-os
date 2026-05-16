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
  - Model: gpt-5.3-codex-spark, 1.9m tokens in / 26.1k out
- **reference_pack_gate**: failed
  - Script: `node scripts/iphone-app-factory/reference-pack-gate.mjs`
  - Output:
    ```
    (7 lines omitted)
        "mobbin_or_pageflows_references": 4,
        "screen_types": 8,
        "observations": 6,
        "raw_assets": 6
      },
      "required_artifacts": [
        "existing-app-intake.md",
        "reference-gap-analysis.json",
        "competitor-flows.md",
        "app-store-review-mining.md",
        "mobbin-mcp-research.md",
        "pageflows-research.md",
        "apple-hig-research.md",
        "behavioral-ux-research.md",
        "design-opportunity-synthesis.md",
        "reference-pack.json"
      ],
      "failures": [
        "missing competitor-flows.md",
        "missing app-store-review-mining.md",
        "missing pageflows-research.md",
        "missing apple-hig-research.md",
        "missing behavioral-ux-research.md"
      ]
    }
    ```

## Context
- failure_class: deterministic
- failure_signature: reference_pack_gate|deterministic|script failed with exit code: <n> ## output { "ok": false,"root": ".workflow/iphone-app-ux-studio/research","use_mobbin_mcp": true,"counts": { "total_references": <n>,"competitor_flow_references": <n>,"mobbin_or_pageflows_references": <n>,"
- parallel.branch_count: 6
- parallel.fan_in.best_head_sha: cf62b4e2859df1db6f74d11933dd4cb423e0bada
- parallel.fan_in.best_id: app_store_review_mining
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"competitor_flow_research","status":"succeeded","head_sha":"cf1025c53aa3889bd404c4a902d3d497af391086"},{"id":"app_store_review_mining","status":"succeeded","head_sha":"cf62b4e2859df1db6f74d11933dd4cb423e0bada"},{"id":"mobbin_mcp_research","status":"succeeded","head_sha":"3662f4cf11378ee1d04de1090ed76cf9f0ab3e3e"},{"id":"pageflows_research","status":"succeeded","head_sha":"0a2ae17a7ed0947a83aaf63f60cc643bb9319643"},{"id":"apple_hig_research","status":"succeeded","head_sha":"bfecac98a2318a17f30f9c976eebbef2c966d138"},{"id":"behavioral_ux_research","status":"succeeded","head_sha":"238c4b908c8b3a129b9e01078c0b0e58906e8940"}]


# UX Behavioral Research

Research behavioral UX constraints for the product category and write the artifact to `.workflow/iphone-app-ux-studio/research/behavioral-ux-research.md`.

## Source Policy

- Use credible public sources, platform guidance, peer-reviewed or institution-backed material when available, and clearly labeled product evidence.
- Do not present medical, legal, financial, or psychological claims beyond the evidence.
- Do not output secrets, credentials, tokens, cookies, private keys, session values, or environment variable values.
- Do not clone proprietary screens, exact layouts, UI copy, brand identity, screenshots, or assets.

## Required Headings

Use these exact headings:

1. `# Behavioral UX Research`
2. `## Source Policy`
3. `## Source List`
4. `## User Motivation Constraints`
5. `## Friction And Commitment Patterns`
6. `## Reward And Accountability Patterns`
7. `## Risk And Harm Avoidance`
8. `## Screen Type Implications`
9. `## what_to_adapt`
10. `## what_not_to_copy`

## Required Content

- Tie each behavioral claim to a source or mark it as an inference.
- Identify constraints around motivation, habit formation, urgency, anxiety, avoidance, reward timing, and accountability.
- For alarm or WakeTask-like apps, distinguish calm setup behavior from urgent wake behavior and reward/accountability behavior.
- Under `## what_to_adapt`, describe behavior principles to apply.
- Under `## what_not_to_copy`, describe manipulative, coercive, unsafe, or unsupported patterns to avoid.
