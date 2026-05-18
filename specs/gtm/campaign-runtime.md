# Campaign Runtime Spec (Spec 5)

## Purpose

Make a generated campaign *run*: host its opt-in page and lead magnet at
public URLs, capture leads into the lead store, send the delivery email and
the nurture sequence, track the funnel, **deliver captured leads to the
client**, and feed performance back into the brain as `internal` claims.

This is the other half of the buyable outcome. After Spec 5 a campaign is
live: a prospect lands, opts in, receives the lead magnet, enters nurture, the
funnel is tracked, the client gets the leads, and the brain learns.

## Context

Depends on Specs 1–4. **Headless** — driven by the command core, serves public
traffic, no operator UI of its own (Spec 6).

Per the design doc storage model: the prospect-facing runtime is an always-on,
cross-tenant service; it cannot read sleepy per-tenant Daytona volumes on the
conversion path. All runtime state is **Neon** (one project, tenant-scoped by
`tenant_slug`, DataScope accessor + RLS). The campaign objects it renders are
read from the vault via the broker, with a cache, off the hot path.

## Non-Goals

- Do not generate campaign content (Spec 4) or build a UI (Spec 6).
- Do not personalize emails per prospect beyond the lead's own captured
  fields.
- Do not implement an MTA — sending is via Resend.
- Do not be a CRM — the lead store is for dedup, analytics, and delivery;
  leads are pushed out to the client's CRM.
- Do not publish posts to social — post objects are content; the operator
  publishes them.
- No bring-your-own-ESP in v0.

## Neon Schema

Spec 5 owns these tables (`db/migrations/campaign-runtime/`), all tenant-scoped
with an RLS policy. The cross-cutting `events` table is the Spec 1 table; this
spec only inserts campaign rows into it.

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL, name TEXT, domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_slug, domain));

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  email TEXT NOT NULL, full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_slug, email));

CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL, campaign_id TEXT NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  capture_data JSONB NOT NULL DEFAULT '{}',
  magnet_token TEXT NOT NULL UNIQUE,
  unsub_token  TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_slug, campaign_id, contact_id));

CREATE TABLE campaign_pages (
  tenant_slug TEXT NOT NULL, campaign_id TEXT NOT NULL,
  page_slug TEXT NOT NULL, status TEXT NOT NULL,        -- live | paused
  body_html TEXT NOT NULL, capture_schema JSONB,
  source_mtime TIMESTAMPTZ NOT NULL,
  rendered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_slug, campaign_id),
  UNIQUE (tenant_slug, page_slug));

CREATE TABLE campaign_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_slug TEXT NOT NULL, campaign_id TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  kind TEXT NOT NULL,            -- page_view|optin|delivered|opened|clicked
                                 -- |downloaded|bounced|complained|unsubscribed
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX idx_campaign_events_funnel
  ON campaign_events(tenant_slug, campaign_id, kind, created_at);

CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL, campaign_id TEXT NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  piece TEXT NOT NULL,           -- delivery | nurture-1 | nurture-2 …
  send_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending|sent|skipped|failed
  resend_id TEXT, attempts INT NOT NULL DEFAULT 0, last_error TEXT,
  sent_at TIMESTAMPTZ,
  UNIQUE (contact_id, piece));    -- exactly-once per piece per contact
CREATE INDEX idx_scheduled_emails_due
  ON scheduled_emails(status, send_at) WHERE status = 'pending';

