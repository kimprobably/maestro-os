Implement only the `foundation` phase for `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Read:
- `.workflow/phased/spec.md`
- `.workflow/phased/definition-of-done.md`
- `.workflow/phased/context-brief.md`
- `.workflow/phased/phase-plan.json`
- `.workflow/phased/native-foundation.json`, if present

Create or update the project scaffold, dependency manifest, scripts, tests directory, and any foundational configuration required by the plan. Keep the implementation minimal but real; no placeholder pass-through behavior.

After editing, run the fastest relevant checks from the phase plan. Write `.workflow/phased/evidence/foundation.md` with:
- Files created or changed
- Commands run and results
- Acceptance criteria covered
- Any unresolved risks
