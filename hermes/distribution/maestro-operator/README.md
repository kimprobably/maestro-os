# Maestro Operator Distribution

Install locally from a checked-out `maestro-os` repo:

```bash
hermes profile install ./hermes/distribution/maestro-operator --alias --yes
```

Then configure:

```bash
maestro-operator auth add openai-codex
maestro-operator gateway start
```

Before running the gateway, replace placeholder Slack channel IDs in `config.yaml`, copy `.env.example` to `.env`, add secrets, and install the bundled skills.

This distribution intentionally excludes memories, sessions, credentials, and run-ledger state.
