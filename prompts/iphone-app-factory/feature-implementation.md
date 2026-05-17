# Existing App Feature Implementation

Implement the approved feature spec in the existing app.

Read:

- `.workflow/existing-app-feature/spec/feature-spec.md`
- `.workflow/existing-app-feature/spec/feature-spec.json`
- `.workflow/existing-app-feature/implementation/implementation-plan.md`
- `.workflow/existing-app-feature/implementation/implementation-plan.json`
- The existing app source in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`

Make focused source changes. Do not turn this into a visual-only pass. The feature behavior must be wired, testable, and evidenced.

## Required Output

Write:

- `.workflow/existing-app-feature/implementation/implementation-evidence.md`
- `.workflow/existing-app-feature/implementation/implementation-evidence.json`

## Markdown Required Headings

Use these headings exactly:

- `# Feature Implementation Evidence`
- `## Changed Paths`
- `## Capability Coverage`
- `## Commands Run`
- `## Tests Run`
- `## Screenshot States`
- `## CI Notes`
- `## Residual Risks`
- `## No Secrets`

## JSON Contract

`implementation-evidence.json` must include:

```json
{
  "changed_paths": ["string"],
  "capability_coverage": [{"capability": "string", "code_changed": true, "test_or_validation": "string"}],
  "commands_run": ["string"],
  "tests_run": [{"command": "string", "result": "string"}],
  "screenshot_states": ["string"],
  "residual_risks": ["string"]
}
```

## Constraints

- Cover every capability from `FEATURE_REQUIRED_CAPABILITIES`.
- No empty actions. Every visible button/control must perform an action, navigate, show a disabled reason, or be removed.
- Preserve existing app foundations unless explicitly required.
- Update or add tests whenever behavior changes.
- Do not self-approve. Leave unresolved validation gaps under residual risks.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
