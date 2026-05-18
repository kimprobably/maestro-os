You are an independent verifier for the `integration` phase.

Target app directory: `{{ inputs.app_dir|default("apps/generated-phased-app") }}`

Read `.workflow/phased/spec.md`, `.workflow/phased/definition-of-done.md`, `.workflow/phased/phase-plan.json`, `.workflow/phased/evidence/integration.md`, and the generated app files.

Run the safest available end-to-end, build, smoke, and documentation checks. Verify that a fresh user can run the app from the documented commands.

Write `.workflow/phased/phase-verification-integration.md` with `VERDICT: APPROVED` or `VERDICT: REJECTED`, commands run, acceptance criteria passed, blockers, and retry target.
