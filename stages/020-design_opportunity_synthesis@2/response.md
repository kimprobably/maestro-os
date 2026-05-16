Updated both artifacts in place.

- [`.workflow/iphone-app-ux-studio/research/design-opportunity-synthesis.md`](/home/daytona/workspace/.workflow/iphone-app-ux-studio/research/design-opportunity-synthesis.md)  
  - Rewrote with all required headings, source-policy constraints, WakeTask-mode coverage (calm setup / urgent wake / reward-accountability), source-backed weakness synthesis, top screens, visual principles, anti-patterns, and adaptation/copy-avoidance sections.

- [`.workflow/iphone-app-ux-studio/research/reference-pack.json`](/home/daytona/workspace/.workflow/iphone-app-ux-studio/research/reference-pack.json)  
  - Replaced with strict JSON containing:  
    - `references`: 15 entries  
    - `observations`: 6 entries  
    - `screen_types`: 8 entries  
    - `raw_assets`: 10 entries, each with `"private_only": true`  
  - Includes required source coverage (`competitor`, `pageflows`, `mobbin`, `app_store`, `apple_hig`, `behavioral_research`, `synthesis`) and required gate predicates for competitor-flow and pageflows/mobbin detections.

If you want, I can now run the reference-pack gate check script and patch any remaining deterministic validation mismatches automatically.