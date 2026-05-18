# Client Tenant Foundation Spec (Spec 1)

## Purpose

Establish the foundation every other GTM spec builds on:

1. A **per-client tenant model** — one isolated tenant per agency client, with
   its own Daytona volume (the vault), config, and credentials.
2. The **grounded-node primitive** — the shared markdown-node schema, the
   grounding validator, the index pattern, and the `trace` command. Every
   layer of the product (claims, objects, campaigns) is this one primitive.
3. The **harness-agnostic command core** — typed, Zod-contracted commands with
   a CLI binding. Claude Code is the day-one harness.
4. The **two storage guards** — the Tenant Scope Lint for the vault and the
   DataScope accessor + Row-Level Security for Neon.

This spec produces a provisioned, smoke-tested tenant and the primitive +
command surface used to operate it. It produces no brain, campaign, or page.

## Context

See the design doc and its "Repos and the build workflow" section. The product
is a multi-tenant GTM tool — one agency, N client tenants, each with a brain
and running campaigns — built into the **coding repo** by the factory (Spec 0)
via Fabro; specs and planning live in the `maestro-agent-planning` repo.
Everything in the product is one primitive — a grounded node — composed in
layers, so that the provenance of every generated idea is traceable end to
end. This spec defines that primitive.

## Non-Goals

- Do not extract a brain (Spec 2), research (Spec 3), generate or run campaigns
  (Specs 4–5), or build the cockpit (Spec 6).
- Do not build the HTTP binding of the command core — that lands with the
  cockpit (Spec 6). No MCP server (Claude Code drives the CLI through its
  shell).
- Do not solve hardened secrets management. v0 stores credentials as `env:`
  references.
- Do not implement billing or self-service signup. Tenant creation is an
  operator action.

## Tenant Model

A tenant is `clients/<slug>/` — the **vault**, on a per-tenant Daytona volume:

```
clients/<slug>/
  .config.toml          tenant config (not a grounded node)
  artifacts/            raw inputs — uploaded docs, scraped pages (layer 0)
  brain/
    claims/<provenance>/ grounded claims, by provenance (layer 1) — Spec 2
    topics/             computed topic summaries — Spec 2
    .index.json         derived index
  knowledge/            voice.md, icp.md, design.md — Spec 2
  objects/              grounded objects (layer 2) — Spec 4
    .index.json
  campaigns/            grounded campaign manifests (layer 3) — Spec 4
    .index.json
```

A soft-deleted tenant moves to `clients/.archived/<slug>-<timestamp>/`.

`.config.toml`:

```toml
[tenant]
slug = "acme"
display_name = "Acme Co"
created_at = "2026-05-16T00:00:00Z"

[operators]
emails = ["tim@maestro.example", "ops@acme.example"]

[daytona]
volume_id     = "vol-abc123"
sandbox_label = "client-acme"

[fabro]
allowed_workflows = ["brain-extract", "brain-research", "campaign-generate",
                     "tenant-smoke"]

[providers]
# references only, never inline secrets; empty until set
resend_api_key_ref = ""
```

## The Grounded-Node Primitive

Every unit of knowledge or content is a **grounded node**: one flat markdown
file `<id>.md` — YAML frontmatter + body — with same-stem sibling files for
any derived renders. The product is grounded nodes in four layers, each citing
the layer below:

```
artifacts (layer 0)  →  claims (1)  →  objects (2)  →  campaign (3)
                      cite ↓         cite ↓          cite ↓
```

Artifacts are the floor — raw inputs, no downward citations; they are *cited*
but are not themselves grounded nodes.

### Node schema

Required frontmatter on every grounded node:

```yaml
id: cl-2026-05-16-7f3a9c        # <prefix>-YYYY-MM-DD-<6 hex>
type: claim | object | campaign # the layer
subtype: ...                    # layer-specific (Spec 2/4)
status: active | archived
created_at: 2026-05-16T13:21:08Z
updated_at: 2026-05-16T13:21:08Z
human_edited: false
citations:
  - ref: art-2026-05-14-1a2b3c   # an id one layer down
    locator:                      # optional, present for precise refs
      line_start: 142
      line_end: 158
      quote: "We always end up working with founders who..."
```

