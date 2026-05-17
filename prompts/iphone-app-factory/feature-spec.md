# Existing App Feature Spec

Write the product feature spec for an existing app.

Read:

- `.workflow/existing-app-feature/context/context-pack.json`
- `.workflow/existing-app-feature/research/research-pack.json`
- `.workflow/existing-app-feature/audit/existing-app-audit.json`

The spec must be implementation-grounded. It should define product behavior, data/model changes, user flows, acceptance criteria, non-goals, and validation. It must not be a generic UX polish pass.

## Required Output

Write:

- `.workflow/existing-app-feature/spec/feature-spec.md`
- `.workflow/existing-app-feature/spec/feature-spec.json`

## Markdown Required Headings

Use these headings exactly:

- `# Existing App Feature Spec`
- `## Feature Goal`
- `## Target User`
- `## Required Capabilities`
- `## User Flows`
- `## Data And State`
- `## Acceptance Criteria`
- `## Implementation Slices`
- `## Validation Plan`
- `## Non-Goals`
- `## Risks`
- `## No Secrets`

## JSON Contract

`feature-spec.json` must include:

```json
{
  "feature_goal": "string",
  "target_audience": "string",
  "required_capabilities": ["string"],
  "user_flows": [{"id": "string", "steps": ["string"], "success_state": "string"}],
  "data_and_state": [{"name": "string", "change": "string"}],
  "acceptance_criteria": ["string"],
  "implementation_slices": [{"id": "string", "goal": "string", "depends_on": ["string"]}],
  "validation_plan": {"build": ["string"], "tests": ["string"], "screenshots": ["string"], "ci": ["string"]},
  "non_goals": ["string"],
  "risks": ["string"]
}
```

## Constraints

- Include every capability from `FEATURE_REQUIRED_CAPABILITIES`.
- Ground the spec in the existing audit file map.
- Keep competitor and Mobbin references abstract. Do not copy assets, copy, brand identity, or distinctive compositions.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
