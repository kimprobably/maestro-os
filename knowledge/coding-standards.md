# Coding Standards

The **code-level** rubric for the GTM Client Lead Loop product — how a file,
function, and module are written. The *architecture-level* rubric is the
[Engineering Charter](../specs/engineering-charter.md); this doc is its
invariant #8. The factory's `review-change` step and human review enforce
both. Workflow authoring has its own doc — `knowledge/workflow-standards.md`.

Consolidated from the coding-standards kit (10 principles + anti-patterns,
distilled from the prior platform, the global `CLAUDE.md`, and the OpenAI
team's harness-engineering practice), re-anchored to this product's
architecture. Code examples are illustrative — the principle is what binds.

## How code is layered in maestro-os

Dependencies flow one direction. A layer may call the layer below it, never
above:

```
binding (CLI / HTTP)  →  command handler  →  service  →  repo / vault
```

- **Binding** — CLI or HTTP. Parses input to the command's typed shape, calls
  the handler, serializes the typed output. No product logic. Thin.
- **Command handler** — one registered command. Validates input/output against
  its Zod contract, orchestrates. The command is the *only* way another
  component reaches this one (the platform rule — Charter invariant 1).
- **Service** — business rules, validation, orchestration, side-effect
  coordination. Never imports a binding type (no `NextRequest`, no argv).
- **Repo / vault** — data access only. Neon queries through the DataScope
  accessor; vault reads/writes through the grounded-node library. Explicit
  columns, never `select('*')`. Trusts the service to have validated.

AI pipelines are Fabro workflows, not service code (Charter invariant 4). A
command that wraps a workflow is a thin trigger.

## The 10 principles

1. **Design for the reader, not the writer.** Every file understandable in a
   10-second skim — JSDoc module header, section dividers in files > 50 lines,
   predictable order (types → constants → reads → writes → error helpers).
2. **Constrain before you build.** Define what a module *cannot* do before
   writing it. The JSDoc header states the constraint
   (`Never imports a binding type.`).
3. **Make the implicit explicit.** An assumption becomes a parameter, a type,
   or a constant. Pass scope explicitly; don't reach for ambient state.
4. **Build layers, not features.** Ask "what layer is this?" before writing.
   30 lines of query logic in a handler is a repo function in the wrong place.
5. **Delete before you add.** Can something be removed to make this simpler?
   Extract to a hook/function; shrink, don't bolt on.
6. **Write code that fails loudly.** No swallowed errors. `logError(context,
   error, metadata)` at minimum; surface to the caller when it matters.
7. **Side effects are quarantined.** Core logic is never hostage to a
   secondary concern — a side effect runs in its own `try/catch` with a
   comment stating it must not affect the main flow.
8. **Dependencies flow one direction.** Binding → handler → service → repo.
   Never backward. A service importing a binding type is a defect.
9. **Predictability over cleverness.** Every file of a kind has the same
   shape. No clever one-liners; no inconsistent structure.
10. **Think about what shouldn't happen.** Whitelists, not blocklists.
    `ALLOWED_UPDATE_FIELDS`, not `delete updates.id`. Define the negative
    space.

## Rules

**Error handling**
- Never an empty `catch {}`. At minimum `logError(context, error, metadata)`.
- Structured logging only — never raw `console.log`/`console.error`. Include
  run ids, tenant slug, record ids, stage names, provider names.
- Service errors carry a status: `Object.assign(new Error(msg), { statusCode: N })`,
  or a discriminated-union result for complex outcomes.
- A `CommandError` carries a stable `code`; bindings map `code` to their
  surface.

**Data access**
- Explicit column constants — never `select('*')` / `SELECT *`. A missing
  column must fail loudly, not silently.
- Typed inputs per domain: `*Filters`, `*InsertInput`, `*UpdateInput`,
  `*Result`.
- Every update path uses an `ALLOWED_UPDATE_FIELDS` whitelist. Never spread a
  request body into a write.
- Reads return `null` on not-found — the caller decides how to handle.
- Neon access only through the tenant-scoped DataScope accessor; RLS is the
  backstop. No raw cross-tenant or cross-component query (Charter invariants
  1, 3).

**Code organization**
- JSDoc module header on every new file: `/** Name. Purpose. Constraint. */`.
- Section dividers (`// --- Name ---`) in files > 50 lines.
- Import order: external packages → workspace/`@mas`-style packages → `@/`
  absolute → type-only imports.
- Literal unions (`type Status = 'a' | 'b'`), not TypeScript `enum`.
- Use `??` for defaults (preserves `0`/`''`); `value != null` for existence,
  not truthy checks.

**Components (cockpit)**
- No raw `fetch()` in a component — use an API module, a hook, or a server
  component / the command-core HTTP binding.
- Extract state to a hook when it stops being scannable (~15 `useState`).
- No component over 300 lines — extract sub-components and hooks.
- Design-system tokens, never hardcoded `gray`/`zinc`/`slate`.
- Every data-dependent surface has loading, empty, and error states.

**Testing** (Charter invariant 7 — and every AI step has an eval)
- Every feature ships with tests before it is complete: schema-validation
  tests for new/changed schemas, command tests (input validation, happy path,
  error path), service tests for business rules, a regression test per bug.
- Mock the service/module layer, not `global.fetch`.
- When claiming a failure is pre-existing, verify against the branch base —
  not only by stashing the current change.

**Security**
- Secrets and webhook signatures: timing-safe comparison; fail closed.
- Check environment variables for trailing whitespace/newlines after setting
  them in any dashboard — a recurring incident class.
- Webhooks verify their signature before processing.
- Generated code never assumes a column or table exists without verifying the
  schema.

## Anti-pattern catalog

Common AI-generated smells and the fix:

| Anti-pattern | Why it's bad | Fix |
|---|---|---|
| Empty `catch {}` | Errors silently swallowed | `logError(context, error, metadata)` |
| `select('*')` / `SELECT *` | Silently breaks on a missing column | Named column constants |
| `console.log(error)` | Unstructured, no context | `logError('domain/fn', error, { … })` |
| `// SYNC: keep in sync with X` | Manual sync always drifts | Extract a shared constant, import it |
| Spreading a request body into a write | New field = security hole | `ALLOWED_UPDATE_FIELDS` whitelist |
| 300+ line component | Unreadable, untestable | Extract hooks + sub-components |
| Business logic in a binding handler | Can't test, can't reuse | Move to the service layer |
| `fetch()` in `useEffect` | Loading flash, no caching | API module + hook, or server component |
| TypeScript `enum` | Runtime code, poor narrowing | Literal union |
| Inline queries scattered in handlers | Untestable | A repo layer with typed functions |
| `Record<string, any>` everywhere | No type safety | A specific interface per domain |
| Mocking `fetch` in tests | Tests the mock, not the logic | Mock the service layer |
| A cross-component table read | Breaks the platform rule | Call that component's command |

## Validation, null, and testing patterns

**Validation** — Zod at the command boundary; the service re-checks business
rules; the repo trusts the service:

```ts
export const createItemSchema = z.object({
  email: z.string().email().max(255).transform((e) => e.toLowerCase().trim()),
  name: z.string().max(100).trim().optional(),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;
```

**Null** — reads return `null`; the caller decides; coalesce for defaults:

```ts
const item = await repo.findById(scope, id);
if (!item) throw Object.assign(new Error('Item not found'), { statusCode: 404 });
const limit = filters.limit ?? 50;
```

**Testing** — mock the layer below, exercise the layer under test:

```ts
// Mock the service; test the command handler's validation + error mapping —
// not the database.
vi.mock('../services/items.service');
```

## Review checklist

The factory's `review-change` step and human review check for:

- [ ] Empty catch blocks without logging
- [ ] Raw `console.log` instead of `logError()`
- [ ] `select('*')` / `SELECT *`
- [ ] Business logic in a binding handler (handlers stay thin)
- [ ] Raw `fetch()` in a React component
- [ ] A request body spread into a write without a field whitelist
- [ ] A component over 300 lines without extraction
- [ ] Missing JSDoc module header on a new file
- [ ] Missing typed interfaces for parameters/returns
- [ ] Dependencies flowing the wrong direction
- [ ] A cross-component table/file read instead of a command call
- [ ] A grounded-node write that skips the grounding validator
- [ ] An AI step shipped without an eval
- [ ] A new command without a Zod input/output contract
- [ ] CORS changes without matching CSP changes