Id prefixes: `art-` artifact, `cl-` claim, `lm-`/`pg-`/`em-`/`po-`/`vi-`
object subtypes, `camp-` campaign. Id pattern: `^<prefix>-\d{4}-\d{2}-\d{2}-[a-f0-9]{6}$`.

A node's body carries inline `<!-- grounds: <id> -->` annotations on each
distinct unit; the union of inline ids must equal `citations[].ref`.

### The grounding validator

A shared library function (`core/grounding.ts`) used by every workflow that
writes nodes. For a node it asserts:

- Every `citations[].ref` resolves to an existing, non-archived node/artifact
  exactly **one layer down**.
- Where a `locator` is present, the line range is valid against the cited file
  and `quote` substring-matches that range (whitespace-normalized).
- The inline-annotation union equals `citations[].ref`.

Content that cites nothing, or cites a missing/archived/wrong-layer node, is
**dropped or flagged** by the calling workflow — never silently kept. There is
no review gate; the validator is the quality floor.

### The index

Each node-holding directory carries a derived `.index.json`, regenerated after
any write: each node's id → type, subtype, status, `human_edited`,
`citations`, and a **reverse map** (cited id → ids that cite it). The files are
the source of truth; the index is a regenerable cache. `grounding_stale: true`
marks a node citing something since archived or changed.

### `human_edited` protection

A node with `human_edited: true` is never overwritten by regeneration unless a
`force` flag is passed. The extractor/generator never sets the flag true; only
a hand edit or a cockpit edit does.

### The `trace` command

`trace.node` — input `{ tenant, nodeId }`. Walks the citation graph both ways
and returns:

- **Lineage (down)** — the node → the nodes it cites → … → the raw artifacts at
  the floor, with each artifact's locator (line range + quote, or URL).
- **Usage (up)** — every node that cites this node, to the campaign layer.

This is the product's provenance capability: point at a generated asset, see
every claim and the real source behind it. Surfaced in the CLI and the cockpit
(Spec 6).

## Storage Guards

- **Vault — Tenant Scope Lint.** A static lint over Fabro workflow graphs:
  any node touching the filesystem under `clients/` must reference
  `{{ inputs.tenant }}` in its path. Enforced by `maestro verify
  workflow-quality` and CI.
- **Neon — DataScope accessor + RLS.** All Neon access goes through a
  tenant-scoped accessor that injects `tenant_slug` into every query; raw
  cross-tenant queries are forbidden by lint. Every tenant-scoped table also
  carries a Postgres Row-Level Security policy as the hard backstop. Neon is
  one shared project; this spec creates the connection module, the accessor,
  the RLS scaffold, and the two foundational tables `tenants` and `events`
  (schema below). The campaign-runtime tables land in Spec 5, the auth tables
  in Spec 6.
- **Component Ownership Lint.** Each component owns a declared set of Neon
  tables and vault subdirs; the lint flags any code that reads or writes
  another component's tables/files directly instead of calling its commands.
  This is what keeps one shared database modular (see The command core is the
  platform).

## Neon Schema

This spec owns the two foundational tables (`db/migrations/foundation/`). The
`tenants` registry is cross-tenant (it lists tenants — no `tenant_slug`
scoping); `events` is tenant-scoped with an RLS policy.

```sql
CREATE TABLE tenants (
  slug         TEXT PRIMARY KEY,
  display_name TEXT,
  status       TEXT NOT NULL DEFAULT 'active',   -- active | archived
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW());

CREATE TABLE events (
  id          BIGSERIAL PRIMARY KEY,
  tenant_slug TEXT NOT NULL,
  kind        TEXT NOT NULL,        -- e.g. tenant.provisioned, brain.extract.completed
  actor       TEXT,                 -- operator email, or a workflow/run id
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX idx_events_tenant ON events(tenant_slug, created_at DESC);
```

`events` is the tenant activity log — every spec appends to it (onboarding,
extraction, campaign runtime, operator actions). It replaces the old
file-based `memory/` log. Harnesses read it via an `events.list` command.

## Command Core

Product behavior lives in a typed command core (`cli/src/core/`), one module
per domain (`client`, `node`, `trace`, `knowledge`). A command:

