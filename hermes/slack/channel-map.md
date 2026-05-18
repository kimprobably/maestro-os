# Slack Channel Map

Use Slack channel IDs in Hermes config. Names below are human labels.

| Channel | Mode | Skills | Tools/MCP | Write policy |
| --- | --- | --- | --- | --- |
| `C0AHCRH4EP4` | Current operator home | `maestro-memory`, `fabro-babysitter` | Slack, Fabro, Kanban | Status, summaries, approvals, first smoke channel |
| `#agent-control` | Operator home | `maestro-memory`, `fabro-babysitter` | Slack, Fabro, Kanban | Status, summaries, approvals |
| `#maestro` | General business operator | `maestro-memory`, `fabro-babysitter` | Slack, Fabro, Linear, Kanban | Safe business coordination |
| `#fabro-runs` | Fabro operator | `fabro-babysitter` | Fabro, GitHub read, Daytona inspect | Retry/fork/patch only with evidence |
| `#email-drafts` | Johann | `maestro-memory`, email drafting skill | Beehiiv draft/read, Fabro | No publish/send without approval |
| `#deploys` | Smith deploys | `fabro-babysitter` | Vercel, Railway, GitHub, Fabro | Production deploy approval required |
| `#payments` | Finance ops | payment SOP skill | Stripe read default | Refunds/charges/customer mutations gated |
| `#outbound` | Quill | outbound SOP skill | Plusvibe/CRM draft/read, Fabro | Sends/imports gated |
| `#code` | Smith code | `fabro-babysitter`, code worker skill | Daytona, GitHub, Fabro, Codex lanes | PR/review/test evidence required |

## Hard Isolation Plan

Per-channel prompts and skill bindings are useful, but not enough for sensitive write surfaces.

Use hard isolation for:

- `#payments`
- outbound send/import tools
- production deploy tools
- any channel with broad customer data access

Hard isolation options:

1. Separate Hermes profiles and Slack bots with separate MCP configs.
2. A policy proxy MCP server that exposes only approved operations.
3. Separate external service credentials per channel/mode.

Do not expose write-capable Stripe, outbound, or production deploy tools to the general operator profile until hard isolation exists.
