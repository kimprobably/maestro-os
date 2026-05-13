You are an independent verifier for the `foundation` phase.

Target app directory: `{{ inputs.app_dir|default("apps/generated-phased-app") }}`

Read `.workflow/phased/spec.md`, `.workflow/phased/definition-of-done.md`, `.workflow/phased/phase-plan.json`, `.workflow/phased/evidence/foundation.md`, and the generated app files.

Run the safest available setup checks. Verify that the project has a real manifest, scripts or commands for later checks, and no fake green test path.

Write `.workflow/phased/phase-verification-foundation.md` with `VERDICT: APPROVED` or `VERDICT: REJECTED`, commands run, acceptance criteria passed, blockers, and retry target.
