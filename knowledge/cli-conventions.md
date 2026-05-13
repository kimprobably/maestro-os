# CLI Conventions

Status: draft v0.1 for Tim review

## Contract

Every `maestro` command is usable by both humans and agents.

Defaults:

- Machine-readable JSON output.
- `--format text` available for human-readable output when useful.
- `--help` on every command and subcommand.
- No secrets in stdout, stderr, logs, or persisted invocation records.

## Exit Codes

- `0`: success.
- `1`: validation or user-correctable input failure.
- `2`: infrastructure, provider, auth, or network failure.
- `3`: denied by policy, gate, or permission.

## Output Envelope

Default JSON shape:

```json
{
  "ok": true,
  "data": {},
  "warnings": [],
  "next": []
}
```

Failure shape:

```json
{
  "ok": false,
  "error": {
    "code": "validation_failed",
    "message": "Human-readable message",
    "retryable": false
  },
  "next": []
}
```

`next` should contain agent-actionable recovery hints when appropriate.

## Idempotency

State-changing commands accept `--idempotency-key`.

If the caller does not provide one, generate one from stable run context when possible. Never use wall-clock time alone for operations that may be retried.

## Logging

Every command invocation should eventually write a sanitized record to `cli_invocations`:

- Command name.
- Sanitized args.
- Run id when present.
- Exit code.
- Duration.
- Cost when known.

Do not log token values, API keys, raw cookies, OAuth tokens, or full env dumps.

## Required Commands

Phase 2 target commands:

- `maestro slack post --persona <name> --thread <ts> --text <s>`
- `maestro slack ack-gate <gate-id> --decision approve|reject|edit`
- `maestro memory get <namespace>`
- `maestro memory append <namespace> < event.json`
- `maestro memory load-brief <namespace>`
- `maestro db query --read "SELECT..."`
- `maestro knowledge get <key>[,<key>]`
- `maestro verify dot-syntax <path>`
- `maestro workflow register <path>`

## Safety

`maestro db query` is read-only unless the command name explicitly says otherwise.

Any command that can send, merge, deploy, delete, migrate, enrich at scale, or write durable memory must support dry-run or explicit human gate integration.
