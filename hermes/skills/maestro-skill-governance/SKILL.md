# Maestro Skill Governance

Use this skill when Hermes wants to remember a repeatable procedure, change an existing skill, promote a generated skill, or decide whether something belongs in a skill versus a Fabro workflow.

## Core Rule

Hermes self-learning is useful for drafts and small operating habits. It is not approval evidence.

Do not treat Hermes self-evaluation as sufficient for customer-facing content, code generation standards, payments, production deploys, outbound sends/imports, security policy, or Fabro workflow behavior. Those changes require external evidence.

## Skill Versus Fabro Workflow

Use a Hermes skill for:

- Judgment-heavy operating habits.
- Soft routing and channel behavior.
- Research/planning patterns.
- Reusable checklists.
- Low-risk lessons that help future conversations.

Use a Fabro workflow for:

- Deterministic repeated execution.
- Anything with approvals, retries, artifacts, or gates.
- Code changes.
- Data mutation.
- Customer-facing production work.
- Work where Promptfoo, CI, or review artifacts decide pass/fail.

## Generated Skill Policy

Background self-improvement may create a new class-level skill draft when a durable lesson emerges.

Background self-improvement must not rewrite curated Maestro skills. If a curated skill needs a change, summarize the proposed patch and route it through a Fabro/Promptfoo-backed promotion gate or ask Tim explicitly.

Curated Maestro skills include:

- `fabro-babysitter`
- `maestro-integrations`
- `maestro-memory`
- `maestro-skill-governance`
- `maestro-spec-planning`

## Promotion Gate

Before a generated skill becomes trusted procedure for important work, require:

1. A concise diff or proposal.
2. At least three representative scenarios.
3. Deterministic checks for forbidden behavior: no secrets, no broad env dumps, no ungated sends, no direct app-code edits from Slack, no production deploy without approval, no skipping evidence.
4. Promptfoo rubric eval when subjective quality matters.
5. A final human or Fabro approval artifact.

Record the result in the run ledger or a Kanban task. Only keep a compact pointer in Hermes memory.

## Promptfoo Use

Use Promptfoo for subjective policy and quality checks:

- Voice/content quality.
- Skill instruction quality.
- Spec quality.
- Workflow quality.
- Model comparisons.

Use deterministic scripts for structural checks:

- Required sections exist.
- Required phrases/policies are present.
- Forbidden commands or secret patterns are absent.
- Approval gates are present for risky domains.

Promptfoo failure or missing eval artifacts means the skill is still a draft for important work.