```ts
interface Command<I, O> {
  name: string;                 // dotted, e.g. "client.create"
  summary: string;
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  handler: (input: I, ctx: CommandContext) => Promise<O>;
}
```

Handlers validate input and output against the Zod schemas; errors are
`CommandError` with a stable `code`. `core/registry.ts` exports a frozen
`COMMANDS` map. The CLI (`cli/src/index.ts`) is a thin binding that enumerates
the registry — a new command appears in the CLI with no hand-wiring. The HTTP
binding (Spec 6) binds the same registry.

### The command core is the platform

The command core is not just a CLI convenience — it is the product's
**platform**. The product is built as a vertical slice (campaigns), but every
horizontal capability (send an email, build a lead magnet, write a post, run a
factory workflow) is a modular component that an agent can recompose or that
could be packaged and sold standalone. The mandate, baked in here at the
foundation because it cannot be bolted on later:

1. **Every capability is a command** — a typed Zod contract in the registry.
   There is no product behavior that is not a command.
2. **Commands are the only interface between components.** A component never
   reads another component's tables or vault files directly — it calls that
   component's command. No back doors, no "internal-only" shortcuts, ever.
3. **Components own their data.** Each component owns a set of Neon tables and
   vault subdirs; only its own commands touch them. This is how one shared
   database stays modular — the boundary is *logical ownership*, not separate
   databases. A **Component Ownership Lint** enforces it: a component's code
   may not query another component's tables (the Neon analogue of the Tenant
   Scope Lint).
4. **The registry is reflective.** A `meta.commands` command returns every
   command's name, summary, and input/output JSON Schema, so an agent can
   discover and recompose capabilities.
5. **Designed to be externalizable from the ground up.** The same command
   contract serves the CLI binding, the HTTP binding (Spec 6), and any future
   external API. v0 ships internal-only; externalizing a component (selling it
   standalone) additionally needs per-caller auth, rate-limiting/quotas, usage
   metering, and contract versioning — none built in v0, but the command core
   is designed so they attach without re-architecting.
6. **Contracts are versioned.** A command's Zod input/output is an interface;
   an additive change is free, a breaking change needs a versioned command and
   a deprecation path. The factory's review step flags breaking contract
   changes.

Every other spec obeys this: each exposes its capabilities as commands and
accesses other components only through their commands. The Engineering Charter
(`specs/engineering-charter.md`) is the authoritative statement; the factory's
review gate enforces it.

`meta.commands` is a command of this spec.

### Commands in this spec

- `client.create` — `{ slug, displayName, operatorEmails }`. Runs the
  onboarding workflow; idempotent on partial failure (slug reserved by
  `mkdir`).
- `client.list` — `{ includeArchived? }`.
- `client.switch` — `{ slug }`. Writes `.maestro/current-client`.
- `client.delete` — `{ slug, confirm }`. Soft-delete; refuses unless
  `confirm === slug`.
- `client.purge` — `{ archiveName, force? }`. Hard-purge; destroys the volume.
- `client.secrets.set` / `client.secrets.validate` — provider refs;
  `set` refuses inline secrets (`InlineSecretRejected`).
- `trace.node` — `{ tenant, nodeId }`. The provenance walk above.
- `knowledge.get` — `{ tenant, key }`. Reads `clients/<tenant>/knowledge/<key>`,
  falls back to base `knowledge/<key>`.
- `events.list` — `{ tenant, kind?, limit? }`. Reads the tenant activity log
  from the `events` table.
- `meta.commands` — `{}`. Returns every registered command's name, summary,
  and input/output JSON Schema — the reflective registry an agent uses to
  discover and recompose capabilities.

## Onboarding Workflow

`workflows/gtm/onboard-client.fabro`, invoked by `client.create`:

1. Validate inputs. Append `tenant.onboarding.started` (Neon `events`).
2. Reserve the slug via `mkdir clients/<slug>` (atomic); collision →
   `TenantSlugCollision`.
3. Create the vault directory tree.
4. Provision a Daytona volume; persist `volume_id`.
5. Provision the tenant's Neon row scope (no DDL — tenant rows are created
   lazily; this step just records the tenant in a `tenants` registry row).
6. Seed `knowledge/` with empty `voice.md`, `icp.md`, `design.md` stubs.
7. Run `tenant-smoke.fabro`; require green.
8. Append `tenant.provisioned`.

