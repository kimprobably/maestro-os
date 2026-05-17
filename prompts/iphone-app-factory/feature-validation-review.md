# Existing App Feature Validation Review

Review the feature implementation evidence and produce validation artifacts.

Read:

- `.workflow/existing-app-feature/spec/feature-spec.json`
- `.workflow/existing-app-feature/implementation/implementation-evidence.json`
- `.workflow/existing-app-feature/validation/*.json` if present
- App test, CI, screenshot, and Appium artifacts in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`

## Required Output

Write:

- `.workflow/existing-app-feature/validation/validation-review.md`
- `.workflow/existing-app-feature/validation/validation-review.json`

## Required Headings

Use these headings exactly:

- `# Feature Validation Review`
- `## Build Evidence`
- `## Test Evidence`
- `## Screenshot Evidence`
- `## Capability Verdicts`
- `## Release Risks`
- `## No Secrets`

## JSON Contract

`validation-review.json` must include:

```json
{
  "ok": true,
  "build_evidence": ["string"],
  "test_evidence": ["string"],
  "screenshot_evidence": ["string"],
  "capability_verdicts": [{"capability": "string", "verdict": "passed|failed|deferred", "evidence": "string"}],
  "release_risks": ["string"]
}
```

## Constraints

- Do not mark the implementation passed if build/test evidence is missing and deferral is disabled.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
