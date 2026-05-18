# GTM Client Lead Loop — Design Doc

**Date:** 2026-05-16
**Status:** Design consolidated around the grounded-node primitive. Eight
specs (0–7), all rewritten to match. Pending verification and plan.
**Specs:** `specs/factory/modular-software-factory.md` (Spec 0) +
`specs/gtm/{client-tenant-foundation,brain,brain-research,campaign-generate,
campaign-runtime,cockpit,edit-learning}.md` (Specs 1–7)

## Problem

Agencies that run go-to-market for their clients have no good place to keep
what they know about each client's business — the ICP, the offer, the
objections, the proof, the positioning — and no way to turn it into running
campaigns without re-deriving it by hand every time. The knowledge lives in
call transcripts, the client's website, the agency owner's head, and a
thousand Reddit threads nobody has read. When a campaign gets built, it is
only as good as that day's recall.

Octave (octavehq.com) built a structured GTM brain — for one enterprise, at
enterprise prices. Mako (trymako.ai) runs research → creative → publishing as
one slice — for DTC ad teams. Neither serves the agency that runs N clients
and cannot buy N enterprise seats. That is the gap.

## What we're building

A multi-tenant product, built by the factory into a Fabro-gated coding repo
(see Repos and the build workflow). One agency, N isolated client tenants. For each client it keeps a **brain** (their GTM
knowledge, grounded in real sources) and turns it into **whole campaigns** —
posts that drive traffic, an opt-in page, a lead magnet, emails — that run end
to end and feed performance back into the brain.

The organizing principle is **vertical slices, not horizontal tools**. The old
generation gave you a funnel builder, a separate email tool, a separate
analytics dashboard, and left the agency to wire them together per client. The
unit here is the **campaign** — one coherent object, generated together,
grounded in one brain, run end to end.

The wedge: "Octave for agencies." A brain per client, turned into running
campaigns, priced and shaped for an agency with many clients.

A v1 of this software has already shipped and proven demand. This is a
rebuild, not a prototype — the eight specs below are the scope required to
make the vertical slice work properly, not a feature wishlist.

## ICP

The primary ICP is **Aidan** — a small agency owner who builds content and
lead-magnet funnels for his clients. Inbound motion, not cold outbound. He
operates the product himself: not a coder, but a daily Claude Code user
comfortable driving tools through it with guardrails. Non-coder,
Claude-Code-native — a common profile, and the one the harness is designed
around.

## The grounded-node primitive

**Everything in the product is one primitive: a grounded node.** A grounded
node is a markdown file with frontmatter carrying a stable `id`, a `type`, a
set of **citations to the layer below it**, a `human_edited` flag, a `status`,
and timestamps. Knowledge and content are the same shape at every layer; each
layer cites the layer beneath:

```
  raw artifacts      uploaded docs · scraped pages, posts, threads · the
   (layer 0)         client's website + LinkedIn                  ── the floor
        ▲ cited by
  claims             the brain — one claim per fact, provenance-tagged
   (layer 1)
        ▲ cited by
  objects            campaign pieces — post · opt-in page · lead magnet ·
   (layer 2)         email · visual
        ▲ cited by
  campaign           a manifest binding objects
   (layer 3)
```

One schema family, one **grounding validator** (a node's citations must
resolve to real nodes/artifacts one layer down; content that cites nothing is
dropped or flagged), one `human_edited` protection rule, one index pattern —
reused at every layer. The factory builds one kind of thing repeatedly.

**A grounded node is one flat markdown file** — `<id>.md`, frontmatter +
body — at every layer (a claim, an object, even the campaign manifest). No
per-node directories. Derived renders sit beside it as same-stem siblings
(`lm-2026-05-16-a1b2c3.md` → `.web.json`, `.pdf`, `.visual.png`). The index
(`.index.json`) is a derived, always-regenerable cache over the files; the
files are the source of truth. (SilverBullet validates this: a markdown vault
plus a maintained frontmatter index is fully queryable with no database.)

### Why it exists: provenance tracing

