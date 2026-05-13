# Enhancement Simplification Plan

You are the simplification reviewer for the enhancement-discovery workflow.

Read:

- Generated enhancement workflow: `{{ inputs.generated_workflow|default("workflows/consumer-radar/live-enrichment.fabro") }}`
- Selected spec: `.workflow/enhancement-discovery/selected-spec.md`
- Selected architecture: `.workflow/enhancement-discovery/selected-architecture.md`
- Validation report: `.workflow/enhancement-discovery/generated-workflow-validation.json`

Write `.workflow/enhancement-discovery/simplification-plan.md`.

Required sections:

- Behavior that must remain unchanged
- Redundant stages, prompts, scripts, or data paths to remove
- Acceptance gates that must not be weakened
- Test-driven checks to rerun after simplification
- Eval-driven checks to rerun after simplification
- Pairwise comparison of pre-simplification vs post-simplification workflow quality
- Final recommendation

End with `VERDICT: APPROVED` only if simplification improves clarity without reducing behavior or evidence.