CREATE TABLE suppressions (
  tenant_slug TEXT NOT NULL, email TEXT NOT NULL,
  reason TEXT NOT NULL,          -- unsubscribed | bounced | complained
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_slug, email));
```

The funnel analytics (`campaign_events`) is separate from the general `events`
table only because high-volume `GROUP BY` is a distinct access pattern.

## Architecture

A standalone `services/campaign-runtime/` Node service on Railway: public
routes, the Resend webhook, the scheduled-email sender loop, and the
command-core-invoked publish/pause/deliver paths. It reads campaign object
files from the vault via the shared `vault-service` broker (with a short-TTL
cache); all mutable state is Neon.

## The Lead Store

A capture creates a normalized lead: resolve/create the `company` (from the
email domain), resolve/create the `contact`, insert a `capture` linking the
contact to the campaign. The same person opting into two campaigns is one
contact with two captures. `campaign_events` and lead delivery reference
`contact_id` + its company.

## Functional Requirements

### Commands

- `campaign.publish` — `{ tenant, campaignId, pageSlug? }`. Reads the campaign
  manifest, resolves its bound object ids, renders the opt-in-page object to
  sanitized HTML, hosts the lead magnet web object, upserts `campaign_pages`
  `live`, verifies the sending subdomain, advances the manifest `lifecycle` to
  `live`. Idempotent.
- `campaign.pause` — `{ tenant, campaignId }`. Sets `campaign_pages.status` and
  the manifest `lifecycle` to `paused`; the page 404s, capture refused, pending
  sends held.
- `campaign.republish` — re-renders from the (possibly edited) bound objects.
- `campaign.stats` — `{ tenant, campaignId }`. The funnel from
  `campaign_events`, SQL `GROUP BY`.
- `campaign.leads.export` — `{ tenant, campaignId, format }`. CSV/JSON of
  contacts + companies + capture context.
- `campaign.learn` — `{ tenant, campaignId }`. Invokes `brain-learn` (Spec 2)
  with the campaign's performance summary → `internal` claims.

### Public opt-in page

`GET /<tenant>/<campaign-slug>` — serves `campaign_pages.body_html` from Neon
only; never wakes a sandbox. 404 if absent/unknown/`paused`. Appends a
`page_view` event (deduped per visitor token, 30 min). The page is owned
static HTML rendered from the opt-in-page object's MDX via `remark` +
`rehype-sanitize` (strict schema, no raw HTML/script).

### Form capture

`POST /<tenant>/<campaign-slug>/capture` — body validated against the page's
`capture_schema` (JSON Schema Draft-07 subset, `ajv`), 10KB cap, per-IP
per-campaign rate limit. On valid capture: upsert company + contact, insert
the capture, append `optin`, enqueue the `delivery` email (`send_at = now`)
and each `nurture-N` (`send_at = now + delay_hours`). A suppressed email is
still recorded as a contact but no emails are enqueued. Returns
`{ ok, magnet_url }`. Capture writes only Neon — no vault write on the hot
path.

### Lead magnet delivery

- `GET /<tenant>/<campaign-slug>/magnet/<token>` — resolves `magnet_token`,
  serves the lead magnet **web object** (from `lm-….web.json`), appends a
  `downloaded` event.
- `GET …/magnet/<token>/export` — serves `lm-….pdf` for prospects who want a
  file.

### Sending

Maestro-managed Resend; per-client sending subdomain
(`<slug>.send.<maestro-domain>`, DKIM/SPF auto-provisioned in the parent
zone — `campaign.publish` blocks until verified). A poll loop claims due
`scheduled_emails` rows transactionally (`UPDATE … RETURNING`); `UNIQUE
(contact_id, piece)` + an idempotency key make sends exactly-once. Each send
checks `suppressions` first; on success stores `resend_id`; on failure retries
3× with backoff then `failed`. Every email carries a one-click unsubscribe
link + `List-Unsubscribe` header and the CAN-SPAM compliance block.

### Delivery webhooks

`POST /webhooks/resend` — Resend signature verified against
`RESEND_WEBHOOK_SECRET` (trimmed + length-checked on load). Maps events to
`campaign_events`; a `bounced`/`complained` adds the email to `suppressions`.

### Unsubscribe

`GET /u/<token>` — resolves `unsub_token`, adds to `suppressions`, marks the
contact's pending `scheduled_emails` `skipped`, shows a confirmation page.

### Lead delivery to the client

The funnel's purpose — captured leads reach the agency's client. Per-tenant
config (`[lead_delivery]` in `.config.toml`) selects one or more:

- **Email digest** — instant, daily, or weekly; a digest of new contacts +
  companies + capture context to the client's address. A scheduled job builds
  digests; instant fires on capture.
- **CSV/JSON export** — `campaign.leads.export`, an operator pull.
- **Webhook / CRM push** — POST each new lead to a configured client webhook
  or CRM endpoint, with retry + a dead-letter on persistent failure.

Without this the funnel produces nothing the client can use; it is v1 scope.

### Performance tracking

`campaign.stats` aggregates `campaign_events` into the funnel: page views →
opt-ins (rate) → delivered/opened/clicked → downloads → per-nurture-step →
bounces → unsubscribes — a SQL `GROUP BY`, not in-memory. No recommendations
engine, no real-time in v0.

### Feedback to the brain

`campaign.learn` (and a periodic trigger on campaign milestones) invokes
`brain-learn` (Spec 2) with the campaign's performance summary; notable
signals become `internal` claims that inform the next `campaign.generate`.

## Acceptance Criteria

- `campaign.publish` renders the opt-in page, hosts the lead magnet, verifies
  the subdomain, advances the manifest `lifecycle` to `live`.
- `GET /<tenant>/<slug>` serves from Neon without waking a sandbox; a paused
  campaign 404s.
- A valid capture creates/links company + contact, inserts a capture, records
  `optin`, enqueues delivery + nurture; the same email twice does not
  double-enqueue.
- The sender loop sends delivery immediately and nurture at `delay_hours`;
  `UNIQUE (contact_id, piece)` prevents double-sends across a restart.
- A `bounced` webhook suppresses the email; a later capture records the
  contact but enqueues nothing.
- `GET /u/<token>` suppresses and cancels pending nurture.
- `GET …/magnet/<token>` serves the web object; `…/export` serves the PDF.
- `campaign.stats` returns a funnel whose opt-in count equals the `optin`
  event count.
- Lead delivery: a captured lead reaches the client via the configured
  channel (digest / export / webhook).
- `campaign.learn` produces `internal` brain claims from a campaign's
  performance.
- The `/webhooks/resend` endpoint rejects an invalid signature; a cross-tenant
  request is refused; an RLS test proves a query cannot read another tenant's
  rows.

## Definition Of Done

- `services/campaign-runtime/` with the public routes, webhook, sender loop,
  Resend integration + subdomain provisioning, lead-delivery channels, and
  tenant-scope enforcement.
- Commands `campaign.{publish,pause,republish,stats,leads.export,learn}` in the
  command core, tested.
- `db/migrations/campaign-runtime/` with the tables + RLS policies + Drizzle
  config.
- `integrations/resend.ts` (send, domain provisioning, webhook verification)
  with mocked tests.
- Tests: capture → enqueue, sender idempotency across a restart, suppression
  on bounce, unsubscribe cancelling sends, webhook signature rejection,
  cross-tenant + RLS refusal, lead delivery per channel.
- `docs/CAMPAIGN-RUNTIME.md` documents the architecture, env vars, the
  sending-subdomain DNS runbook, and the Resend webhook setup.
- `knowledge/known-gotchas.md` updated.
- `maestro verify spec-quality specs/gtm/campaign-runtime.md` passes.

## Risks

- **Deliverability.** A new subdomain has no reputation. Mitigation: per-client
  subdomains isolate reputation; low warm volume; warmup is a later spec.
- **Sending is stateful.** Mitigation: explicit `scheduled_emails` state,
  `UNIQUE (contact_id, piece)`, bounded retries, suppression — no
  fire-and-forget.
- **Webhook secret whitespace.** Mitigation: trimmed + length-checked on load;
  called out in the runbook.
- **Daytona cold start on the prospect path.** Mitigation: public pages + lead
  magnet served from Neon / cache; the hot path never waits on a sandbox.
- **Capture abuse.** Mitigation: per-IP rate limit, body cap, schema
  validation, hashed-IP audit.
- **CAN-SPAM / consent.** Mitigation: one-click unsubscribe + compliance block
  required in the template; suppression honored before every send; emails go
  only to opted-in leads.
- **Lead-delivery webhook failure loses leads.** Mitigation: retry +
  dead-letter; the lead is always in the lead store regardless.

## Spec Kitty

Work packages: the runtime service, public routes, capture + lead store,
sender loop, Resend integration + subdomain provisioning, webhooks,
suppression/unsubscribe, tracking + `campaign.stats`, lead-delivery channels,
the brain feedback trigger, migrations + RLS, docs.

## ADR

No ADR required for v0. A future ADR is required before a paying tenant,
covering bring-your-own-ESP, the sending-reputation/warmup model, durable job
infrastructure for the sender loop, and CRM-sync depth.