The grounded node is not a convenience — it exists so that **the provenance of
every idea is traceable end to end**. Because every node cites the layer below
by stable id, the citation graph can be walked in both directions:

- **Down (lineage)** — point at a generated lead magnet → its objects → the
  brain claims they cite → the raw artifacts those claims cite, with the
  Reddit thread URL, the transcript line range, the website page. "Show me
  where this opt-in headline came from" → three `market` claims → three real
  customer quotes.
- **Up (usage / blast radius)** — point at a claim → every object and campaign
  that cites it. Editing or removing a claim shows exactly what it affects;
  this drives drift detection (`grounding_stale`).

A first-class `trace` operation (a command-core command, surfaced in the CLI
and the cockpit) returns this lineage for any node. This is the trust story
and the moat: an agency can prove to its client that every line of a campaign
traces to the client's own words or to real buyer signal — nothing invented.

## The brain

The brain is the per-client claim layer — grounded nodes at layer 1. Every
claim carries a **provenance**, naming *whose knowledge it is* (independent of
how it was acquired):

- `client` — the client's own materials and stated positioning: uploaded docs,
  transcripts, their website, their own LinkedIn.
- `market` — signals from customers, prospects, competitors, communities:
  Reddit, reviews, competitor sites, prospect LinkedIn.
- `internal` — knowledge the product generated: campaign performance,
  syntheses, learnings.

One claim store, physically separated by provenance subdir, unified by the
index. Provenance matters because consumers reason on it: ground the **offer**
in `client` claims, ground a **customer-language hook** in `market` claims,
ground a **hook choice** in `internal` claims (what has worked). This is Mako's
"research feeds strategy" lesson made mechanical.

The brain has three intake paths, all producing claims:

