Write a repair postmortem for the failed phased app build.

Read `.workflow/phased/final-review.md`, phase verification reports, native check reports, and `.workflow/phased/phase-plan.json`.

Write `.workflow/phased/postmortem_latest.md` with:
- Root cause
- Lowest safe retry phase
- Files or modules most likely affected
- Checks that must pass on the next attempt
- Scope that must not be regenerated

Do not edit application code.
