# Existing App Feature Research Synthesis

Build a reusable research pack for the feature iteration.

Read:

- `.workflow/existing-app-feature/context-intake.md`
- `.workflow/existing-app-feature/context/context-pack.json`
- Existing design corpus/reference artifacts if present.
- Mobbin MCP references when available.
- App Store, web, Pageflows, and supplied local screenshots when relevant.

Use internet and MCP tools available to you. If a source is unavailable, record the gap and continue with the best available evidence.

## Required Output

Write:

- `.workflow/existing-app-feature/research/research-synthesis.md`
- `.workflow/existing-app-feature/research/research-pack.json`

## Markdown Required Headings

Use these headings exactly:

- `# Feature Research Synthesis`
- `## Sources`
- `## Feature Opportunities`
- `## UI Patterns`
- `## Behavioral Patterns`
- `## What To Adapt`
- `## What Not To Copy`
- `## Reusable Artifacts`
- `## Research Gaps`
- `## No Secrets`

## JSON Contract

`research-pack.json` must include:

```json
{
  "sources": [{"type": "string", "title": "string", "url_or_path": "string", "notes": "string"}],
  "feature_opportunities": ["string"],
  "ui_patterns": ["string"],
  "behavioral_patterns": ["string"],
  "what_to_adapt": ["string"],
  "what_not_to_copy": ["string"],
  "artifact_viewer_inputs": ["string"],
  "research_gaps": ["string"]
}
```

## Constraints

- Use Mobbin MCP for UI references when configured.
- Preserve reusable source metadata and derived observations.
- Do not place raw competitor/Mobbin screenshots into app source.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
