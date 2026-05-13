# Known Gotchas

Status: draft v0.1 for Tim review

## Secrets And Env Vars

Trailing whitespace/newlines in secrets have caused production auth and webhook failures. After setting secrets in any dashboard, verify the final byte and immediately test the integration.

Never echo or persist live keys in docs, logs, Slack messages, or run summaries.

## CORS And CSP

Browser API calls require both sides:

- API CORS allows the caller origin.
- Frontend CSP `connect-src` allows the API domain.

Updating one without the other creates silent browser failures while curl still works.

## Database Queries

Never use `select('*')`.

Do not assume columns exist from memory or another feature branch. Verify schema before adding column constants.

Supabase query builders are immutable; reassign filters.

`findByOwner`, `findByUser`, or similarly named functions must actually filter by that owner/user.

## Team Scope

Services and repos receive scope explicitly. Do not read cookies inside lower layers.

Records created in team mode must include the right team identifier, or they become invisible in team context.

Server components that depend on cookie/team scope may need dynamic rendering.

## Migrations

Use the repo migration wrapper. Do not create migrations in the wrong directory, edit existing migrations, run production pushes from feature branches, or apply raw schema changes in dashboards.

Destructive migrations happen after code stops using the old shape.

## UI

Radix Select items cannot use an empty-string value; use an explicit sentinel and map it back.

Use design-system tokens, not hardcoded neutral Tailwind colors.

Data-driven UI needs loading, empty, and error states.

Use "ingredients" for user-facing composable content inputs, not "primitives."

## GTM And Outreach

Probe before scaling list builds. A small scored probe catches bad ICP/search strategy before spending money.

Phone enrichment is opt-in only.

Human/visual review belongs before expensive enrichment when competitor filtering or fit judgment matters.

Do not lead Maestro positioning with AI cost savings. Lead with flexible recipe knowledge and how to wire the stack.

Do not surface DFY as an offer. New ladder: Bootcamp cohort, 1:1 coaching, setup-on-your-system.

PlusVibe custom variables are sent without the `custom_` prefix.

## Test Claims

Do not label failures as pre-existing based only on stashing the latest change. Verify against the branch base or a known clean baseline.

Do not present work as complete without fresh verification evidence.

## Agent Behavior

Use feature branches for implementation work.

Stop and re-plan when an approach fails. Do not brute-force retries down the same path.

Review agents produce findings. They do not rewrite code unless explicitly promoted into a fix-loop worker.

Worker agents should not write durable long-term memory directly.
