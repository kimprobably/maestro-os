# The Brain Spec (Spec 2)

## Purpose

The brain is the per-client knowledge layer — **claims**: grounded nodes at
layer 1, each a cited fact about the client's business. This spec defines the
claim schema, the three provenances, source extraction (uploaded documents →
claims), topic summaries, the `voice.md`/`icp.md`/`design.md` knowledge files,
and the intake path for `internal` claims fed back from campaign performance.

## Context

Depends on [`client-tenant-foundation.md`](./client-tenant-foundation.md)
(Spec 1) — claims are grounded nodes and use its node schema, grounding
validator, index, and `trace`. The brain is the moat: the durable record of
what an agency knows about a client, with provenance back to the source. It
is the input to campaign generation (Spec 4).

The brain has three intake paths: **source ingestion** (this spec),
**research** (Spec 3), and **internal feedback** (this spec's `internal`
provenance, written by Spec 5). All three produce claims; extraction is one
shared primitive.

The brain functions **without a review gate** — extract, validate grounding,
write, continue. `human_edited` protects hand edits.

## Non-Goals

- Do not scrape the web or social — that is Spec 3. This spec ingests
  uploaded markdown/text documents only.
- Do not generate campaigns (Spec 4) or build a UI (Spec 6).
- Do not perform entity resolution or contradiction detection across claims —
  later specs.
- Do not ingest PDF/audio/video. Source must be markdown or text.

## Claims

A claim is a grounded node — `clients/<slug>/brain/claims/<provenance>/cl-…md`
— with the Spec 1 node frontmatter plus:

```yaml
type: claim
subtype: icp | offer | objection | proof | positioning | other
provenance: client | market | internal
confidence: 0.0-1.0
extracted_by: brain-extract@v0          # or the run that produced it
```

- **provenance** names *whose knowledge it is*: `client` (the client's own
  materials and stated positioning), `market` (customers, prospects,
  competitors, communities), `internal` (knowledge the product generated —
  campaign performance, syntheses). Claims are stored physically separated by
  provenance subdir; the index unifies them.
- Citations point at **artifacts** (layer 0) in `clients/<slug>/artifacts/`,
  with a `locator` (line range + quote). The grounding validator (Spec 1)
  enforces resolution and substring-match.
- The body is free-form prose. `subtype` is typed; `other` is the catch-all.

Source extraction always produces `provenance: client`. Research (Spec 3)
produces `client` or `market`. `internal` is written only by the feedback
intake below.

## Knowledge Files

Three curated tenant files under `clients/<slug>/knowledge/` — not grounded
nodes (no citation chain), read by generators as guardrails:

- `voice.md` — brand voice and tone.
- `icp.md` — the target customer.
- `design.md` — brand **visual** identity: colors, fonts, logo, imagery style
  and mood. Consumed by visual generation (Spec 4).

All three are seeded from the website scrape (Spec 3) and are hand-editable.

## Topic Summaries

`clients/<slug>/brain/topics/<topic>.md` — computed digests over the claims (a
topic per subtype, and per high-signal theme). They are the "buyer persona"
layer a generator reads instead of hundreds of raw claims. Each topic file
lists and links the claims it summarizes; it is a derived view, regenerated
when claims change, computed by the cheap-model class. Topic files are not in
the grounding chain — objects cite claims directly, not topics.

## Extraction — the shared primitive

Extraction is **artifact → grounded claims via a cheap model**, the same
primitive Spec 3's research uses. `workflows/gtm/brain-extract.fabro`:

1. **Load** (deterministic) — assert tenant scope; collect the target
   artifacts (`source_filter` or all of `artifacts/`); load `voice.md`,
   `icp.md`. Append `brain.extract.started`.
