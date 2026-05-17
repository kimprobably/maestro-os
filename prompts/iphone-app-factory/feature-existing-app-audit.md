# Existing App Feature Audit

Audit the existing app before any feature implementation begins.

Read:

- `.workflow/existing-app-feature/context/context-pack.json`
- `.workflow/existing-app-feature/research/research-pack.json` if present
- The app source in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`
- CI files, tests, UI tests, screenshot scripts, Appium/XCUITest assets, localization files, and release config.

## Required Output

Write:

- `.workflow/existing-app-feature/audit/existing-app-audit.md`
- `.workflow/existing-app-feature/audit/existing-app-audit.json`

## Markdown Required Headings

Use these headings exactly:

- `# Existing App Audit`
- `## Files Inspected`
- `## Current Behavior`
- `## Extension Points`
- `## Existing Tests`
- `## Build Baseline`
- `## Risks`
- `## No Secrets`

## JSON Contract

`existing-app-audit.json` must include:

```json
{
  "files_inspected": ["string"],
  "current_behavior": [{"area": "string", "summary": "string"}],
  "extension_points": [{"capability": "string", "files": ["string"], "notes": "string"}],
  "existing_tests": ["string"],
  "build_baseline": {"commands": ["string"], "result": "string", "failures": ["string"]},
  "risk_register": ["string"]
}
```

## Constraints

- Do not edit app source in this stage.
- Identify exact files and current behavior. Avoid hand-wavy file maps.
- Do not rebuild auth, payments, storage, networking, bundle identity, or release config unless the context explicitly requires it.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
