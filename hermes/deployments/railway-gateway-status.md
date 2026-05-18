# Railway Gateway Status

Updated: 2026-05-14 16:22 America/New_York

## Service

- Project: `maestro-fabro`
- Project ID: `ff0c7d8c-ae9b-40a5-a1e1-3574961f971a`
- Environment: `production`
- Service: `maestro-hermes-gateway`
- Service ID: `854dd17d-fd93-44b5-8d21-5b31a54ac0f0`
- Volume: `maestro-hermes-gateway-volume`
- Volume ID: `302415f3-93d3-4306-b081-b2623c413b75`
- Mount path: `/data`
- Deployment ID: `414a7be3-2268-46b4-8809-128c2ea00218`
- Deployment status: `SUCCESS`

## Runtime

- PID 1 is `hermes -p maestro-operator gateway run --replace --accept-hooks`.
- `FABRO_SERVER` points at `https://fabro-maestro-production.up.railway.app/api/v1`.
- Fabro CLI auth is stored for the Railway Fabro server.
- Hermes MCP discovery shows Fabro enabled with 5 selected tools.
- OpenAI Codex OAuth is connected in the `maestro-operator` profile.
- Active model config is `openai-codex/gpt-5.5`.
- Codex model smoke returned `CODEX_RAILWAY_OK` from inside the Railway
  container.
- Live memory now has the managed Maestro operating-memory block.
- Channel `C0AHCRH4EP4` is bound to `maestro-memory` and `fabro-babysitter`.
- Railway egress to `https://slack.com/api/api.test` returns HTTP 200.
- Slack `chat.postMessage` smoke posted successfully to channel `C0AHCRH4EP4`.

## Intentional Smoke Settings

- `SLACK_ALLOWED_USERS` is set to Tim and Ajmal.
- `GATEWAY_ALLOW_ALL_USERS=false`.
- OpenRouter remains configured as fallback, but the gateway now defaults to
  Codex.
- Cron job `fabro-exception-watch` is active every 120 minutes and delivers to
  `slack:C0AHCRH4EP4`.

## Follow-Ups

- Add low-risk MCP auths next: Linear/GitHub/Daytona worker controls before
  Stripe, Beehiiv publish, outbound send/import, or production deploy writes.
- Feed additional business context through Slack prompts that explicitly ask the
  operator to update memory, Kanban, docs, or skills.
