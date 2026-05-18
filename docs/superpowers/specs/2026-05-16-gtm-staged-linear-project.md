# GTM Client Lead Loop — Staged Linear Project

**For:** architect review, then import into Linear.
**Lives in:** `kimprobably/maestro-agent-planning` (the planning repo).
**Source of truth:** the design doc
(`2026-05-16-gtm-client-lead-loop-design.md`), the Engineering Charter, the
eight specs, and the Coding Standards — all in this planning repo.

This is not an implementation plan (those are written per-spec later, by the
factory). It is the **project structure**: stages, deliverables, dependencies,
and work items, mapped to Linear (Project → Milestones → Issues).

## How to read this

- **Project** — "GTM Client Lead Loop" in Linear.
- **Milestone** — one per stage below, built in order (the chain is linear).
- **Issue** — one per work item under a stage. Each spec's `Spec Kitty`
  section is the authoritative work-package list; the issues below mirror it.
- **The build pathway** — every coding issue is implemented by the factory
  (Spec 0) via Fabro into the coding repo. No hand-commits. Stage P sets that
  up; Stage 0 builds the factory itself.

## SDLC — the lifecycle every work item follows

1. **Prototype** — explore the risky/unknown parts in a scratch space;
   throwaway code; learn. (Project-level: Phase 0; any stage may re-enter this
   step to spike an unknown.)
2. **Spec** — write/refine the spec in the planning repo from what the
   prototype taught.
3. **Plan** — the factory's `plan-spec` turns the spec into an implementation
   plan.
4. **Build** — the factory's `build` implements it in isolated Daytona
   sandboxes, gated at every stage.
5. **Review** — `review-change` against the Engineering Charter + Coding
   Standards.
6. **Integrate** — merged into the coding repo (the only write path).
7. **Compound** — update `known-gotchas.md` and the Decision Log; harvest eval
   cases (Spec 7).

## Schedule — backed into a 6 July 2026 launch

"Launch" = the MVP: a campaign that runs end to end — the first sellable proof,
at the end of Stage 5. Stages 6–7 follow post-launch. The dates are aggressive;
the architect tunes them. The dependency *chain* is the commitment, not the
exact day.

| Phase / Stage | Window (2026) |
|---|---|
| Phase 0 — Prototyping & Exploration | May 16 – May 23 |
| Stage P — Foundations & repo setup | May 16 – May 23 (parallel) |
| Stage 0 — Software Factory (bootstrap) | May 23 – May 30 |
| Stage 1 — Client Tenant Foundation | May 30 – Jun 6 |
| Stage 2 — The Brain | Jun 6 – Jun 13 |
| Stage 3 — Brain Research | Jun 13 – Jun 18 |
| Stage 4 — Campaign Generation | Jun 18 – Jun 27 |
| Stage 5 — Campaign Runtime | Jun 27 – **Jul 6 — LAUNCH** |
| Stage 6 — Cockpit | Jul 6 – Jul 17 (post-launch) |
| Stage 7 — Edit Learning | Jul 17 – Jul 24 (post-launch) |

Stage 0 co-evolves with every later stage.

## Phase 0 — Prototyping & Exploration

*Window: May 16 – May 23. Deliverable: the major unknowns are de-risked and
the specs are refined from what was learned. Throwaway code — nothing here
goes through the factory or into the coding repo.*

This is the "play around" phase, deliberately *before* the deterministic Fabro
pathway. Spike the things most likely to surprise us:

- 0a — Spike the **thesys** Artifacts API: generate a lead-magnet web object
  end to end; resolve the render-path question (SDK render vs owned format) —
  feeds Spec 4's ADR.
- 0b — Spike the **scrapers**: Reddit + Instagram via Apify actors; confirm
  the LinkedIn reuse from mas-platform; confirm Firecrawl on a real site.
- 0c — Spike one **Fabro factory workflow** end to end (`implement-task` on a
  toy task): does it produce good tested code? — feeds Spec 0.
- 0d — Prototype the **grounded-node primitive**: the node schema, the
  grounding validator, `trace` on a hand-built 3-layer graph — does the
  primitive feel right? — feeds Spec 1.
- 0e — Prototype the **C1 generative UI** on a fake command output — feeds
  Spec 6.
- 0f — Fold every learning back into the specs as Decision Log entries before
  Stage P / Stage 0 begin in earnest.

Phase 0 outputs *learnings and spec refinements*, not product code.

## Stage P — Foundations & repo setup (pre-work)

