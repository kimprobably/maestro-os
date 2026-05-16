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
    {"ok":true,"action":"cloned","repo_url":"https://github.com/kimprobably/waketask-ios.git","base_branch":"main","run_branch":"ux-studio/waketask-20260516-175632","app_dir":"apps/waketask-ios","sha":"3b035f2ff8f28e4262315f4e10b9eaaa3b479a6d","failures":[]}
    ```
- **existing_app_intake**: succeeded
  - Model: anthropic/claude-haiku-4-5, 993.3k tokens in / 16.6k out
  - Files: /home/daytona/workspace/.workflow/iphone-app-ux-studio/research/existing-app-intake.md, /home/daytona/workspace/.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json
- **baseline_screenshot_capture**: succeeded
  - Script: `node scripts/iphone-app-factory/run-codex-prompt.mjs --prompt prompts/iphone-app-factory/ux-baseline-screenshot-capture.md --stage baseline-screenshot-capture --out .workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.json`
  - Output:
    ```
    {"ok":true,"stage":"baseline-screenshot-capture","model":"gpt-5.3-codex","prompt_path":"/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md","rendered_prompt_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.prompt.md","last_message_path":"/home/daytona/workspace/.workflow/iphone-app-ux-studio/codex/baseline-screenshot-capture.last-message.md","status":0,"signal":null,"stdout_excerpt":"Blocked: baseline screenshot capture cannot be executed in this worker because iOS simulator tooling is unavailable.\n\nWhat I verified:\n- `xcrun` is not installed (`xcrun: command not found`), so `simctl`/simulator screenshot capture is impossible here.\n- No existing baseline screen images or prior `reports/ios/screenshots/before/*.png` artifacts exist in the repo to reuse.\n- Required workflow prompt is present, but there is no alternate capture script that works without Xcode/simulator.\n\nBecause of that, I did not fabricate screenshots or manifest entries (would violate your reject criteria for blank/missing/indistinguishable captures).\n\nNext step to unblock:\n1. Run this stage on a macOS worker with Xcode + `xcrun simctl` available (or provide pre-captured screen artifacts), then I can generate `reports/ios/screenshots/manifest.json` immediately from those real captures.\n","stderr_excerpt":"orts/ios/screenshots/manifest.json`.\n/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md:27:      \"screen_key\": \"home\",\n/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md:29:      \"image_path\": \"reports/ios/screenshots/before/home.png\",\n/home/daytona/workspace/prompts/iphone-app-factory/ux-baseline-screenshot-capture.md:42:- `screen_key` must be one of the required keys.\n/home/daytona/workspace/prompts/iphone-app-factory/ux-apple-hig-research.md:3:Research Apple Human Interface Guidelines and relevant Apple developer guidance for this app type, then write the artifact to `.workflow/iphone-app-ux-studio/research/apple-hig-research.md`.\n/home/daytona/workspace/prompts/iphone-app-factory/ux-app-store-review-mining.md:3:Mine public App Store reviews for the target product category and write the artifact to `.workflow/iphone-app-ux-studio/research/app-store-review-mining.md`.\n/home/daytona/workspace/apps/waketask-ios/docs/foundations/TestingStrategy.md:148:xcrun xccov view --report .build/Logs/Test/*.xcresult\n/home/daytona/workspace/apps/waketask-ios/docs/foundations/TestingStrategy.md:375:- Reset simulator: `xcrun simctl erase all`\n/home/daytona/workspace/apps/waketask-ios/docs/CLAUDE.md:28:When running through Xcode MCP (e.g., via `xcrun mcpbridge`), use Xcode MCP tools directly:\n/home/daytona/workspace/apps/waketask-ios/docs/CLAUDE.md:40:claude mcp add --transport stdio xcode -- xcrun mcpbridge\n/home/daytona/workspace/apps/waketask-ios/docs/CLAUDE.md:68:The project file is `SwiftAIBoilerplatePro.xcodeproj` and the scheme is `SwiftAIBoilerplatePro`. Always specify `-project` and a simulator destination for iOS builds. If the named simulator is not available, use `xcrun simctl list devices available` to find one.\n/home/daytona/workspace/apps/waketask-ios/LOCAL_TESTING.md:76:xcrun simctl boot \"iPhone 17 Pro Max\"\n/home/daytona/workspace/apps/waketask-ios/LOCAL_TESTING.md:77:xcrun simctl bootstatus booted -b\n/home/daytona/workspace/apps/waketask-ios/LOCAL_TESTING.md:83:xcrun simctl shutdown all\n\ncodex\nBlocked: baseline screenshot capture cannot be executed in this worker because iOS simulator tooling is unavailable.\n\nWhat I verified:\n- `xcrun` is not installed (`xcrun: command not found`), so `simctl`/simulator screenshot capture is impossible here.\n- No existing baseline screen images or prior `reports/ios/screenshots/before/*.png` artifacts exist in the repo to reuse.\n- Required workflow prompt is present, but there is no alternate capture script that works without Xcode/simulator.\n\nBecause of that, I did not fabricate screenshots or manifest entries (would violate your reject criteria for blank/missing/indistinguishable captures).\n\nNext step to unblock:\n1. Run this stage on a macOS worker with Xcode + `xcrun simctl` available (or provide pre-captured screen artifacts), then I can generate `reports/ios/screenshots/manifest.json` immediately from those real captures.\ntokens used\n25,323\n","codex_auth_installed":true,"codex_mcp_credentials_installed":true,"codex_mobbin_mcp":{"configured":false,"skipped":true,"status":null},"failures":[]}
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
- **design_opportunity_synthesis**: failed

## Context
- failure_class: deterministic
- failure_signature: design_opportunity_synthesis|deterministic|api_deterministic|openrouter|invalid_request
- parallel.branch_count: 6
- parallel.fan_in.best_head_sha: 30e220300a224742cd9dca7d2508968e976c0c3c
- parallel.fan_in.best_id: app_store_review_mining
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"competitor_flow_research","status":"succeeded","head_sha":"992cc7631c934cf2411ca2f5ac24062e69e30b91"},{"id":"app_store_review_mining","status":"succeeded","head_sha":"30e220300a224742cd9dca7d2508968e976c0c3c"},{"id":"mobbin_mcp_research","status":"succeeded","head_sha":"3b5270bfb18ebb7bac61f849150a1531328dbfe2"},{"id":"pageflows_research","status":"succeeded","head_sha":"61c7b4c91c5a2efbee0704eb8972003a91537905"},{"id":"apple_hig_research","status":"succeeded","head_sha":"c327920822876ba464e9a85d43524197327a3baa"},{"id":"behavioral_ux_research","status":"succeeded","head_sha":"30f55a475526ee58073d8a0db5a6c269830582c6"}]


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