2. **Skip if empty** — no artifacts → `brain.extract.skipped`, exit clean.
3. **Extract** (LLM, `.extraction` class — a cheap model: Haiku 4.5 / Gemini
   Flash) — **fanout, one node per artifact**: each artifact is read and a JSON
   array of candidate claims emitted, each with `subtype`, body, `confidence`,
   and citations (artifact id + line range + quote). Prompt at
   `prompts/gtm/brain-extract.md`; it forbids claims without citations and
   forbids inventing detail. Cheap-model + per-artifact fanout is the
   cost-control layer (it replaces generic prose compression — see the design
   doc's scaledown decision).
4. **Validate shape** (deterministic) — parse; fail back to extract on shape
   error.
5. **Validate grounding** (deterministic) — run the Spec 1 grounding
   validator; drop claims that fail; > 30% failures fails the run.
6. **Dedup + write** (deterministic) — fingerprint =
   `sha256(subtype + first-citation-ref + normalized-title)`; a candidate
   matching an existing `human_edited` claim is skipped unless `force`;
   otherwise written. Assign ids; write claim nodes under the right
   `provenance` subdir.
7. **Regenerate index**; **recompute** affected topic summaries.
8. **Emit** `brain.extract.completed` (counts by subtype/provenance, dropped,
   human-edited preserved).

Model stylesheet: `.extraction` and `.compression` → a cheap model;
`.judging`/`.review` → cheap; long-context as needed by artifact size.

## Internal-Claim Feedback Intake

Campaign performance (Spec 5) is distilled into `internal` claims so the next
campaign learns from what worked. `workflows/gtm/brain-learn.fabro`, invoked by
campaign-runtime:

- Input: a tenant + a performance summary (e.g., a campaign's funnel result,
  per-object open/click/conversion).
- An LLM judge distils notable signals into candidate `internal` claims —
  "the hook 'X' drove an 8% opt-in rate" — each citing the campaign/run that
  produced it (the campaign manifest is the artifact-equivalent it cites).
- Grounding-validated, written under `brain/claims/internal/`, indexed.
- `internal` claims carry the same schema; `campaign-generate` (Spec 4) may
  weight by provenance — ground hook choices in `internal`.

## Commands

Command-core commands (Spec 1), surfaced in the CLI:

- `source.add` — `{ tenant, path, name? }`. Copies a markdown/text file into
  `artifacts/`; refuses non-text. Appends `source.added`.
- `source.list` / `source.remove` — `{ tenant, … }`. Remove soft-archives;
  claims citing a removed artifact get `grounding_stale` on the next index.
- `brain.extract` — `{ tenant, force?, sourceFilter?, detach? }`. Runs the
  workflow.
- `claim.list` — `{ tenant, subtype?, provenance? }`.
- `claim.show` / `claim.remove` — `{ tenant, claimId }`.
- `brain.topics` — `{ tenant }`. Recompute topic summaries.

## Acceptance Criteria

- `source.add` then `brain.extract` for the reference tenant produces ≥ 10
  `client` claims with valid grounding.
- A claim citing a fabricated line range, or whose `quote` does not
  substring-match, is dropped at the grounding step.
- Editing a claim with `human_edited: true`, then re-running `brain.extract`,
  preserves it; `force` overwrites.
- `claim.list --provenance market` and `--subtype icp` filter correctly.
- `brain.topics` produces topic digests linking their claims.
- The internal-feedback path: a fixture performance summary through
  `brain-learn` produces grounded `internal` claims.
- `trace.node` on a claim returns its artifact lineage.
- `maestro verify workflow-quality workflows/gtm/brain-extract.fabro` passes;
  a leaks-tenant fixture fails the lint.
- The promptfoo eval `evals/brain-extract-quality.yaml` passes.

## Definition Of Done

- `workflows/gtm/{brain-extract,brain-learn}.fabro` + toml runners; prompts at
  `prompts/gtm/`.
- Commands `source.*`, `brain.*`, `claim.*` in the command core, tested.
- `evals/brain-extract-quality.yaml` covers grounding validity (100% of
  emitted claims cite a real range), subtype coverage, a no-invention
  LLM-judge check, and run-to-run stability.
- `evals/brain-learn-quality.yaml` covers the `internal`-claim distillation:
  every emitted `internal` claim cites the campaign/run, no invented metrics,
  and signal selection matches a labelled fixture above threshold.
- Fixture artifacts + a leaks-tenant negative fixture committed.
- The reference tenant `acme` has a committed brain.
- `knowledge/known-gotchas.md` updated.
- `maestro verify spec-quality specs/gtm/brain.md` passes.

## Risks

- **Hallucinated citations.** Mitigation: the substring-match check in the
  grounding validator; the > 30%-drop hard-fail; the no-invention eval.
- **Thin sources → thin brain.** Mitigation: clean skip on empty; Spec 3
  research adds depth.
- **Re-extraction churn.** Mitigation: the fingerprint uses subtype + first
  citation, not body; a stability eval across two runs.
- **`internal` claims could be low-quality self-reference.** Mitigation:
  `brain-learn` is a judged distillation, not raw logging; `internal` claims
  carry `confidence` and `campaign-generate` weights on it.

## Spec Kitty

Work packages: claim schema, extraction prompt + workflow, the grounding
integration, dedup/fingerprint, topic summaries, knowledge files, the
internal-feedback `brain-learn` workflow, command-core commands, eval dataset.

## ADR

No ADR required for v0. A future ADR is required before a paying tenant,
covering per-subtype structured schemas, automatic dedup/contradiction
detection, and non-text source ingestion.