*Deliverable:* the two-repo workflow exists and the architect's open
decisions are closed.

- P1 — Create `kimprobably/maestro-agent-planning`; move the design doc, the
  eight specs, the Engineering Charter, the Coding Standards, and this project
  doc into it.
- P2 — Create the coding repo; configure it so the factory (Fabro) is the
  only writer (branch protection / CI gate; no direct human commits).
- P3 — **Architect decision:** the home of the factory's workflows
  (maestro-os, planning repo, or coding repo); whether maestro-os remains the
  factory host.
- P4 — Provision the shared Neon project; provision Daytona; set the
  Maestro-level env vars (`THESYS_API_KEY`, `RESEND_API_KEY`,
  `RESEND_WEBHOOK_SECRET`) — verify no trailing whitespace.
- P5 — **Architect decision:** schedule the thesys render-path spike (Spec 4
  ADR) and confirm thesys pricing is acceptable.

## Stage 0 — Modular Software Factory  ·  `specs/factory/modular-software-factory.md`

*Deliverable:* a hands-off, eval-gated Fabro factory that builds Specs 1–7.
*Co-evolves* — bootstrap to "enough for Spec 1," then iterate alongside.
*Depends on:* Stage P.

- 0.1 — Bootstrap `factory.implement-task` (hand-built / superpowers),
  eval-gated.
- 0.2 — Bootstrap `factory.review-change` (charter + Coding Standards rubric),
  eval-gated.
- 0.3 — `factory.plan-spec` modular workflow + eval.
- 0.4 — `factory.decompose-plan` modular workflow + eval.
- 0.5 — `factory.integrate` modular workflow + eval.
- 0.6 — `factory.build` composing workflow (fanout, gates, review loop).
- 0.7 — The deterministic gates (spec-quality, plan-quality, test-pass,
  review-pass, workflow-quality, integration).
- 0.8 — The eval scoreboard + regression ratchet.
- 0.9 — `docs/MODULAR-SOFTWARE-FACTORY.md`.

## Stage 1 — Client Tenant Foundation  ·  `specs/gtm/client-tenant-foundation.md`

*Deliverable:* a provisioned, smoke-tested tenant; the grounded-node
primitive; the command core; the storage guards.
*Depends on:* Stage 0 (enough factory to build it).

- 1.1 — Grounded-node library (`core/node.ts`), schema, `human_edited` rule.
- 1.2 — The grounding validator (`core/grounding.ts`) + pass/fail tests.
- 1.3 — The index (`core/index.ts`) + reverse map + `grounding_stale`.
- 1.4 — `trace.node` command.
- 1.5 — Command core + registry + CLI binding + `meta.commands`.
- 1.6 — Neon connection + DataScope accessor + RLS scaffold; `tenants` +
  `events` tables.
- 1.7 — Tenant Scope Lint + Component Ownership Lint (+ failing fixtures).
- 1.8 — `onboard-client.fabro` + `client.*` commands.
- 1.9 — `tenant-smoke.fabro` (incl. the negative scope check).
- 1.10 — Reference tenant `acme`; `docs/CLIENT-TENANT-FOUNDATION.md` +
  `docs/GROUNDED-NODE.md`.

## Stage 2 — The Brain  ·  `specs/gtm/brain.md`

*Deliverable:* claims with provenance, from uploaded sources; topic summaries;
knowledge files; the `internal`-feedback intake.
*Depends on:* Stage 1.

- 2.1 — Claim schema (provenance, subtype, confidence) + the grounding
  integration.
- 2.2 — `brain-extract.fabro` + extraction prompt (cheap-model fanout).
- 2.3 — Dedup / fingerprint.
- 2.4 — Topic summaries + `brain.topics`.
- 2.5 — Knowledge files (`voice.md`/`icp.md`/`design.md`) handling.
- 2.6 — `brain-learn.fabro` (internal-feedback distillation).
- 2.7 — `source.*` / `brain.*` / `claim.*` commands.
- 2.8 — `brain-extract-quality` + `brain-learn-quality` evals; committed
  reference brain.

## Stage 3 — Brain Research  ·  `specs/gtm/brain-research.md`

*Deliverable:* the brain seeded from a website + LinkedIn URL, and from market
research (Reddit/Instagram/competitors/search).
*Depends on:* Stage 2.

- 3.1 — Artifact schema; Apify Reddit + Instagram actors; Firecrawl fallback.
- 3.2 — `research-intake.fabro` (URL intake) + brand extraction → `design.md`/
  `voice.md`.
