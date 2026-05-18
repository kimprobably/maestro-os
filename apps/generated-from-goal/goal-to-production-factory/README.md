# Goal-to-Production Factory

Internal web tool demonstrating the complete Maestro factory workflow: accepting a vague product idea, expanding it into an implementation-ready spec, orchestrating implementation, review, and CI verification, then presenting quality gate status.

## Purpose

This tool demonstrates:
1. The Maestro factory loop for internal development
2. A reusable pattern for future agent-driven development workflows

## Architecture Overview

- **Backend**: Express server with file-based state persistence
- **Frontend**: Plain HTML/JS (no build step)
- **Workflow**: 7-stage pipeline with validators and human gates
- **Agents**: Spec generation, review, and code implementation

### System Components

```
Web Browser (UI)
    ↓ HTTP
Express API Server (routes, middleware)
    ↓ calls
Workflow Executor (stage orchestration)
    ↓ invokes
Stage Scripts & Agents
    ↓ persist
File-Based State (.maestro/factory/runs/)
```

## Setup

### Prerequisites

- Node.js 20+
- Maestro CLI installed and in PATH
- Spec Kitty CLI installed

### Installation

```bash
cd apps/generated-from-goal/goal-to-production-factory
npm install
```

### Create Required Directories

```bash
mkdir -p .maestro/factory/runs
mkdir -p specs/factory
```

### Prepare Example Goal

Create `specs/factory/vague-goal.md` with your product idea (3-5000 characters).

## Run

### Development Mode

```bash
npm run dev
```

Server starts on `http://localhost:3000`

### Production Mode

```bash
npm start
```

## Usage

1. **Open** `http://localhost:3000` in your browser
2. **Paste** a vague product idea into the textarea (3-5000 chars)
3. **Submit** to trigger the factory workflow
4. **Monitor** progress through 7 stages with real-time status
5. **Approve** human gates (spec approval, final handoff)
6. **Download** generated artifacts (spec, code, reviews, CI logs)

## Workflow Stages

1. **Load Context** — Load goal and knowledge base
2. **Write Spec** — Generate implementation-ready spec
3. **Review Spec** — Review spec for completeness (FLAG gate: approve spec)
4. **Implement Code** — Generate code with tests
5. **Verify CI** — Run typecheck, lint, tests, validators
6. **Final Review** — Check all quality gates (STOP gate: approve handoff)
7. **Emit Summary** — Generate run summary event

## API Endpoints

- `POST /api/submit` — Submit goal, start workflow, return runId
- `GET /api/status/:runId` — Get current workflow status
- `GET /api/artifact/:runId/:type` — Download artifact (spec/code/review/ci_log)
- `POST /api/approve-gate/:runId/:gateId` — Approve/reject human gate
- `POST /api/retry/:runId/:stageId` — Retry failed stage

## Troubleshooting

### Workflow Hangs

- Check stage timeout (5 minutes default)
- Review logs in `.maestro/factory/runs/<runId>/status.json`
- Retry failed stage via UI or API

### State Corruption

- Restore from backup: `.maestro/factory/runs/<runId>/status.backup.json`
- Delete run directory and restart workflow

### Agent Timeout

- Check Maestro CLI and Spec Kitty CLI are in PATH
- Verify knowledge base is accessible
- Increase timeout in `src/workflow/executor.ts` if needed

### CI Verification Fails

- Review CI output in `.maestro/factory/runs/<runId>/ci-output.json`
- Check generated code for TypeScript errors
- Run validators manually: `maestro verify <validator-name> <path>`

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── routes/         # API route handlers
├── workflow/       # Workflow executor and stage orchestration
├── state/          # File-based state management
├── agents/         # Agent prompt execution (spec, review, implement)
└── server.ts       # Express app setup

scripts/
├── stages/         # Stage scripts (shell + TypeScript)
└── validators/     # Deterministic validators

prompts/
└── factory/        # Agent prompts (markdown + JSON schemas)

public/
├── index.html      # Web UI
├── app.js          # Client-side JavaScript
└── styles.css      # Minimal styling

tests/
├── integration/    # API and workflow tests
└── unit/           # State management tests

docs/
├── architecture.md     # System architecture
└── workflow-stages.md  # Stage documentation
```

## Development Notes

- Route handlers must be under 30 lines
- All modules include constraint headers
- State writes are atomic (temp file + rename)
- All outputs validated with Zod schemas
- No empty catch blocks, structured logging only
- Validators after every output-producing stage

## Phase 2 Roadmap

- Migrate to Fabro-native workflow execution
- Add concurrent review fanout
- Integrate with Slack for persona messages
- Add workflow history UI
- Support multi-run management
