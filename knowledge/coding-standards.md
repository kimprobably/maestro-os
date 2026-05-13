# Coding Standards

Status: draft v0.1 for Tim review

## File Shape

Every new source file starts with a module header:

```ts
/**
 * Name.
 * Purpose.
 * Constraint: what this file must not import or do.
 */
```

Files over roughly 50 lines use section dividers. Keep a predictable order:

1. Imports
2. Types and constants
3. Read operations
4. Write operations
5. Error/status helpers

Import order:

1. External packages
2. Workspace packages
3. App absolute imports
4. Type-only imports

Use literal unions instead of TypeScript enums.

## Layering

Route handlers:
- Auth, scope, parse, call service, respond.
- Target under 30 lines per handler.
- Never contain business logic.
- Every non-public route checks auth.
- Admin routes also check admin access.
- Webhooks verify signatures/secrets and fail closed.

Services:
- Accept explicit scope/context as parameters.
- Own business rules, validation, orchestration, and side-effect coordination.
- Never import HTTP request/response helpers.
- Use discriminated unions for complex domain outcomes or `Error` with `statusCode` for simple services.

Repositories:
- Own database queries only.
- Use explicit column constants; never `select('*')`.
- Return `null` for not-found reads unless the contract says otherwise.
- Trust services to validate inputs.
- Never import services, route code, or client components.

UI:
- No raw data fetching in React components when an API module, server component, or hook should own it.
- Extract hooks when state becomes hard to scan.
- Avoid components over 300 lines.
- Use design-system tokens, not hardcoded gray/zinc/slate palettes.
- Provide loading, empty, and error states for data-dependent surfaces.

## Data And Validation

Use explicit input types such as `*Filters`, `*InsertInput`, `*UpdateInput`, and `*Result`.

Every update path uses an `ALLOWED_UPDATE_FIELDS` whitelist. Never spread request bodies into database writes.

Validate API bodies with Zod or the repo-standard schema library before processing. Normalize emails and similar identity fields before passing to services.

Use `??`, not `||`, for defaults. Use `value != null`, not truthy checks, when checking existence.

When using Supabase query builders, reassign chained filters because the builder is immutable.

## Errors And Logging

Never write empty `catch {}` blocks.

Use structured logging with context and metadata. Include run ids, tenant/team ids, record ids, stage names, and provider names when available.

Side effects that should not block the main operation must be isolated and commented with intent.

## Tests

Every new feature includes tests before it is considered complete.

Minimum expectations:
- Schema validation tests for new/changed schemas.
- Route tests for auth, validation, happy path, and error path.
- Service tests for business rules.
- Regression tests for bugs.

Mock service modules, not global `fetch`.

When claiming test failures are pre-existing, verify against the branch base, not only by stashing the latest change.

## Security And Integrations

Secrets and webhook signatures use timing-safe comparison where applicable.

Check environment variables for trailing whitespace/newlines after setting them in dashboards.

All APIs should be agent-ready unless explicitly impossible: session auth for UI, API-key or MCP-compatible paths for agents.

Phone enrichment is opt-in only. Email enrichment is the default.

PlusVibe custom variables are sent without the `custom_` prefix.

## Review Checklist

- No empty catches.
- No raw console logging where structured logging exists.
- No `select('*')`.
- No business logic in route handlers.
- No raw request-body spread into writes.
- No hardcoded Tailwind neutral colors in design-system UI.
- No missing auth, scope, or webhook verification.
- No CORS changes without matching CSP changes.
- No generated code that assumes columns or tables exist without schema verification.
