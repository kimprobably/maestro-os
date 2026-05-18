# Factory Work Package Agent

Read:

- `{{ inputs.spec_path|default("specs/factory/goal-to-production-spec.md") }}`
- `.maestro/factory/architecture.md`
- `.maestro/factory/adr.md`

Write `.maestro/factory/work-packages.json`.

Schema:

```json
{
  "packages": [
    {
      "id": "wp-001",
      "title": "short title",
      "owner": "implementation-agent",
      "files": [],
      "requirements": [],
      "verification": [],
      "reviewers": []
    }
  ],
  "dependencies": [],
  "linear_issues": []
}
```

Package boundaries must be disjoint where possible. Include reviewer and
verification expectations for each package.
