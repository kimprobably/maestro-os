# Cockpit Spec (Spec 6)

## Purpose

The operator surface — a **generative-UI** browser app over the product. The
operator logs in, sees each client's campaigns and live performance, browses
the brain, **traces any generated asset back to its sources**, runs commands
(extract a brain, research, generate and publish a campaign), and edits nodes.

The cockpit is the HTTP binding of the command core plus a thin generative-UI
shell. It is the second harness — optional, built last; Aidan operates the
product through Claude Code until it exists. It is also a deliberate test of
whether the factory (Spec 0) can build a generative-UI application.

## Context

Depends on Specs 1–5. The cockpit owns no product logic and no knowledge — it
binds the command core (Spec 1) over HTTP and renders command output. The only
brain is the client brain.

**Fully generative UI.** The cockpit is not a hand-built set of fixed React
pages. It is a thin shell — auth, the command-core HTTP binding, and a
**thesys C1** rendering layer — and its screens (campaign overview, the brain,
the `trace` view, performance dashboards) are *generated* by C1 from
structured command output. The one fixed component is the **Tiptap editor**
(editing is inherently stateful) — invoked from the generative shell. C1 is
used only on this internal operator surface, never for anything a prospect
sees.

## Non-Goals

- Do not host public pages, capture leads, or send email — Spec 5.
- Do not add product logic — every mutation is a command-core command over
  the HTTP binding.
- No self-service signup or billing; no SSO (magic-link auth only in v0).
- No real-time collaborative editing — last-write-wins with an mtime conflict
  check (1–3 operators per tenant).
- A cross-client agency portfolio view is a known later addition — the
  generative shell makes it cheap to add (it is one more command + render).

## Architecture

```
  apps/cockpit (Next.js, Vercel)
   /[tenant]/* (auth)  /api/auth/* (magic link)
   command-core HTTP binding  ──►  maestro command core
   generative shell: command output → thesys C1 (<C1Component>)
   fixed component: Tiptap + AI Toolkit editor
        │                         │
   Neon: users, magic_link_tokens   vault-service (Daytona files)
```

### The command-core HTTP binding

Spec 1 deferred the HTTP binding here. It is a pure binding: it enumerates the
same command registry, exposes each command as an authenticated HTTP endpoint
(JSON body → typed input; typed output → JSON; `CommandError` → structured
error). Per-call auth is the operator session; the binding also re-checks that
the command's `tenant` is one the operator may access. The Spec 1
registry-parity test is extended to the HTTP binding.

### The generative shell

The shell turns operator intent into `command → structured output → C1 render`.
C1 receives structured command output (never raw vault files) and renders the
view. Adding a screen is adding a command + a render prompt, not building a
page. On a thesys outage the shell falls back to a plain shadcn table render of
the same command output — the cockpit is operator-only, so the blast radius is
small.

### Stack

Next.js 16 App Router; `iron-session` cookie sessions; Drizzle on Neon for
auth state only; Resend for magic-link emails; `@thesysai/genui-sdk` for the
generative shell; Tiptap v3 + `tiptap-markdown` + the **Tiptap AI Toolkit**
for editing; `gray-matter` for frontmatter.

## Neon Schema

The cockpit owns only auth state (`db/migrations/cockpit/`):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE, display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_login_at TIMESTAMPTZ);

CREATE TABLE magic_link_tokens (
  token TEXT PRIMARY KEY, email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ,
  user_agent TEXT, ip_inet INET);
