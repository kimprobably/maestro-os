# Workflow Candidate B: Generated Subworkflow

Design a Fabro workflow that first generates an app-specific enhancement workflow, then validates or runs it.

Read:

- `.workflow/enhancement-discovery/spec-candidates/`
- `.workflow/enhancement-discovery/architecture-candidates/`
- Existing app workflow files under `workflows/`

Write `.workflow/enhancement-discovery/workflow-candidates/generated-subworkflow.md`.

Required rubric coverage:

- Parent workflow stages
- Generated child workflow stages
- Test-driven deterministic gates
- Eval-driven rubric gates and pairwise comparison
- Non-cheating live data gates
- Code simplification stages in both parent and child workflows
- Retry targets and handoff artifacts
- CI/CD and model-review fanout

The workflow should be reusable for future apps, not only Consumer Radar.
