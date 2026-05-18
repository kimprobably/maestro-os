# Existing App Feature Context Intake

Create the reusable context package for an existing-app feature iteration.

Read:

- Run inputs from the environment.
- Any files listed in `FEATURE_CONTEXT_PATHS` or `UX_CONTEXT_PATHS`.
- Any local screenshot directories listed in those paths. Do not copy proprietary screenshots into public app code.
- Existing workflow artifacts if present.

This is not a generic app build. The app already exists. Your job is to turn the supplied product context into a precise context bundle that later stages can evaluate.

## Required Output

Write:

- `.workflow/existing-app-feature/context-intake.md`
- `.workflow/existing-app-feature/context/context-pack.json`

## Markdown Required Headings

Use these headings exactly:

- `# Feature Context Intake`
- `## Product Goal`
- `## Target User`
- `## Required Capabilities`
- `## Acceptance Criteria`
- `## Non-Goals`
- `## Source List`
- `## Reusable Artifacts`
- `## No Secrets`

## JSON Contract

`context-pack.json` must include:

```json
{
  "app_name": "string",
  "feature_goal": "string",
  "target_audience": "string",
  "required_capabilities": ["string"],
  "acceptance_criteria": ["string"],
  "non_goals": ["string"],
  "research_sources": ["string"],
  "context_paths": ["string"],
  "artifact_viewer_inputs": ["string"]
}
```

Use `FEATURE_REQUIRED_CAPABILITIES` as the required capability list when present. Do not remove or rename those capability ids.

## Constraints

- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
- Keep app specifics in this context artifact. Do not hardcode app specifics into reusable workflow files.
- Treat competitor screenshots, Mobbin references, Pageflows references, and App Store examples as private research material. Extract patterns and cite source metadata; do not copy assets or distinctive layouts.
