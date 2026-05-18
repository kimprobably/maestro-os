# Workflow Candidate A: Direct Enhancement

Design a Fabro workflow that directly enhances the target app from the selected spec and architecture.

Read:

- `.workflow/enhancement-discovery/spec-candidates/`
- `.workflow/enhancement-discovery/architecture-candidates/`
- Existing app workflow files under `workflows/`

Write `.workflow/enhancement-discovery/workflow-candidates/direct-enhancement.md`.

Required rubric coverage:

- DOT graph stages
- Test-driven deterministic gates
- Eval-driven rubric gates
- Candidate fanout for spec/plan/review stages
- Non-cheating live behavior gates
- Code simplification stage before final review
- Pairwise comparison against a generated-subworkflow design
- CI/CD and handoff artifacts

The workflow must fail when a request requires real behavior but the implementation only adds explanatory copy.
