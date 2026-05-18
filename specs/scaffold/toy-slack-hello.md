# Toy Slack Hello Workflow Spec

WORKFLOW: toy-slack-hello
PERSONA: test-bot
PURPOSE: Post a short hello message to the configured Slack channel, append a run summary memory event, and exit.

INPUTS:
- text, optional, default: "hello from Maestro"

STAGES:
1. Validate Slack channel and token environment variables are present.
2. Post the message with `maestro slack post --persona test-bot`.
3. Append a run-summary event to `run/toy-slack-hello`.
4. Emit a final summary.

GATES:
- No human approval required because this is a reversible dev-only post to the test channel.

QUALITY:
- The generated workflow must pass `maestro verify dot-syntax`.
- The workflow must be registerable with `maestro workflow register`.
