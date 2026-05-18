# Engineering Charter

## Purpose

This is the rulebook for how the GTM Client Lead Loop product is built: the
architectural invariants every spec obeys, how architectural decisions are
made and recorded, how they are kept true over time, and how a new capability
is added. It is the authoritative review rubric — the factory's
`review-change` step (Spec 0) and human review both enforce it.

It is not a feature spec. Specs 0–7 are *what* to build; this charter is *how*.
When the charter and a feature spec conflict, the charter wins — or the
conflict is a decision to be logged and the charter amended.

## The architectural invariants

These are non-negotiable. A change that violates one is either wrong or a
charter amendment (logged in the design doc's Decision Log).

1. **The platform rule.** Every capability is a command — a typed Zod contract
   in the registry. Commands are the *only* interface between components: no
   component reads another's Neon tables or vault files directly; no back
   doors, ever. Components own their data (declared tables + vault subdirs);
   the Component Ownership Lint enforces it. Command contracts are versioned.
   *Defined in Spec 1.*
2. **The grounded-node primitive.** Every unit of knowledge or content is a
   grounded node — one flat `<id>.md`, frontmatter + body, citing the layer
   below. One node schema, one grounding validator, one `human_edited` rule,
   one index pattern, at every layer. The citation graph is traceable both
   ways. *Defined in Spec 1.*
3. **The storage rule.** Two stores, split by access tempo. The vault (files
   on the per-tenant Daytona volume) holds grounded nodes — touched only by
   the operator and workflows, wake-tolerant. Neon (one shared project,
   tenant-scoped + RLS) holds operational state — touched by prospects in real
   time and always-on services. *Defined in the design doc; Specs 1, 5, 6.*
4. **The Fabro split rule.** Multi-step AI pipelines are Fabro workflows;
   deterministic CRUD and provisioning live in the TS command core; a command
   that wraps a workflow is a thin trigger.
5. **No review gate on generation.** The brain and campaign generation
   extract/generate, validate grounding, write, and continue. `human_edited`
   protects hand edits from regeneration. Quality is enforced by the grounding
   validator and evals, not by a human gate.
6. **Grounding is the quality floor.** Generated content cites real nodes;
   uncited content is dropped or flagged. Nothing is invented. The grounding
   validator is deterministic and shared.
7. **Evals at every layer.** No AI output ships without an eval, and the eval
   is the gate — an output below threshold is not accepted. Every AI step
   names its evals in its spec's Definition of Done. The eval suite is not
   static: Spec 7 harvests new regression cases from real human edits.
8. **The Coding Standards** (`knowledge/coding-standards.md`) are the
   code-level rubric — the 10 principles, the layering (binding → command
   handler → service → repo/vault), error handling, field whitelists, the
   anti-pattern catalog, the review checklist. This charter is the macro
   rubric (architecture, decisions, process); the Coding Standards are the
   micro rubric (how a file is written). The concise form lives in the global
   `CLAUDE.md`; the canonical detailed form is `knowledge/coding-standards.md`.

## How architectural decisions are made and recorded

Three records, each for a different scope. Use the smallest one that fits.

- **The design doc** (`docs/superpowers/specs/2026-05-16-gtm-client-lead-loop-design.md`)
  — the consolidated product vision and shape. The source of truth for *what*
  the product is. Updated when the product's shape changes.
- **The Decision Log** (a section of the design doc) — append-only, dated.
  *Every directional decision* gets an entry: the decision, the date, why, and
  **what was rejected**. Superseding entries are appended, not edited — history
  is preserved. This is the record that survives; the rest of the design doc
  shows only final state.
- **Per-spec ADRs** — a spec's `## ADR` section records the irreversible
  architecture calls scoped to that spec, and the open questions deferred to a
  build-time spike.

The ordering rule: **decision before code.** When the design changes, the
design doc and Decision Log are updated *first*, then the affected specs, then
the code. Code never silently diverges from a recorded decision.

## How decisions are maintained

Decisions stay true by *mechanical enforcement*, not vigilance:

- **Specs are the contract.** The factory builds from specs; its
  `review-change` step checks the code against the spec *and* this charter. A
  spec that no longer matches the design doc is fixed before it is built.
- **Lints enforce the invariants** — the Tenant Scope Lint (vault paths), the
  Component Ownership Lint (no cross-component data access), and
  `maestro verify workflow-quality` / `spec-quality`. A violation fails CI.
- **Evals enforce AI quality** — a regression fails the eval suite. The suite
  grows from real edits (Spec 7), so coverage compounds.
- **The grounding validator** enforces provenance on every node write.
- **The compounding step** — after each spec is built, `knowledge/known-gotchas.md`
  is updated and directional decisions are appended to the Decision Log.

## How a new capability is added

1. Decide its shape — it is a **command** with a Zod input/output contract; it
   belongs to a component that owns its tables/files.
2. Record the decision — design doc + Decision Log if directional; the spec's
   ADR if a spec-scoped call.
3. Register it — one entry in the command registry; it appears in every
   binding (CLI, HTTP) with no hand-wiring.
4. If it is an AI step, write its eval — the eval is its acceptance gate.
5. Build it via the factory; the review step checks it against this charter.
6. Compound — update `known-gotchas.md`.

A capability is never added as a back door, a direct cross-component query, or
an AI step without an eval.

## The build process

`brainstorm → design doc → spec → factory plan → factory build → review →
compound`, per the design doc's Development process. The factory (Spec 0)
executes the plan→build→review loop; superpowers bootstraps the first factory
workflows and is the human-driven fallback.

## Enforcement

This charter is enforced, not aspirational:

- The factory's `review-change` step uses this charter as its rubric; a
  Critical/High violation fails the review gate and routes back to
  implementation.
- The lints and `maestro verify` checks run in CI.
- Human review (`superpowers:requesting-code-review`) checks against the
  review checklist in `knowledge/coding-standards.md`, which mirrors these
  invariants.

## Maintenance of this charter

The charter is itself versioned. An invariant changes only by a logged
decision in the design doc's Decision Log; the charter is then amended and the
factory's review rubric picks up the change. The charter is reviewed whenever
a spec proposes something an invariant forbids — either the proposal is wrong,
or the invariant is.