Each step checks the latest event before re-running, so a resumed run skips
completed steps.

Deterministic provisioning (mkdir, Daytona API, Neon row) runs in the TS
command core; only multi-step AI work is a Fabro workflow. `onboard-client`
is mostly deterministic and is a thin orchestration.

## Smoke-Test Workflow

`workflows/gtm/tenant-smoke.fabro` — two positive checks and one negative:

1. Write and read back a node file under `clients/<slug>/artifacts/`.
2. Append and retrieve a `tenant.smoke` event.
3. **Negative** — a sub-step intentionally reads `clients/__other__/...`; it
   MUST fail `TenantScopeViolation`. The smoke inverts the result.

## Credentials

Provider credentials are `env:<NAME>` references in `.config.toml`. The
thesys and Resend keys are Maestro-level env vars, not per-tenant refs.
`clients/*/.config.toml` is gitignored except the reference tenant (empty
refs). `client.secrets.set` refuses any value not starting with `env:` or
`secret://`.

## Reference Tenant

A reference tenant `acme` is provisioned for CI — committed `.config.toml`
(empty refs), a dedicated Daytona project.

## Acceptance Criteria

- `client.create` provisions a tenant end to end: vault tree, Daytona volume,
  Neon registry row, green smoke — no manual cleanup; a re-run after partial
  failure resumes.
- The command registry exists; the CLI enumerates it; a Claude Code session
  drives the product by running `maestro` commands in its shell.
- The grounding validator: a node citing a real artifact passes; a node citing
  a missing/archived/wrong-layer id fails; a node whose `quote` does not
  substring-match its line range fails.
- `trace.node` on a node returns its full downward lineage to artifacts and
  its upward usage.
- `human_edited: true` protects a node from regeneration unless `force`.
- `client.delete` refuses without `confirm`; `client.purge` destroys the
  volume.
- `client.secrets.set` refuses an inline secret value.
- `tenant-smoke.fabro` is green including the negative scope check.
- `maestro verify workflow-quality` rejects a workflow writing under
  `clients/` without a `tenant` input; the lint rejects a raw cross-tenant
  Neon query.

## Definition Of Done

- The grounded-node library (`core/node.ts`, `core/grounding.ts`,
  `core/index.ts`), the command core + registry + CLI binding, the reflective
  `meta.commands`, the Neon connection module + DataScope accessor + RLS
  scaffold, the `tenants` + `events` tables (`db/migrations/foundation/`), the
  Tenant Scope Lint, the Component Ownership Lint, and the onboarding and smoke
  workflows are checked in.
- Tests cover every `client.*`, `trace.node`, `knowledge.get`, `events.list`
  command against the core directly, the grounding validator's pass/fail
  cases, and the partial-failure resume.
- `docs/CLIENT-TENANT-FOUNDATION.md` and `docs/GROUNDED-NODE.md` document the
  tenant lifecycle, the node schema, the validator, and `trace`.
- The reference tenant `acme` is committed.
- A failing fixture `evals/datasets/workflow-quality/leaky-tenant-workflow.fabro`
  proves the Tenant Scope Lint.

## Risks

- **The primitive must be right.** Every spec depends on the node schema,
  validator, and index. Mitigation: build and test it first, in isolation,
  with the grounding validator's cases as the contract.
- **Command-core refactor touches every existing CLI command.** Mitigation:
  domain-by-domain, with a registry-parity test gating each cutover.
- **Daytona provisioning can fail mid-onboarding.** Mitigation: idempotent
  onboarding; `client.delete` cleans partial state.
- **RLS misconfiguration could leak rows.** Mitigation: a cross-tenant-read
  test per table; RLS is the backstop, the DataScope accessor is the primary.

## Spec Kitty

Work packages: grounded-node library, grounding validator, index, `trace`,
command core + registry + CLI, Neon connection + DataScope + RLS, Tenant Scope
Lint, onboarding workflow, smoke workflow, reference tenant, docs.

## ADR

No ADR required for v0. A future ADR is required before the first paying
tenant, covering the secrets upgrade path, the HTTP binding's auth model, and
tenant data-export/deletion obligations.
