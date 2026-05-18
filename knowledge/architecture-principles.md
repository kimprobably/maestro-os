# Architecture Principles

Status: draft v0.1 for Tim review

Sources:
- `/Users/timlife/CLAUDE.md`
- `/Users/timlife/.claude/projects/-Users-timlife/memory/coding-quality-standards.md`
- `/Users/timlife/.claude/projects/-Users-timlife/memory/advanced-patterns.md`
- `/Users/timlife/.claude/projects/-Users-timlife/memory/feedback_*.md`
- `/Users/timlife/Documents/claude code/mas-platform/CLAUDE.md`

## 1. Design For The Reader

Prefer code and workflows that a future human or agent can understand in a quick skim.

Do:
- Use predictable structure, plain names, typed inputs, and section dividers in larger files.
- Put constraints in module headers and workflow metadata.
- Keep routes, stages, and agents small enough to inspect.

Do not:
- Hide important behavior in clever expressions, implicit context, or long mixed-concern files.
- Make reviewers infer ownership boundaries from implementation details.

## 2. Constrain Before Building

Every module, workflow, and agent role should state what it cannot do.

Do:
- Declare forbidden imports, write scopes, side effects, and approval boundaries.
- Give each worker an explicit file ownership set.
- Require STOP gates before irreversible operations.

Do not:
- Let services reach into HTTP context.
- Let workers write outside their assigned scope.
- Let generated workflows send, merge, delete, migrate, or deploy without a human gate.

## 3. Make Implicit Context Explicit

Important assumptions belong in parameters, types, constants, metadata, or memory briefs.

Do:
- Pass scope, persona, namespace, run id, and tenant/team context explicitly.
- Use named column constants and allowed-field whitelists.
- Include source labels when memory or context affects a decision.

Do not:
- Pull user/team context from cookies inside lower layers.
- Depend on ambient local agent memory.
- Let workflow stages infer business-critical defaults silently.

## 4. Build Layers, Not Features

Put behavior in the layer where it belongs before adding product surface.

Do:
- Keep routes as auth -> parse -> service -> response.
- Keep services as business orchestration.
- Keep repositories as data access only.
- Keep Fabro as factory/runtime and use app frameworks such as Rig only for generated applications.

Do not:
- Put business logic in route handlers.
- Put database queries in UI components.
- Replace Fabro orchestration with app-level framework code.

## 5. Delete Before Adding

Before adding another abstraction, ask whether existing code can become simpler.

Do:
- Extract hooks/components/services only when they remove real complexity.
- Prefer fewer well-named files over scattered helper layers.
- Remove obsolete paths after migration plans say they are safe to remove.

Do not:
- Add wrapper layers to avoid understanding the existing code.
- Keep duplicate sync comments when a shared constant would remove drift.

## 6. Fail Loudly

Errors should be structured, visible, and attached to context.

Do:
- Log errors with context, ids, stage names, and run ids.
- Return validation failures distinctly from infrastructure failures.
- Make workflow failures post a persona message with what failed and what to do next.

Do not:
- Write empty `catch {}` blocks.
- Swallow failed validation or quality gates.
- Treat missing auth, missing env, or malformed input as success.

## 7. Quarantine Side Effects

Core operations should not be held hostage by secondary side effects.

Do:
- Keep audit logging, edit capture, webhooks, and memory writes isolated when they are not part of the primary transaction.
- Use idempotency keys for state-changing operations.
- Record side-effect failures without corrupting the primary result.

Do not:
- Let optional memory writes fail a successful user action.
- Let webhook delivery block a save unless delivery is the product action.

## 8. Enforce One-Way Dependencies

Dependencies flow down, not sideways or backward.

Do:
- Route -> service -> repo -> database.
- Workflow -> CLI/tool -> service.
- Agent prompt -> approved brief/spec -> bounded file edits.

Do not:
- Import server code into client components.
- Let repos call services.
- Let a reviewer mutate code unless the workflow explicitly promotes it into a fix worker.

## 9. Prefer Predictability Over Cleverness

Consistent structure beats novelty.

Do:
- Use literal union types rather than TypeScript enums.
- Use switch statements for small known provider sets.
- Use direct module imports in apps; reserve barrels for package entry points.

Do not:
- Use dynamic registries when a small explicit list is clearer.
- Hide agent role behavior behind vague "do your best" prompts.

## 10. Define The Negative Space

Architecture quality comes from knowing what must not happen.

Do:
- Use whitelists for DB updates, allowed workflow actions, approved memory writers, and deployed surfaces.
- Probe before scaling expensive GTM list builds.
- Require visual/human review before spending enrichment credits at scale.

Do not:
- Use blocklists as the only protection.
- Let generated workflows spend money or enrich phones by default.
- Let long-term memory accept unreviewed worker conclusions.