- 3.3 — Research briefs + `research.brief.propose`.
- 3.4 — `brain-research.fabro` (market-research fanout).
- 3.5 — `research.*` commands.
- 3.6 — `brain-research-quality` + `brand-extract-quality` evals.

## Stage 4 — Campaign Generation  ·  `specs/gtm/campaign-generate.md`

*Deliverable:* a whole campaign generated as grounded objects + a manifest.
*Depends on:* Stage 2 (Stage 3 strengthens it but is not a hard gate).

- 4.1 — Object + campaign-manifest schemas.
- 4.2 — The campaign-plan step + generation prompts.
- 4.3 — `campaign-generate.fabro` + the grounding integration.
- 4.4 — **thesys integration** (`integrations/thesys.ts`) + the render-path
  spike (ADR).
- 4.5 — Visual generation against `design.md`.
- 4.6 — Fingerprint / regeneration.
- 4.7 — `campaign.*` / `object.*` commands.
- 4.8 — `campaign-generate-quality` eval; committed example campaign.

## Stage 5 — Campaign Runtime  ·  `specs/gtm/campaign-runtime.md`

*Deliverable:* **a live campaign** — hosted, capturing, sending, tracking,
delivering leads. **← the first sellable proof.**
*Depends on:* Stage 4.

- 5.1 — `services/campaign-runtime/` + `db/migrations/campaign-runtime/` (lead
  store, pages, events, scheduled emails, suppressions) + RLS.
- 5.2 — Public opt-in page route + render.
- 5.3 — Form capture + the lead store (companies/contacts/captures).
- 5.4 — Lead magnet delivery (web object + export routes).
- 5.5 — Resend integration + per-client sending subdomain provisioning.
- 5.6 — The scheduled-email sender loop (exactly-once).
- 5.7 — Delivery webhooks + suppression + unsubscribe.
- 5.8 — `campaign.stats` (funnel tracking).
- 5.9 — Lead-delivery channels (digest / export / webhook).
- 5.10 — `campaign.learn` (brain feedback trigger); `campaign.*` runtime
  commands; `docs/CAMPAIGN-RUNTIME.md`.

## Stage 6 — Cockpit  ·  `specs/gtm/cockpit.md`

*Deliverable:* the generative-UI operator surface.
*Depends on:* Stage 5.

- 6.1 — `apps/cockpit/` scaffold; magic-link auth; `db/migrations/cockpit/`.
- 6.2 — The command-core **HTTP binding** + registry-parity test.
- 6.3 — Tenant routing + `requireTenantAccess`.
- 6.4 — The generative shell (C1) + the table fallback.
- 6.5 — Generative screens: tenant home, campaign view, brain view, activity.
- 6.6 — The trace (provenance) view.
- 6.7 — Tiptap + AI-Toolkit editing + grounding re-validation on save.
- 6.8 — `cockpit-generative-ui-quality` eval; Playwright e2e.

## Stage 7 — Edit Learning  ·  `specs/gtm/edit-learning.md`

*Deliverable:* the edit-capture → infer-why → improve loop.
*Depends on:* Stage 6 (needs the product in use).

- 7.1 — Edit capture + the `edits` table; diff computation; `edit.log` wired
  into the node-write path.
- 7.2 — `edit-learn.fabro` + the inference prompt.
- 7.3 — The taste/defect router → `internal` claims + `voice.md` proposals.
- 7.4 — The eval-case review queue + `eval.candidates` / `eval.promote`.
- 7.5 — `edit-learn-quality` eval; `edit.*` commands; cockpit surfacing.

## Dependency chain

```
P → 0 → 1 → 2 → 3 ─┐
                   ├→ 4 → 5 → 6 → 7
   (3 strengthens 4 but 4 can start on a source-only brain)
```

Stage 0 co-evolves with every later stage. **First sellable proof at the end
of Stage 5.** Stages 6–7 are the operator surface and the compounding loop.

## Notes for Linear

- Each phase/stage → a Linear **Milestone** with the target date from the
  Schedule; each numbered item → an **Issue** under it, linking back to the
  spec section.
- The project launch / target date is **6 July 2026** (end of Stage 5).
- Stage 0 issues should be tagged so they can be re-opened/extended
  continuously (the factory is iterated, not finished).
- Phase 0 issues are prototyping spikes — close them when the learning is
  folded back into the specs, not when "code works."