```

`users` is intentionally cross-tenant (an operator accesses several tenants).
There is no `audit_log` table — operator actions are events in the Spec 1
`events` table, rendered by the activity view.

## Functional Requirements

### Auth — magic link

- `POST /api/auth/magic-link` (`{ email }`) — token, 10-min expiry, Resend
  email; rate limit 3/email/10min; always 200 (no enumeration).
- `GET /auth/verify?token=…` — validates, marks used, upserts `users`, sets the
  session cookie (`iron-session`, HttpOnly, Secure, SameSite=Lax, 14-day
  rolling).
- `POST /api/auth/logout`.

### Tenant access

Tenant configs are read at boot, refreshed every 60s, indexed by slug and by
`[operators].emails`. `/[tenant]/*` calls `requireTenantAccess`, which **404s**
(not 403) if the operator is not listed.

### Generative screens

Each is `command → C1 render`:

- **Tenant home** — campaigns (`campaign.list`) + funnel summaries
  (`campaign.stats`), brain claim counts, recent activity. C1 adapts the layout
  to how many campaigns exist and their stage.
- **Campaign view** — the manifest, the live funnel, links to bound objects.
  Action buttons invoke `campaign.publish` / `pause` / `republish` /
  `leads.export` / `generate` over the HTTP binding; outward-facing actions
  confirm first.
- **Brain view** — claims by provenance/subtype (`claim.list`), topic
  summaries.
- **Activity** — the tenant `events` stream, polled.

### The trace view

A first-class screen over `trace.node`. Point at any generated object or
campaign and see the **provenance graph**: the asset → its bound objects →
the brain claims they cite → the raw artifacts, each with its source (the
Reddit URL, the transcript line + quote, the website page). And the reverse:
point at a claim, see every campaign that uses it. This is the cockpit's
expression of the product's core promise — every line of a campaign provably
traces to a real source.

### Brain and object editing

- `/[tenant]/objects/[objectId]/edit` and `/[tenant]/claims/[claimId]/edit` —
  the Tiptap editor over a node's markdown (a post, opt-in page, email, lead
  magnet `content.md`, or a claim), frontmatter in a sidebar, `human_edited`
  toggle one click.
- Save flow: the server action validates path + tenant scope and required
  frontmatter, PUTs via `vault-service`. Conflict detection: a stale mtime
  gets a 409 + reload-or-overwrite prompt. No silent overwrite.

### AI-assisted editing (Tiptap AI Toolkit)

Local operator edits — rewrite, tone, expand — *not* wholesale generation
(that stays `campaign.generate`). The toolkit's agent runs against the cockpit
backend (the product's own model stack). Edits land as **track changes** the
operator accepts. When the edited node is a campaign object or claim, the agent
receives the bound brain claims as context; **on save the Spec 1 grounding
validator re-runs** — an agent-introduced unit citing no claim blocks the save
until the operator cites or cuts it. The editor cannot weaken the moat.

## Acceptance Criteria

- A user gets a magic link, clicks it, lands signed in; `/acme` loads for an
  operator in the operator list and 404s for one who is not.
- The tenant home and campaign view are C1-rendered from `campaign.list` /
  `campaign.stats`; on a simulated thesys outage they fall back to a table
  render.
- Publish/pause/regenerate buttons invoke the matching commands over the HTTP
  binding and reflect the new status.
- The trace view, given a generated object, renders the full provenance graph
  down to artifacts and their source URLs/quotes; given a claim, the campaigns
  using it.
- Editing a node round-trips to the Daytona volume (verified via the CLI);
  `human_edited` is preserved by the next regeneration.
- An AI-Toolkit edit produces track-changes; on save grounding re-runs; an
  ungrounded agent-introduced unit blocks the save.
- Two concurrent edits: the second save gets a 409.
- The HTTP binding exposes exactly the command registry and refuses a command
  whose `tenant` the operator may not access.

## Definition Of Done

- `apps/cockpit/` — Next.js App Router: auth, tenant routing, the generative
  shell + C1 integration, the trace view, Tiptap + AI-Toolkit editing, the
  activity view.
- The command-core **HTTP binding** built; the registry-parity test extended
  to it.
- `vault-service` built or shared with Spec 5's campaign-runtime — not
  duplicated.
- `db/migrations/cockpit/` — `users`, `magic_link_tokens`.
- `docs/COCKPIT.md` — architecture, env vars (`THESYS_API_KEY`), Vercel
  deployment runbook.
- Playwright e2e: magic-link login, tenant 404, a C1 screen + table fallback,
  campaign publish via the HTTP binding, the trace view, an edit with the
  grounding-revalidation block.
- `evals/cockpit-generative-ui-quality.yaml` — the C1 generative UI is an AI
  output: on fixture command outputs, the rendered screen surfaces the
  required fields, the actions map to the right commands, and it degrades to
  the table fallback when C1 is unavailable.
- The Qlty linter and Tenant Scope Lint pass.
- `maestro verify spec-quality specs/gtm/cockpit.md` passes.

## Risks

- **C1 dependency for the whole shell.** Mitigation: every screen falls back to
  a plain shadcn table render of the same command output; operator-only, small
  blast radius.
- **The HTTP binding is a new network surface.** Mitigation: session auth,
  per-call tenant re-check, the same typed command core as the CLI.
- **Generative UI is unproven for a full app.** This is deliberate — the
  cockpit is the factory's test case. Mitigation: the table fallback means a
  C1 failure degrades, not breaks.
- **Tiptap markdown round-trip is lossy on edge syntax.** Mitigation: a
  constrained schema; anything outside it stays as raw markdown.
- **AI Toolkit could introduce ungrounded content.** Mitigation: grounding
  re-validation on save blocks it; local tweaks only.

## Spec Kitty

Work packages: auth, tenant routing, the command-core HTTP binding, the
generative shell + C1, the trace view, Tiptap + AI-Toolkit editing, the
activity view, the table fallback, e2e tests.

## ADR

No ADR required for v0. A future ADR is required before a paying tenant,
covering magic-link → SSO, whether C1 stays or is replaced by fixed
components, the HTTP binding's auth model when accessed outside the cockpit,
and collaborative editing.
