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
- **research_fanout**: partially_succeeded
- **research_join**: succeeded
- **design_opportunity_synthesis**: failed
- **research_fanout**: partially_succeeded
- **research_join**: succeeded

## Context
- parallel.branch_count: 6
- parallel.fan_in.best_head_sha: 7cf6a0229b6c1190eb5a07bf10529a0ee6c8fb02
- parallel.fan_in.best_id: mobbin_mcp_research
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"competitor_flow_research","status":"failed","head_sha":"bb939713b8e8ca4eea95e810076e414bf2fa290d"},{"id":"app_store_review_mining","status":"failed","head_sha":"e4a11a21c815ea53947286f2abbeb19a35bcead6"},{"id":"mobbin_mcp_research","status":"succeeded","head_sha":"7cf6a0229b6c1190eb5a07bf10529a0ee6c8fb02"},{"id":"pageflows_research","status":"failed","head_sha":"8f303342102179e93696b6052d50e035e1a72691"},{"id":"apple_hig_research","status":"failed","head_sha":"aedd0537fcd027e04c7c0bb103ef9f35ff84a400"},{"id":"behavioral_ux_research","status":"failed","head_sha":"82b66594f98b85de0a9c4c4f4fecc11b54cca984"}]


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
