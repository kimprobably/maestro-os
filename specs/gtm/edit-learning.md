# Edit Learning Spec (Spec 7)

## Purpose

Capture every human edit to a grounded node, infer **why** the human made it
via a cheap model, and feed that learning back two ways:

- **Per-tenant (taste)** — the client's style preferences become `internal`
  brain claims and proposed `voice.md` changes, so that client's next
  generation matches what they keep editing toward.
- **Cross-tenant (defects)** — when an edit fixes something the generator got
  wrong, the before/after becomes a candidate **eval case** and a
  prompt-improvement signal, so the product itself improves.

This closes the compounding loop: **evals gate generation → humans fix what
slips through → edit-learning infers why → evals and prompts improve → fewer
slips.** The eval suite grows itself from real usage.

## Context

Depends on Spec 1 (the grounded-node primitive, `human_edited`, the node-write
path), Spec 2 (the brain — `internal` claims, `voice.md`), Spec 0 (the factory
— eval datasets and generation prompts). It is built last: it learns from
edits, which requires the product to exist and be in use.

A v1 of this software tracked human edits, diffed them, and used a cheap model
to infer intent — a key concept being carried forward.

## Non-Goals

- Do not gate generation on edits — the brain has no review gate; this learns
  *after* the fact.
- Do not auto-mutate canonical assets. `internal` claims are written directly
  (claims carry confidence, no gate); but `voice.md` changes and new eval
  cases are *proposed* to a review queue — a wrong inference must not silently
  corrupt the brand file or the eval suite.
- Do not infer intent for machine writes — only `human_edited` transitions.

## Edit Capture

Every grounded-node write goes through Spec 1's write path. When a write sets
`human_edited: true` — a human edited a node in the cockpit Tiptap editor or
via the CLI — Spec 7 records an **edit record** (Neon `edits` table,
tenant-scoped, RLS):

```sql
CREATE TABLE edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL,
  node_id TEXT NOT NULL, node_type TEXT NOT NULL,   -- claim | object | campaign
  node_subtype TEXT,
  before_body TEXT NOT NULL, after_body TEXT NOT NULL,
  diff TEXT NOT NULL,                               -- computed unified diff
  editor_email TEXT,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  intent JSONB,                                     -- filled by edit-learn
  learned BOOLEAN NOT NULL DEFAULT FALSE);
```

The node file stays in the vault; the edit *record* is operational history →
Neon (per the storage rule: vault is wake-tolerant content, Neon is queried
operational state, and the cross-tenant defect aggregation needs queries).

## The Learning Workflow

`workflows/gtm/edit-learn.fabro`, invoked by `edit.learn` (and on a schedule):

