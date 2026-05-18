# Existing App Feature Implementation Plan

Map the approved feature spec onto exact code changes.

Read:

- `.workflow/existing-app-feature/spec/feature-spec.md`
- `.workflow/existing-app-feature/spec/feature-spec.json`
- `.workflow/existing-app-feature/audit/existing-app-audit.json`
- The existing app source in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`

This is a planning stage. Do not edit app source.

## Required Output

Write:

- `.workflow/existing-app-feature/implementation/implementation-plan.md`
- `.workflow/existing-app-feature/implementation/implementation-plan.json`

## Markdown Required Headings

Use these headings exactly:

- `# Feature Implementation Plan`
- `## File Map`
- `## Slice Plan`
- `## Data And State Changes`
- `## UI And Interaction Changes`
- `## Tests`
- `## Screenshots`
- `## CI`
- `## Rollback Plan`
- `## No Secrets`

## JSON Contract

`implementation-plan.json` must include:

```json
{
  "slices": [{"id": "string", "files": ["string"], "commands": ["string"], "acceptance_criteria": ["string"]}],
  "file_changes": [{"path": "string", "change": "string"}],
  "tests": [{"path_or_command": "string", "proves": "string"}],
  "screenshot_states": ["string"],
  "ci": {"workflow_paths": ["string"], "required_artifacts": ["string"]},
  "rollback_plan": ["string"]
}
```

## Constraints

- Use exact file paths.
- Preserve existing auth, payments, networking, storage, localization, bundle ID, and release configuration unless the feature spec explicitly requires a change.
- Include tests and evidence for every required capability.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
