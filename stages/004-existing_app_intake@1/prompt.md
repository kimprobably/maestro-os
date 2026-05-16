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