1. **Load** a batch of `edits` rows with `learned = false`.
2. **Infer intent** (LLM, `.edit-inference` class — a cheap model: Haiku 4.5 /
   Gemini Flash). For each edit, the model reads the diff plus the node's
   context (type, subtype, the claims it cited) and emits a structured intent:
   - `summary` — what changed, in one line.
   - `why` — the inferred reason ("client prefers hooks under 8 words";
     "the proof point overstated — 'guaranteed' was not supported by the
     cited claim").
   - `class` — `taste` (a per-tenant style preference) or `defect` (the
     generator did something wrong: ungrounded, off-voice, factually loose,
     verbose).
   - `target` — for a defect, which generation step is implicated
     (`campaign-generate`, `brain-extract`, …).
   Prompt at `prompts/gtm/edit-learn.md`.
3. **Validate shape**; write `intent` back onto the `edits` row.
4. **Route**:
   - **taste** → write an `internal` brain claim ("for this client,
     <preference>", citing the edit) and, if it recurs (≥ N taste edits of the
     same kind), queue a proposed `voice.md` change for operator review.
   - **defect** → create a candidate **eval case** in a review queue: the
     `before_body` is a failing output, the `after_body` the corrected target,
     tagged with the implicated `target` step; plus a prompt-improvement note.
5. Mark `learned = true`.

### The eval-case review queue

Defect-derived eval cases do **not** enter the eval suite automatically — a
wrong inference would poison the suite. They land in
`evals/datasets/<step>/_candidates/` with their source edit. The factory's
`review-change` step (Spec 0) or an operator promotes a candidate into the
real eval dataset. Once promoted, it is a permanent regression case — the
generator can never re-introduce that defect without an eval failing.

This is how the eval suite grows: not hand-authored, but harvested from the
edits real operators make.

## Commands

- `edit.log` — internal; called by the Spec 1 node-write path on a
  `human_edited` transition. Computes the diff, inserts the `edits` row.
- `edit.learn` — `{ tenant?, detach? }`. Runs `edit-learn.fabro` over unlearned
  edits (all tenants, or one).
- `edit.list` — `{ tenant, class?, nodeId? }`. Edit records with inferred
  intent.
- `eval.candidates` — `{ step? }`. The pending eval-case review queue.
- `eval.promote` — `{ candidateId }`. Promotes a candidate into its eval
  dataset.

## Acceptance Criteria

- Editing a node in the cockpit or via the CLI inserts an `edits` row with a
  correct unified diff and `human_edited: true` on the node.
- `edit.learn` infers a structured `intent` for each unlearned edit and
  classifies it `taste` vs `defect`.
- A `taste` edit produces an `internal` brain claim citing the edit; a
  recurring taste pattern queues a `voice.md` proposal.
- A `defect` edit produces an eval-case candidate in
  `evals/datasets/<step>/_candidates/` with the before as the failing output
  and the after as the target.
- `eval.promote` moves a candidate into the live eval dataset; a subsequent
  generation eval run includes it.
- The edit-intent inference has its own eval (`evals/edit-learn-quality.yaml`)
  — on a fixture set of diffs, the model's `class` and `target` match the
  labelled answers above threshold.
- `edit.list` on a node returns its edit history; the cockpit's `trace` view
  shows that history alongside the citation lineage.
- A cross-tenant `edits` query is RLS-refused; `edit-learn.fabro` passes
  `maestro verify workflow-quality`.

## Definition Of Done

- `edit.log` wired into the Spec 1 node-write path; the `edits` table +
  migration + RLS policy.
- `workflows/gtm/edit-learn.fabro` + toml runner; prompt at
  `prompts/gtm/edit-learn.md`.
- Commands `edit.*` and `eval.{candidates,promote}` in the command core,
  tested.
- The eval-case review queue (`evals/datasets/<step>/_candidates/`) and the
  promotion path.
- `evals/edit-learn-quality.yaml` — the eval on the inference step itself.
- The cockpit (Spec 6) surfaces edit history and the candidate queue.
- `docs/EDIT-LEARNING.md` documents the loop.
- `knowledge/known-gotchas.md` updated.
- `maestro verify spec-quality specs/gtm/edit-learning.md` passes.

## Risks

- **Wrong intent inference pollutes learning.** Mitigation: `voice.md` changes
  and eval cases go to a review queue, not applied directly; only `internal`
  claims (low-stakes, confidence-weighted) are written directly; the inference
  step has its own eval.
- **Eval-suite drift / overfitting to edits.** Mitigation: candidates are
  promoted deliberately, not in bulk; a promoted case is a regression test,
  not a generation target.
- **Noisy edits (typos, formatting).** Mitigation: the inference prompt is
  instructed to classify trivial edits as `taste`/none and they produce no
  eval case; a minimum-diff-size filter before inference.
- **Taste vs defect is a fuzzy line.** Mitigation: it is an explicit
  classification with its own eval; misclassification is recoverable (a taste
  signal is harmless, a defect candidate is reviewed).

## Spec Kitty

Work packages: edit capture + the `edits` table, the diff computation, the
`edit-learn` workflow + inference prompt, the taste/defect router, the
`internal`-claim and `voice.md`-proposal paths, the eval-case review queue +
promotion, the inference eval, command-core commands, cockpit surfacing.

## ADR

No ADR required for v0. A future ADR is required before a paying tenant,
covering whether recurring taste signals may auto-apply to `voice.md`, and
whether defect candidates may auto-promote once the inference eval is
sufficiently trusted.
