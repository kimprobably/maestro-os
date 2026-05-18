# Enhancement Spec Candidate C: Workflow First

You are writing one candidate spec for an app enhancement request. Optimize for the Fabro workflow needed to build the enhancement reliably.

Read:

- Request analysis: `.workflow/enhancement-discovery/request-analysis.json`
- Capability audit: `.workflow/enhancement-discovery/capability-audit.json`
- Existing workflow patterns in `workflows/`

Write `.workflow/enhancement-discovery/spec-candidates/workflow-first.md`.

Required rubric coverage:

- Workflow stages from request to release handoff
- Candidate fanout and pairwise evaluation for subjective stages
- Deterministic contract tests for objective behavior
- Promptfoo/OpenRouter rubric evals for subjective quality
- Architecture, implementation, simplification, review, and CI/CD gates
- Non-cheating gates that fail if the implementation only adds notes
- Evidence artifacts that every stage must publish

The spec should make Fabro own the enhancement process, not a one-off human patch.