1. **Source ingestion** — uploaded documents → claims (`client`). Spec 2.
2. **Research** — scrape the web/social → artifacts → claims (`client` for the
   client's own footprint, `market` for everyone else). Spec 3.
3. **Internal feedback** — campaign performance distilled into `internal`
   claims that inform the next campaign. Spec 5 → Spec 2.

**Topic summaries** (`brain/topics/`) are computed cheaply over the claims —
the digestible "buyer persona" layer a generator reads instead of hundreds of
raw claims. **Extraction** is one primitive: artifact → grounded claims via a
cheap model (Haiku 4.5 / Gemini Flash); upload and scrape are just acquisition
adapters feeding it.

Alongside the claim store sit three curated **knowledge files** per tenant —
`voice.md` (brand voice), `icp.md` (target), `design.md` (brand visual
identity: colors, fonts, logo, imagery style). They are seeded from the
website scrape and editable; generation reads them for guardrails.

## The campaign vertical slice

A campaign is generated from the brain as a set of reusable **objects**
(grounded nodes at layer 2) bound by a **campaign manifest** (layer 3):

- **posts** — promotional content that drives traffic to the opt-in page.
- **opt-in page** — owned MDX/HTML, converts traffic. Hosted by us.
- **lead magnet** — a hosted interactive web object (thesys-generated),
  export (PDF/PPTX) as a feature.
- **delivery email + nurture sequence** — sent on opt-in.
- **visuals** — brand-consistent images for posts, page, and magnet,
  generated against `design.md`.

Every object is a reusable first-class node — one object can be bound by
several campaigns; a campaign is a manifest of object ids. Every unit cites
brain claims; uncited units are dropped. No review gate. The campaign then
**runs**: hosted, sent, tracked, and the captured leads delivered to the
client.

## Storage model

Two stores. The seam is **wake-tolerant vs. real-time** — *who touches the data
and when*, not whether it is "knowledge" or "relational":

- **The vault** — files on the per-tenant Daytona volume. Holds every
  **grounded node** (artifacts, claims, objects, campaign manifests) and the
  knowledge files (`voice.md`, `icp.md`, `design.md`). Touched only by the
  operator (cockpit, CLI) and Fabro workflows — both tolerate a Daytona
  cold-start. The files are the source of truth; `.index.json` is a derived
  cache. The brain needs no database.
- **Neon Postgres** — one shared project, every row tenant-scoped by a
  `tenant_slug` column. Holds operational state: contacts, companies,
  captures, the email queue, suppressions, funnel analytics, the hosted-page
  render cache, auth, and the tenant event log. Touched by **prospects in real
  time** (the public opt-in/capture path) and by **always-on services** (the
  email sender loop, the cockpit) across all tenants at once.

The lead store and the runtime data cannot live on the Daytona volumes:
those volumes are sleepy, single-sandbox, per-tenant, and behind a cold-start.
Serving a public conversion form would mean either waking a sandbox per
prospect (cold-start latency on the money path — rejected) or keeping every
tenant's sandbox awake forever (defeats auto-stop). Per-tenant SQLite on the
volume fails the same way, plus SQLite is single-writer and unreliable over a
remote volume. Service-local SQLite was considered and rejected too — it needs
a persistent volume anyway, has no managed backup, and the cockpit (a separate
service) needs shared access; that is just a worse Neon.

There is no third store — the old file-based `memory/` JSONL event log is
dropped; tenant events go to a Neon `events` table read via a command.

Tenant isolation matches each store's access tempo. The **vault** is isolated
**physically** — a Daytona volume per tenant — guarded by the Tenant Scope
Lint. **Neon** is isolated **logically** — one project, **shared tables, every
row carrying `tenant_slug`** — guarded by two layers: a DataScope-style
accessor that injects `tenant_slug` on every query, and **Postgres Row-Level
Security** policies on every table as the hard backstop, so a buggy query
physically cannot return another tenant's rows.

Not per-tenant tables, schemas, or databases. Shared tables are required
because: the cross-client agency view is a query without the tenant filter
(per-tenant tables make it a `UNION` over N tenants); schema changes are one
atomic migration, not N; `client.create` adds rows, not DDL; and operator
`users` are cross-tenant by nature. RLS gives the isolation guarantee of
separate tables without the operational cost.

### The lead store

Captured leads are a normalized store in Neon, tenant-scoped — not a flat
table:

- `companies` — `id, tenant_slug, name, domain, …, created_at`; unique
  `(tenant_slug, domain)`.
- `contacts` — `id, tenant_slug, company_id (nullable FK), email, full_name,
  …, created_at`; unique `(tenant_slug, email)`. A contact is a person.
- `captures` — `id, tenant_slug, campaign_id, contact_id, capture_data jsonb,
  magnet_token, unsub_token, captured_at`. The opt-in event linking a contact
  to a campaign.

An opt-in resolves/creates the company (from the email domain), resolves/
creates the contact, and inserts a capture. The same person across two
campaigns is one contact with two captures. This is a **lead store**, not a
CRM: the product keeps what it captured for dedup, analytics, and delivery,
then pushes leads to the client's CRM (Spec 5). The client still runs their
pipeline in their own system.

## The platform principle

The product is a vertical slice (campaigns), but every *horizontal* capability
— send an email, build a lead magnet, write a post, run a factory workflow —
is a modular component that an agent can recompose or that could be packaged
and sold standalone. This is the Bezos/SOA mandate, baked in at the foundation
(Spec 1) because it cannot be bolted on later:

- **Every capability is a command** — a typed Zod contract in the registry.
- **Commands are the only interface between components** — no component reads
  another's tables or vault files directly; no back doors, ever.
- **Components own their data** — each owns a set of Neon tables and vault
  subdirs; one shared database stays modular because the boundary is *logical
  ownership*, not separate databases. The Component Ownership Lint enforces it.
- **The registry is reflective** (`meta.commands`) so an agent can discover and
  recompose capabilities.
- **Designed externalizable from the ground up** — the same contract serves
  the CLI, the HTTP binding, and any future external API. Selling a component
  standalone additionally needs per-caller auth, quotas, metering, and contract
  versioning — not built in v0, but the core is designed so they attach without
  re-architecting.

The cost is real and non-negotiable: no shortcuts, no direct cross-component
reads even when convenient, contracts versioned. That is the price of a
platform, and the reason to pay it up front.

## Architecture

```
                 maestro-os repo
                 ┌──────────────────────────────────────────────────┐
                 │  command core (cli/src/core/, Zod-contracted)     │
                 │   client.*  source.*  brain.*  research.*         │
                 │   campaign.*  object.*  trace.*                   │
                 └──────┬──────────────────────────────┬─────────────┘
                        │                              │
                 CLI binding (v0)              HTTP binding (Spec 6)
                        │                              │
                 Claude Code                    cockpit (generative UI)
                        │                              │
                        ▼                              ▼
       Fabro workflows ──────────────► vault — clients/<slug>/ on a per-tenant
       (research, brain-extract,       Daytona volume:
        campaign-generate)             artifacts/ brain/ objects/ campaigns/
                        │              knowledge/   (grounded nodes + index)
                        ▼
       Campaign Runtime (Spec 5): hosts pages + magnets, sends email,
       tracks the funnel, delivers leads to the client.
       Neon Postgres (one project, tenant-scoped): lead store
       (companies/contacts/captures), email queue, analytics, auth, events.
```

## The specs

Spec 0 (the factory) plus six product specs (1–6) and the edit-learning loop
(7). The campaign vertical slice is Spec 4 + Spec 5.

### Spec 0 — Modular Software Factory

A library of modular, eval-gated Fabro workflows composed into a hands-off
software factory: spec → plan → parallel per-task implementation → review →
integrate, deterministic gates between stages. Each modular workflow has its
own eval and cannot be composed until it passes. Strategically the highest-
value spec — it builds Specs 1–7 and every product after. Bootstrapped by hand
/ superpowers, then self-extending. Must never gate the product path.

### Spec 1 — Client Tenant Foundation

Per-tenant model (`clients/<slug>/` vault, `.config.toml`, Daytona volume,
credential refs), the Neon connection + the tenant-scoped (DataScope-style)
accessor, the harness-agnostic command core + CLI binding, the Tenant Scope
Lint, and **the grounded-node base** — the shared node schema, the grounding
validator, the index pattern, and the `trace` command. The primitive and both
storage guards live here so every spec above builds on them.

### Spec 2 — The Brain

The claim layer: the claim store, the `client|market|internal` provenance
model, source extraction, topic summaries, the `voice.md`/`icp.md`/`design.md`
knowledge files, and the `internal`-claim feedback intake. No review gate;
`human_edited` protection.

### Spec 3 — Brain Research

Web/social research into the brain. **URL intake**: given the client's website
and LinkedIn URL, scrape everything (Firecrawl for the site, Apify/Harvest for
LinkedIn) and seed the brain + `design.md` + `voice.md` — the Mako-style
60-second onboarding. **Market research**: research briefs (auto-proposed from
existing claims) drive scraping of Reddit, Instagram, competitors, reviews,
search. Pipeline: scrape → artifacts → per-artifact cheap-model claim
extraction (Fabro fanout) → dedup → `client`/`market` claims. Reddit/Instagram
are added to the existing Apify client + Firecrawl; LinkedIn scraping is
reused from mas-platform.

### Spec 4 — Campaign Generation

Brain + offer → a whole campaign: posts, opt-in page, lead magnet web object,
emails, and **brand-consistent visuals** generated against `design.md`. Each
piece is a reusable grounded object; a manifest binds them. Every unit grounded
in claims. The lead magnet is a thesys-generated hosted web object.

### Spec 5 — Campaign Runtime

Make a campaign run: host the opt-in page and lead magnet, capture leads, send
the delivery + nurture emails (Maestro-managed Resend, per-client subdomain,
unsubscribe + suppression), track the funnel, **and deliver captured leads to
the client** (email digest, CSV export, webhook/CRM push — per-tenant config).
Performance feeds back into the brain as `internal` claims.

### Spec 6 — Cockpit

The operator surface — **fully generative UI** (thesys C1), not a hand-built
app. The cockpit binds the command core over HTTP and renders itself
generatively from command output: campaign overview, the brain, the provenance
`trace` view, performance, all generative. Editing uses Tiptap + the AI
Toolkit (agent-assisted, track-changes, grounding-aware, grounding re-validated
on save). Optional for Aidan (he operates via Claude Code); also a deliberate
test of whether the factory can build a generative-UI app. A cross-client
agency portfolio view is a known later addition.

### Spec 7 — Edit Learning

Captures every human edit to a grounded node, infers *why* via a cheap model,
and routes the learning: `taste` edits → `internal` brain claims + proposed
`voice.md` changes (this client's next generation matches their preferences);
`defect` edits → candidate eval cases + prompt-improvement signals (the
product itself improves). Closes the compounding loop — **the eval suite grows
itself from real usage**. Built last; learns from edits, so the product must
be in use.

## Evals at every layer

No AI output ships without an eval, and the eval is the gate — an output below
its threshold is not accepted. Every AI step has one: brain extraction and the
`brain-learn` distillation (Spec 2), brand and research extraction (Spec 3),
the campaign plan, object generation, the lead-magnet web object, and visuals
(Spec 4), the C1 generative UI (Spec 6), edit-intent inference (Spec 7), and
every modular factory workflow (Spec 0). Each spec's Definition of Done lists
its evals explicitly. The eval suite is **not static** — Spec 7 harvests new
regression cases from real human edits, so coverage compounds.

## Capabilities folded in (this revision)

- **Provenance tracing** — a `trace` command and cockpit view over the
  grounded-node graph (Spec 1 primitive; surfaced in Spec 6).
- **Lead delivery** — captured leads reach the client; without this the funnel
  produces nothing the client can use (Spec 5).
- **URL + LinkedIn auto-intake** — seed the brain by scraping the client's
  website and LinkedIn, no document homework (Spec 3).
- **Visual generation + `design.md`** — brand-consistent images; `design.md`
  holds the brand and is seeded from the website scrape (Spec 4; file in
  Spec 2).
- **Generative-UI cockpit** — the whole operator surface is generative, not
  fixed React (Spec 6).
- **Cross-client agency view** — a portfolio dashboard across tenants;
  necessary, scheduled for after the vertical slice ships.

## Rendering decision (thesys)

- **Lead magnet** — a hosted interactive web object; thesys is the generator;
  export (PDF/PPTX) is a feature. A build-time spike decides whether thesys's
  SDK renders the persisted object or we render an owned format.
- **Opt-in page** — owned static MDX/HTML, hosted by us. Not thesys.
- **Cockpit** — thesys C1 generative UI (internal surface only).
- Prospect-facing surfaces are owned and hosted by us; the internal cockpit may
  be runtime-generative. thesys pricing is a due-diligence item.

## Email sending

Campaign emails send via a Maestro-managed Resend account from a per-client
sending subdomain (DKIM/SPF auto-provisioned in the parent zone). Unsubscribe
+ suppression are centralized v1 scope (CAN-SPAM). Bring-your-own-ESP is a
later option.

## Build order

**0 (bootstrap) → 1 → 2 → 3 → 4 → 5 → 6 → 7.** Spec 0 is bootstrapped to
"enough to build Spec 1," then builds and co-evolves through the product
specs. The first running campaign — the sellable proof — lands at the end of
Spec 5. Spec 7 (edit learning) is last — it learns from edits, so the product
must be in use.

## Repos and the build workflow

The system separates *planning* from *coding* into two repos, deliberately.

- **`kimprobably/maestro-agent-planning`** — the **planning repo**. Hermes
  (the Slack-resident agent) has read+write access. The design doc, the eight
  specs, the Engineering Charter, the Coding Standards, the staged Linear
  project, and any plans live here. This is where it is safe to *get messy* —
  planning iterates fast and informally, with Hermes in the loop.
- **The coding repo** — a new repo for the product code. **The factory
  (Spec 0), via Fabro, is the only writer.** You cannot hand-commit to it.
  Every change travels a deterministic, evaluable Fabro pathway that runs the
  Engineering Charter, the Coding Standards, and the eval suite as gates — so
  the coding repo is always in a known, standards-compliant state. This is the
  enforcement mechanism: standards are not asked for, they are the only way
  in.
- **`maestro-os`** — the existing repo: home of Fabro, Hermes, and the factory
  pieces being modularized into Spec 0.

The flow: messy planning in `maestro-agent-planning` → a spec → the factory
reads it, plans, builds in isolated Daytona sandboxes, reviews against the
charter, integrates → the coding repo. Nothing reaches the coding repo except
through that gated pathway.

**Open for the architect:** the exact home of the factory's own workflows
(maestro-os, the planning repo, or the coding repo) and whether maestro-os
remains the factory host or is folded in. The specs are written
repo-agnostic — paths are relative within the coding repo — so this decision
does not change them.

## Development process

- **Built by the factory (Spec 0)** — modular, eval-gated Fabro workflows.
  Bootstrapped by hand / superpowers, then self-extending. Co-evolves with the
  product; never gates the product path.
- **Fabro split rule** — AI pipelines are Fabro workflows; deterministic
  CRUD/provisioning lives in the TS command core; a command that wraps a
  workflow is a thin trigger.
- **Compounding** — after each spec, update `knowledge/known-gotchas.md` and
  append directional decisions to the Decision Log. (The EveryInc
  compound-engineering plugin was evaluated and not adopted — ~90% overlap with
  the superpowers suite.)
- **Decision homes** — feature shape → this doc; per-spec irreversible calls →
  the spec's ADR; build learnings → `known-gotchas.md`;
  cross-session → auto-memory; directional decisions → the Decision Log.

## Guardrails for a non-coder on Claude Code

Aidan drives the CLI through Claude Code without being a coder. Safety is by
construction: typed `CommandError` codes, the Tenant Scope Lint, and shipped
**operator instructions for Claude Code** (a `CLAUDE.md` / skill teaching the
safe Maestro sequences and the destructive commands that need confirmation —
`client.delete`, `client.purge`, `campaign.launch`).

## What this is not

- Not per-prospect personalization. Campaigns are brain-level.
- Not cold outbound in v0. The campaign is an inbound lead-magnet funnel.
- Not a CRM. The product keeps a tenant-scoped lead store (companies,
  contacts, captures) for dedup, analytics, and delivery, and pushes leads to
  the client's CRM. The client runs their pipeline in their own system; this
  is not the system of record.
- Not multi-agency SaaS. v0 is one agency operating N client tenants.
  Self-service signup and billing are out of scope.
- Not dependent on scaledown. Tested; it dropped buyer signals and runs gpt-4o.
  The compression layer is our own cheap-model claim extraction.

## Open risks

- The command-core refactor touches every existing CLI command — done
  domain-by-domain with parity tests.
- The grounded-node primitive must be got right in Spec 1; every spec depends
  on its schema, validator, and index.
- Brain quality depends on source quality; thin sources/research yield thin
  campaigns.
- Grounding discipline (cite only real nodes, invent nothing) is the core
  generation risk — defended by a deterministic validator and a >30%-drop
  hard-fail.
- Email sending pulls in deliverability, suppression, bounce handling.
- thesys is a third-party dependency with non-public pricing; the export is
  the escape hatch.
- The factory (Spec 0) is the largest non-product investment; it must not
  block the product path.

## Decision Log

Append-only. Each entry: the decision, the date, why, and what was rejected.

- **2026-05-16 — Build inside `maestro-os`.** Rejected: a new repo; a monorepo
  app. Why: the repo already runs Fabro + a CLI. *Superseded — see below.*
- **2026-05-16 (supersedes above) — Two repos: planning vs Fabro-gated
  coding.** Planning, specs, and the charter live in
  `kimprobably/maestro-agent-planning` (Hermes read+write, deliberately
  messy). The product code lives in a new coding repo that *only* the factory
  writes to, via Fabro. Why: separating messy planning from a deterministic,
  standards-gated codebase makes the standards unbypassable — the only way
  into the coding repo is the gated Fabro pathway. The factory's own home is
  an open architect decision.
- **2026-05-16 — TypeScript, not Rust.** Why: strict TS + Zod + lint-enforced
  layers give the rigor without a second language.
- **2026-05-16 — File-based brain, not embeddings.** Rejected: a vector DB.
  Why: connected markdown + citations is enough structure.
- **2026-05-16 — No review gate.** Why: the brain and generation must be usable
  immediately; `human_edited` protects edits.
- **2026-05-16 — Hermes dropped from the product.** Rejected: per-client Hermes
  agents as the harness. Why: a brain-bearing agent in front of a knowledge
  product creates ambiguous fact ownership.
- **2026-05-16 — Command core + thin CLI; no MCP server.** Rejected: an MCP
  tool per command. Why: Claude Code has a shell; ~20 MCP tools would be
  sprawl with no consumer. HTTP binding added with the cockpit.
- **2026-05-16 — ICP is Aidan (inbound content/lead-magnet agency).** Why:
  proven relationships; Octave-style products are enterprise/outbound.
- **2026-05-16 — The campaign is the unit (vertical slice).** Rejected: four
  separate asset files. Why: AI-era software ships coherent slices.
- **2026-05-16 — Generate real artifacts, drop the templates.** Rejected: the
  old magnetlab archetype/block-schema scaffolding. Why: 2026 models can
  generate a coherent whole artifact; grounding + a fixed container replace
  templates.
- **2026-05-16 — Lead magnet is a hosted web object, export secondary.**
  Rejected: PDF-first delivery.
- **2026-05-16 — Campaign pieces are reusable first-class objects.** Why: a
  lead magnet or page should be usable across campaigns.
- **2026-05-16 — Maestro-managed Resend + per-client sending subdomain.**
  Rejected: bring-your-own-ESP in v0.
- **2026-05-16 — Build the product with a modular Fabro software factory
  (Spec 0).** Rejected: building solely with superpowers (kept for
  bootstrapping). Why: modular, eval-gated workflows de-risk it; Fabro is
  proven; the factory is strategically the highest-value asset.
- **2026-05-16 — Compound-engineering plugin not adopted.** Why: ~90% overlap
  with the superpowers suite.
- **2026-05-16 — Brain provenance: `client` / `market` / `internal`.** Why:
  provenance names whose knowledge it is — what tracing and grounding need —
  independent of acquisition method. (Refines the earlier
  source/research/internal naming: the client's own website is `client` even
  though it was acquired by scraping.)
- **2026-05-16 — Brain Research is its own spec (Spec 3).**
- **2026-05-16 — Performance feedback loop is in v1.** campaign-runtime
  performance → `internal` claims → next campaign-generate.
- **2026-05-16 — scaledown rejected.** Tested: it dropped buyer signals (3 of 8
  at rate 0.5) and runs gpt-4o internally. Compression layer is our own
  cheap-model claim extraction instead.
- **2026-05-16 — `post` object type added.** Why: the campaign generated the
  funnel but nothing that drives traffic to it. v0 generates post content;
  auto-publishing to social is a later spec.
- **2026-05-16 — Tiptap AI Toolkit in the cockpit.** Local tweaks only;
  grounding-aware; grounding re-validated on save.
- **2026-05-16 — Unified grounded-node primitive adopted.** Claims, objects,
  and campaign manifests are one primitive — markdown + frontmatter +
  citations + `human_edited` + id, validated by one grounding rule, in layers.
  Why: one mental model, and — the key reason — it makes provenance traceable
  end to end (a `trace` command walks the citation graph both ways).
- **2026-05-16 — All seven specs are v1 scope.** Rejected: cutting to a
  4-spec critical path. Why: a v1 has shipped and demand is proven — this is a
  rebuild; all seven are required for the vertical slice to work properly.
- **2026-05-16 — Folded in: provenance tracing, lead delivery, URL+LinkedIn
  auto-intake, visual generation with a `design.md` brand file, fully
  generative-UI cockpit. Cross-client agency view scheduled for after the
  slice ships.**
- **2026-05-16 — SilverBullet and Obsidian evaluated, not adopted.** Both are
  whole apps, not libraries; Obsidian's wikilinks are a worse fit than
  line-range citations. Kept: SilverBullet validates that markdown + a derived
  frontmatter index is queryable with no database. The brain is files + index.
- **2026-05-16 — Storage = vault (files) + Neon; the seam is wake-tolerant vs.
  real-time.** The vault is touched only by the operator and workflows
  (cold-start-tolerant); Neon is touched by prospects in real time and by
  always-on services. Rejected: putting the lead store / runtime data on the
  Daytona volumes, and per-tenant or service-local SQLite — a sleepy
  per-tenant volume cannot serve a public conversion path, SQLite is
  single-writer and unreliable over a remote volume, and multiple services
  need shared access. One Neon project, tenant-scoped by column.
- **2026-05-16 — Neon: shared tables + `tenant_slug` + Row-Level Security, not
  per-tenant tables/schemas/DBs.** Rejected: a table/schema/database per
  tenant. Why: the cross-client agency view becomes a `UNION` over N tenants;
  migrations would run N× with drift risk; tenant creation would become a DDL
  operation; operator `users` are cross-tenant anyway. RLS plus the DataScope
  accessor give separate-table isolation without the cost. Vault isolation
  stays physical (volume per tenant) — each store gets the isolation that
  matches its access tempo.
- **2026-05-16 — Lead store is normalized: `companies` + `contacts` +
  `captures`.** Rejected: a flat `campaign_leads` table — it cannot represent
  one person across two campaigns or roll up to a company. The product is a
  lead store, not a CRM; leads are delivered to the client's CRM.
- **2026-05-16 — The platform principle (SOA mandate) baked into Spec 1.**
  Every capability is a command; commands are the only inter-component
  interface; components own their tables/files; no back doors; the registry is
  reflective; designed externalizable. Why: the product's horizontal
  components must be recomposable by agents and sellable standalone, and
  (Stevey's Platforms Rant) a platform cannot be bolted on later. One shared
  database stays modular via logical table-ownership, not separate DBs,
  enforced by a Component Ownership Lint.
- **2026-05-16 — An Engineering Charter codifies how we build.**
  `specs/engineering-charter.md` — the architectural invariants, how
  decisions are made and recorded, how they are maintained, and how a new
  capability is added. The factory's review gate enforces it.
- **2026-05-16 — Coding Standards consolidated into one canonical doc.** The
  prior coding-standards kit (10 principles + anti-patterns, distilled from
  the last platform, the global `CLAUDE.md`, and OpenAI harness-engineering
  practice) and the thin maestro-os `knowledge/coding-standards.md` draft are
  merged into one canonical `knowledge/coding-standards.md`, re-anchored to
  this product's architecture (command core, Neon/Drizzle, grounded nodes).
  Two rubrics, two layers: the Charter is macro (architecture); the Coding
  Standards are micro (how a file is written). The factory reviews against
  both.
- **2026-05-16 — Edit Learning is Spec 7.** Every human edit to a grounded
  node is captured (before/after diff), a cheap model infers why, and the
  learning routes: `taste` → `internal` brain claims + proposed `voice.md`
  changes; `defect` → candidate eval cases + prompt-improvement signals. A key
  concept from the v1. It closes the compounding loop and makes the eval suite
  grow itself from real usage. Defect-derived eval cases go to a review queue,
  not auto-promoted — a wrong inference must not poison the suite.
- **2026-05-16 — Evals at every layer.** No AI output ships without an eval,
  and the eval is the gate. Every AI step (extraction, distillation,
  generation, the web object, visuals, the C1 UI, edit inference, every
  factory workflow) has an eval named in its spec's DoD. The suite is not
  static — Spec 7 harvests regression cases from edits.
- **2026-05-16 — Elegance pass.** A grounded node is one flat `<id>.md` file
  at every layer with same-stem render siblings (no per-object directories);
  the campaign manifest is a markdown node, not `.toml`. Dropped: the
  file-based `memory/` event log (→ Neon `events`), the `published_pages`
  table (it is `campaign_pages`), and the `audit_log` table (→ `events`).
