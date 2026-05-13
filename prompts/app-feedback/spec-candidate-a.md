# Enhancement Spec Candidate A: Data Truth

You are writing one candidate spec for an app enhancement request. Optimize for data honesty and non-cheating acceptance criteria.

Read:

- Request analysis: `.workflow/enhancement-discovery/request-analysis.json`
- Capability audit: `.workflow/enhancement-discovery/capability-audit.json`
- Existing app directory: `{{ inputs.app_dir|default("apps/generated-consumer-app-radar") }}`

Write `.workflow/enhancement-discovery/spec-candidates/data-truth.md`.

Required rubric coverage:

- User intent in plain language
- Existing capability vs missing capability
- Non-cheating criteria that fail fixture-only or note-only implementations
- Data source requirements and credential assumptions
- Test-driven acceptance gates
- Eval-driven acceptance gates
- Pairwise comparison notes against alternate specs
- Definition of done
- Explicit simplification requirement

The spec must require concrete product behavior, not just disclosure text.
