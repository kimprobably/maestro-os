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
